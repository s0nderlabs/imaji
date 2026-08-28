#!/usr/bin/env bash
# Unit tests for scripts/parse-reply.py. No network, no Mind, no API key.
# Run: bash scripts/parse-reply.test.sh
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARSE="$HERE/parse-reply.py"
FIX="$HERE/fixtures"
PY="${PYTHON:-python3}"

pass=0
fail=0

check() {
  local name="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    pass=$((pass + 1))
    printf 'ok   %s\n' "$name"
  else
    fail=$((fail + 1))
    printf 'FAIL %s\n     expected: %s\n     actual:   %s\n' "$name" "$expected" "$actual"
  fi
}

check_prefix() {
  local name="$1" prefix="$2" actual="$3"
  case "$actual" in
    "$prefix"*)
      pass=$((pass + 1))
      printf 'ok   %s\n' "$name"
      ;;
    *)
      fail=$((fail + 1))
      printf 'FAIL %s\n     expected prefix: %s\n     actual:          %s\n' "$name" "$prefix" "$actual"
      ;;
  esac
}

# 1. the Mind POSTed the kit and repeated the URL
out=$("$PY" "$PARSE" < "$FIX/send-kit-url.json")
check "kit url is extracted" \
  "KIT_URL=https://imaji.s0nderlabs.xyz/k/9b67acb83bf6c255a882cd82/v0.2.0" "$out"

# 2. the Mind wrote the kit but did not call the endpoint
out=$("$PY" "$PARSE" < "$FIX/send-kit-json.json")
check_prefix "kit json is recovered from pre/code" 'KIT_JSON={"version":"v0.3.0","repo":"s0nderlabs/imaji"' "$out"
kit_json="${out#KIT_JSON=}"
out=$(printf '%s' "$kit_json" | "$PY" -c 'import json,sys; print(json.load(sys.stdin)["card"]["accentWord"])')
check "recovered kit json parses" "film" "$out"

# 3. history shape, the Mind skipped the release
out=$("$PY" "$PARSE" < "$FIX/history-skipped.json")
check_prefix "skip is reported" "SKIPPED=Skipping v0.3.1:" "$out"

# 4. nothing to act on
out=$("$PY" "$PARSE" < "$FIX/send-nothing.json")
check "small talk yields NOTHING" "NOTHING" "$out"

# fingerprint mode picks the newest Mind message, not the message we sent
out=$("$PY" "$PARSE" --emit fingerprint < "$FIX/history-skipped.json")
check "fingerprint is the Mind reply" \
  "0001787894700000_7f0a1c2d-0000-4000-8000-000000000004" "$out"

# --after filters everything out when the baseline is already the newest
out=$("$PY" "$PARSE" --after "0001787894700000_7f0a1c2d-0000-4000-8000-000000000004" < "$FIX/history-skipped.json")
check "after filter blocks a stale reply" "NOTHING" "$out"

# --after lets a genuinely newer reply through
out=$("$PY" "$PARSE" --after "0001787894600000_7f0a1c2d-0000-4000-8000-000000000003" < "$FIX/history-skipped.json")
check_prefix "after filter passes a new reply" "SKIPPED=" "$out"

# --exclude-file drops an echo of the message we sent
sent="$(mktemp)"
printf 'imaji release job.\nrepo: s0nderlabs/imaji\ntag: v0.3.1\n' > "$sent"
out=$("$PY" "$PARSE" --emit fingerprint --exclude-file "$sent" < "$FIX/history-skipped.json")
check "exclude-file keeps the Mind reply" \
  "0001787894700000_7f0a1c2d-0000-4000-8000-000000000004" "$out"
rm -f "$sent"

# text mode strips the HTML
out=$("$PY" "$PARSE" --emit text < "$FIX/send-nothing.json")
check "text mode strips tags" "Understood. Ready when the release lands." "$out"

# garbage in, NOTHING out, never a traceback
out=$(printf 'not json at all' | "$PY" "$PARSE")
check "garbage yields NOTHING" "NOTHING" "$out"

printf '\n%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
