#!/usr/bin/env bash
# Offline tests for scripts/minds-send.sh. No Mind, no API key, no cognition spent:
# the CLI is a stub and the render endpoint is a local python server.
# Run: bash scripts/minds-send.test.sh
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEND="$HERE/minds-send.sh"
FIX="$HERE/fixtures"
PY="${PYTHON:-python3}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"; [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null' EXIT

pass=0
fail=0
check() {
  local name="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    pass=$((pass + 1)); printf 'ok   %s\n' "$name"
  else
    fail=$((fail + 1))
    printf 'FAIL %s\n     expected: %s\n     actual:   %s\n' "$name" "$expected" "$actual"
  fi
}

# A stand in for the Minds CLI. FAKE_MODE picks which conversation it acts out.
cat > "$TMP/fake-minds" <<'STUB'
#!/usr/bin/env bash
cmd="$1"
case "$cmd" in
  chat) echo '{"ok":true,"conversation":{"alias":"'"$3"'"}}'; exit 0 ;;
  history)
    case "${FAKE_MODE:-}" in
      timeout)
        if [ -f "$FAKE_STATE/sent" ]; then cat "$FAKE_FIXTURES/history-skipped.json"
        else echo '{"ok":true,"items":[{"fingerprint":"0001787894500000_old","senderType":0,"messageText":"<p>ok</p>"}]}'; fi ;;
      stale)
        # the conversation already ends on the very message send hands back
        echo '{"ok":true,"items":[{"fingerprint":"0001787894501513_7f0a1c2d-0000-4000-8000-000000000001","senderType":0,"messageText":"<p>last release kit</p>"}]}' ;;
      staleold)
        # and here it ends on something newer still
        echo '{"ok":true,"items":[{"fingerprint":"0009999999999999_newer","senderType":0,"messageText":"<p>last release kit</p>"}]}' ;;
      nohistory) exit 1 ;;
      *) echo '{"ok":true,"items":[{"fingerprint":"0001787894500000_old","senderType":0,"messageText":"<p>ok</p>"}]}' ;;
    esac
    exit 0 ;;
  send)
    cat > "$FAKE_STATE/sent"
    case "${FAKE_MODE:-}" in
      timeout) exit 3 ;;
      kitjson) cat "$FAKE_FIXTURES/send-kit-json.json"; exit 0 ;;
      auth) exit 4 ;;
      nohistory)
        FP="$(printf '%016d' "$(( $(date +%s) * 1000 + 5000 ))")"
        printf '{"ok":true,"reply":{"fingerprint":"%s_fresh","senderType":0,"messageText":"<p>https://imaji.s0nderlabs.xyz/k/9b67acb83bf6c255a882cd82/v0.4.0</p>"}}\n' "$FP"
        exit 0 ;;
      *) cat "$FAKE_FIXTURES/send-kit-url.json"; exit 0 ;;
    esac ;;
esac
exit 2
STUB
chmod +x "$TMP/fake-minds"

export FAKE_FIXTURES="$FIX"
export FAKE_STATE="$TMP"
export MINDS_BUILDER_API_KEY="not-a-real-key"
export MINDS_CLI="bash $TMP/fake-minds"
export IMAJI_POLL_INTERVAL=1
export IMAJI_POLL_TRIES=3
printf 'imaji release job.\nrepo: s0nderlabs/imaji\ntag: v0.2.0\n' > "$TMP/message.txt"

run() { bash "$SEND" --alias imaji-test --mind ABC-123 --message-file "$TMP/message.txt" \
  --work-dir "$TMP/work" "$@" 2>"$TMP/stderr.log"; }

# 1. the Mind answered inside the wait
rm -f "$TMP/sent"
export FAKE_MODE=happy
out=$(run)
check "happy path returns the kit url" \
  "KIT_URL=https://imaji.s0nderlabs.xyz/k/9b67acb83bf6c255a882cd82/v0.2.0" "$out"

# 2. --wait timed out with exit 3, the reply landed in history a moment later
rm -f "$TMP/sent"
export FAKE_MODE=timeout
out=$(run)
case "$out" in
  SKIPPED=Skipping\ v0.3.1*) pass=$((pass+1)); printf 'ok   %s\n' "exit 3 falls back to history" ;;
  *) fail=$((fail+1)); printf 'FAIL exit 3 falls back to history\n     actual: %s\n' "$out" ;;
esac
grep -q "polling history" "$TMP/stderr.log" \
  && { pass=$((pass+1)); printf 'ok   %s\n' "the poll actually ran"; } \
  || { fail=$((fail+1)); printf 'FAIL the poll actually ran\n'; }

# 3. the Mind wrote a kit but never POSTed it, and nobody asked us to
rm -f "$TMP/sent"
export FAKE_MODE=kitjson
out=$(run)
case "$out" in
  KIT_JSON=\{\"version\":\"v0.3.0\"*) pass=$((pass+1)); printf 'ok   %s\n' "kit json passes through without --render-fallback" ;;
  *) fail=$((fail+1)); printf 'FAIL kit json passes through\n     actual: %s\n' "$out" ;;
esac

# 4. same reply, but this time we render it ourselves
cat > "$TMP/server.py" <<'SRV'
import json, sys
from http.server import BaseHTTPRequestHandler, HTTPServer

class H(BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        kit = json.loads(body)
        auth = self.headers.get("Authorization", "")
        if auth != "Bearer test-token":
            self.send_response(401); self.end_headers()
            self.wfile.write(b'{"ok":false,"error":"bad token"}'); return
        out = json.dumps({
            "ok": True,
            "kitUrl": "http://127.0.0.1:%d/k/test-token/%s" % (self.server.server_port, kit["version"]),
            "filmStatus": "queued",
        }).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(out)))
        self.end_headers()
        self.wfile.write(out)
    def log_message(self, *a):
        pass

srv = HTTPServer(("127.0.0.1", 0), H)
print(srv.server_port, flush=True)
srv.serve_forever()
SRV
"$PY" "$TMP/server.py" > "$TMP/port.txt" &
SERVER_PID=$!
for _ in 1 2 3 4 5 6 7 8 9 10; do
  PORT="$(cat "$TMP/port.txt" 2>/dev/null | tr -d '\n')"
  [ -n "$PORT" ] && break
  sleep 0.3
done

rm -f "$TMP/sent"
export IMAJI_BASE_URL="http://127.0.0.1:$PORT"
export IMAJI_KIT_TOKEN="test-token"
export FAKE_MODE=kitjson
out=$(run --render-fallback)
check "render fallback POSTs the kit and returns the url" \
  "KIT_URL=http://127.0.0.1:$PORT/k/test-token/v0.3.0" "$out"

# 5. a wrong token is an ERROR line, not a crash
rm -f "$TMP/sent"
export IMAJI_KIT_TOKEN="wrong-token"
out=$(run --render-fallback)
export IMAJI_KIT_TOKEN="test-token"
check "a rejected token is reported, not thrown" "ERROR=render endpoint answered 401" "$out"

# 6. a rejected API key fails the run, it is not a Mind level outcome
rm -f "$TMP/sent"
export FAKE_MODE=auth
out=$(run)
rc=$?
check "auth failure exits 4" "4" "$rc"

# 7. local-release.sh builds the message and delegates to the same path
rm -f "$TMP/sent"
export FAKE_MODE=kitjson
export IMAJI_BASE_URL="http://127.0.0.1:$PORT"
export IMAJI_KIT_TOKEN="test-token"
printf 'Added the film.\n' > "$TMP/notes.txt"
out=$(IMAJI_REPO=s0nderlabs/imaji bash "$HERE/local-release.sh" \
  imaji-test ABC-123 v0.3.0 "$TMP/notes.txt" 2>"$TMP/local.log" | head -1)
check "local-release returns the kit url" \
  "http://127.0.0.1:$PORT/k/test-token/v0.3.0" "$out"

out=$(IMAJI_REPO=s0nderlabs/imaji bash "$HERE/local-release.sh" --dry-run \
  imaji-test ABC-123 v0.3.0 "$TMP/notes.txt" 2>/dev/null | grep -c 'render endpoint: POST')
check "local-release dry run prints the message without sending" "1" "$out"

# 8. the reply send handed back is the message the conversation already ended on.
#    A stale reply must never be reported as this release's kit.
rm -f "$TMP/sent"
export FAKE_MODE=stale
out=$(run); rc=$?
check "a reply equal to the baseline is refused" "" "$out"
check "the stale reply path exits 3" "3" "$rc"
grep -q "nothing newer than the baseline" "$TMP/stderr.log" \
  && { pass=$((pass+1)); printf 'ok   %s\n' "the stale reply fell through to the poll"; } \
  || { fail=$((fail+1)); printf 'FAIL the stale reply fell through to the poll\n'; }

# 9. same guard, with a baseline strictly newer than the reply
rm -f "$TMP/sent"
export FAKE_MODE=staleold
out=$(run); rc=$?
check "a reply older than the baseline is refused" "" "$out"
check "the older reply path exits 3" "3" "$rc"

# 10. history is down, so there is no baseline to read. The send clock stands in,
#     and a reply stamped after the send is still accepted.
rm -f "$TMP/sent"
export FAKE_MODE=nohistory
out=$(run)
check "the send clock fallback accepts a fresh reply" \
  "KIT_URL=https://imaji.s0nderlabs.xyz/k/9b67acb83bf6c255a882cd82/v0.4.0" "$out"
grep -q "falling back to the send clock" "$TMP/stderr.log" \
  && { pass=$((pass+1)); printf 'ok   %s\n' "the fallback baseline was used"; } \
  || { fail=$((fail+1)); printf 'FAIL the fallback baseline was used\n'; }

# 11. a real run leaves no bearer token behind in the work directory it keeps
rm -f "$TMP/sent"
export FAKE_MODE=kitjson
export IMAJI_KIT_TOKEN="test-token"
IMAJI_REPO=s0nderlabs/imaji bash "$HERE/local-release.sh" \
  imaji-test ABC-123 v0.3.0 "$TMP/notes.txt" >/dev/null 2>"$TMP/local2.log"
WORKDIR="$(sed -n 's/^local-release: working files kept at \([^,]*\),.*/\1/p' "$TMP/local2.log" | head -1)"
if [ -n "$WORKDIR" ] && [ -d "$WORKDIR" ] && ! grep -rq "Bearer test-token" "$WORKDIR" 2>/dev/null; then
  pass=$((pass+1)); printf 'ok   %s\n' "a real run scrubs the bearer line from its work dir"
else
  fail=$((fail+1)); printf 'FAIL a real run scrubs the bearer line from its work dir\n'
fi
[ -n "$WORKDIR" ] && rm -rf "$WORKDIR"

printf '\n%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
