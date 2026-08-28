#!/usr/bin/env bash
# Send one message to a Mind and come back with the one useful thing in the reply.
#
# This is the shared half of both imaji jobs: the same send, the same fingerprint
# guard, the same history fallback, the same reply extraction. templates/imaji.yml
# carries a copy of this file inline, written to disk by a heredoc step, so the
# workflow has no dependency on this repo at runtime.
#
# Usage:
#   scripts/minds-send.sh --alias <alias> --mind <mindId> --message-file <path> \
#     [--timeout <ms>] [--work-dir <dir>] [--render-fallback]
#
# Environment:
#   MINDS_BUILDER_API_KEY   required, the Builder API key. Never printed.
#   IMAJI_BASE_URL          required with --render-fallback
#   IMAJI_KIT_TOKEN         required with --render-fallback. Never printed.
#   MINDS_CLI               optional, defaults to "bunx @animocabrands/minds-cli@0.1.4"
#
# Stdout is exactly one line:
#   KIT_URL=<url>        the kit is rendered and reachable
#   KIT_JSON=<compact>   the Mind wrote a kit, nobody rendered it (no --render-fallback)
#   SKIPPED=<line>       the Mind decided this release does not earn a kit
#   NOTHING              the Mind replied, but with nothing we can use
#   ERROR=<line>         we reached the Mind but the render call failed
#
# Everything else goes to stderr. Exit is 0 for every Mind level outcome above,
# including a skip. Non-zero only for a real failure: bad arguments, auth, rate
# limit, no reply at all.
set -euo pipefail

ALIAS=""
MIND=""
MESSAGE_FILE=""
TIMEOUT="300000"
WORK_DIR=""
RENDER_FALLBACK="no"
POLL_TRIES="${IMAJI_POLL_TRIES:-20}"
POLL_INTERVAL="${IMAJI_POLL_INTERVAL:-15}"

while [ $# -gt 0 ]; do
  case "$1" in
    --alias) ALIAS="$2"; shift 2 ;;
    --mind) MIND="$2"; shift 2 ;;
    --message-file) MESSAGE_FILE="$2"; shift 2 ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --work-dir) WORK_DIR="$2"; shift 2 ;;
    --render-fallback) RENDER_FALLBACK="yes"; shift ;;
    -h|--help) sed -n '2,32p' "$0"; exit 0 ;;
    *) echo "minds-send: unknown argument: $1" >&2; exit 2 ;;
  esac
done

die() { echo "minds-send: $*" >&2; exit 2; }

[ -n "$ALIAS" ] || die "missing --alias"
[ -n "$MIND" ] || die "missing --mind"
[ -n "$MESSAGE_FILE" ] || die "missing --message-file"
[ -f "$MESSAGE_FILE" ] || die "message file not found: $MESSAGE_FILE"
[ -n "${MINDS_BUILDER_API_KEY:-}" ] || die "MINDS_BUILDER_API_KEY is not set"

# The alias regex the API enforces. Catch it here rather than in a 400.
case "$ALIAS" in
  *[!a-z0-9_-]*) die "alias must match ^[a-z0-9_-]+$, got: $ALIAS" ;;
esac
# Owner gated routes reject an uppercase Mind ID.
MIND="$(printf '%s' "$MIND" | tr '[:upper:]' '[:lower:]')"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARSE="${IMAJI_PARSE_REPLY:-$HERE/parse-reply.py}"
[ -f "$PARSE" ] || die "parse-reply.py not found at $PARSE"
PY="${PYTHON:-python3}"

if [ -z "$WORK_DIR" ]; then
  WORK_DIR="$(mktemp -d)"
fi
mkdir -p "$WORK_DIR"

export MINDS_NO_BANNER=1
export MINDS_SKIP_VERSION_CHECK=1
read -r -a MINDS_CMD <<< "${MINDS_CLI:-bunx @animocabrands/minds-cli@0.1.4}"

# 1. Ensure the conversation. Idempotent, and the alias is permanent per repo.
#    Reusing an alias against a different Mind throws alias_mind_mismatch, which
#    is worth failing on: it means MIND_ID changed under a live conversation.
echo "minds-send: ensuring conversation $ALIAS" >&2
if ! "${MINDS_CMD[@]}" chat create --alias "$ALIAS" --mind "$MIND" > "$WORK_DIR/chat.json" 2> "$WORK_DIR/chat.err"; then
  sed -e 's/[A-Za-z0-9_-]\{24,\}/[redacted]/g' "$WORK_DIR/chat.err" >&2 || true
  die "chat create failed for alias $ALIAS"
fi

# 2. Remember where the conversation ends, so a reply can never be mistaken for
#    an older message. Every path below is gated on this: a message is only this
#    release's reply if its fingerprint is strictly newer than the baseline.
#    A fingerprint is "<16 digit zero padded epoch ms>_<uuid>", so a zero padded
#    epoch ms is string comparable with one. When history gives us nothing (a
#    502, which this platform does return, or a conversation that is empty
#    because it is new) we fall back to the clock we are about to send at, minus
#    a minute of allowance for skew between this runner and the platform. What we
#    never do is fall back to no filter at all: that is how the previous
#    release's kit gets reported as this release's.
BASELINE=""
if "${MINDS_CMD[@]}" history "$ALIAS" --limit 1 > "$WORK_DIR/baseline.json" 2> "$WORK_DIR/baseline.err"; then
  BASELINE="$("$PY" "$PARSE" --emit fingerprint < "$WORK_DIR/baseline.json" || true)"
fi
if [ -n "$BASELINE" ]; then
  echo "minds-send: baseline fingerprint $BASELINE" >&2
else
  BASELINE="$("$PY" -c 'import time; print("%016d" % (int(time.time() * 1000) - 60000))' || true)"
  [ -n "$BASELINE" ] || die "no baseline fingerprint and no clock to fall back on"
  echo "minds-send: no baseline from history, falling back to the send clock $BASELINE" >&2
fi

# 3. Send. A full kit takes 134 to 144 seconds of Mind time, so the wait is long
#    on purpose. A --wait timeout exits 3 while the reply usually lands a few
#    seconds later, which is what step 4 is for.
echo "minds-send: sending $(wc -c < "$MESSAGE_FILE" | tr -d ' ') bytes, waiting up to ${TIMEOUT}ms" >&2
set +e
"${MINDS_CMD[@]}" send "$ALIAS" - --wait --timeout "$TIMEOUT" \
  < "$MESSAGE_FILE" > "$WORK_DIR/send.json" 2> "$WORK_DIR/send.err"
SEND_RC=$?
set -e

REPLY_FILE=""
# One guard, every path: newer than the baseline, and not an echo of the message
# we just sent. A reply handed straight back by send is not evidence of freshness
# on its own, because the CLI skips its own freshness check whenever its internal
# history call fails, and then --wait can return the previous release's reply.
FILTERS=(--after "$BASELINE" --exclude-file "$MESSAGE_FILE")
POLL="no"
case "$SEND_RC" in
  0)
    FRESH="$("$PY" "$PARSE" --emit fingerprint "${FILTERS[@]}" < "$WORK_DIR/send.json" || true)"
    if [ -n "$FRESH" ]; then
      echo "minds-send: send returned reply $FRESH" >&2
      REPLY_FILE="$WORK_DIR/send.json"
    else
      echo "minds-send: send returned nothing newer than the baseline, polling history" >&2
      POLL="yes"
    fi
    ;;
  3)
    echo "minds-send: send exited 3 (wait timeout or server error), polling history" >&2
    POLL="yes"
    ;;
  2) sed -e 's/[A-Za-z0-9_-]\{24,\}/[redacted]/g' "$WORK_DIR/send.err" >&2 || true
     die "send rejected the request (exit 2)" ;;
  4) echo "minds-send: the Builder API key was rejected (exit 4)" >&2; exit 4 ;;
  5) echo "minds-send: rate limited (exit 5)" >&2; exit 5 ;;
  *) sed -e 's/[A-Za-z0-9_-]\{24,\}/[redacted]/g' "$WORK_DIR/send.err" >&2 || true
     echo "minds-send: send exited $SEND_RC" >&2; exit "$SEND_RC" ;;
esac

if [ "$POLL" = "yes" ]; then
  i=0
  while [ "$i" -lt "$POLL_TRIES" ]; do
    i=$((i + 1))
    sleep "$POLL_INTERVAL"
    if ! "${MINDS_CMD[@]}" history "$ALIAS" --limit 5 > "$WORK_DIR/poll.json" 2>/dev/null; then
      echo "minds-send: poll $i history call failed, retrying" >&2
      continue
    fi
    FOUND="$("$PY" "$PARSE" --emit fingerprint "${FILTERS[@]}" < "$WORK_DIR/poll.json" || true)"
    if [ -n "$FOUND" ]; then
      echo "minds-send: poll $i found reply $FOUND" >&2
      cp "$WORK_DIR/poll.json" "$WORK_DIR/reply-source.json"
      REPLY_FILE="$WORK_DIR/reply-source.json"
      break
    fi
    echo "minds-send: poll $i, still nothing newer than the baseline" >&2
  done
fi

if [ -z "$REPLY_FILE" ]; then
  echo "minds-send: no reply after the wait and $POLL_TRIES polls" >&2
  exit 3
fi

# 4. Read the reply once, keep the plain text for the log, and decide.
"$PY" "$PARSE" --emit text "${FILTERS[@]}" \
  < "$REPLY_FILE" > "$WORK_DIR/reply.txt" || true
RESULT="$("$PY" "$PARSE" "${FILTERS[@]}" < "$REPLY_FILE")"

# 5. The Mind wrote a kit but never called the endpoint. Do it for it, so a
#    forgetful Mind still produces a kit instead of a dead job.
case "$RESULT" in
  KIT_JSON=*)
    if [ "$RENDER_FALLBACK" = "yes" ]; then
      [ -n "${IMAJI_BASE_URL:-}" ] || die "--render-fallback needs IMAJI_BASE_URL"
      [ -n "${IMAJI_KIT_TOKEN:-}" ] || die "--render-fallback needs IMAJI_KIT_TOKEN"
      printf '%s' "${RESULT#KIT_JSON=}" > "$WORK_DIR/kit.json"
      echo "minds-send: the Mind did not POST the kit, rendering it here" >&2
      set +e
      CODE="$(curl -sS -o "$WORK_DIR/render.json" -w '%{http_code}' --max-time 180 \
        -X POST "${IMAJI_BASE_URL%/}/api/render" \
        -H "Authorization: Bearer $IMAJI_KIT_TOKEN" \
        -H 'Content-Type: application/json' \
        --data-binary @"$WORK_DIR/kit.json" 2> "$WORK_DIR/render.err")"
      CURL_RC=$?
      set -e
      if [ "$CURL_RC" -ne 0 ]; then
        RESULT="ERROR=render endpoint unreachable (curl exit $CURL_RC)"
      elif [ "$CODE" != "200" ] && [ "$CODE" != "201" ]; then
        RESULT="ERROR=render endpoint answered $CODE"
      else
        URL="$("$PY" -c 'import json,sys
try:
    d = json.load(open(sys.argv[1]))
except Exception:
    d = {}
print(d.get("kitUrl") or "")' "$WORK_DIR/render.json")"
        if [ -n "$URL" ]; then
          RESULT="KIT_URL=$URL"
        else
          RESULT="ERROR=render endpoint answered $CODE with no kitUrl"
        fi
      fi
    fi
    ;;
esac

printf '%s\n' "$RESULT"
