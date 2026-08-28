#!/usr/bin/env bash
# Run the onboard flow from this Mac, without GitHub. Mirrors the "Gather the
# evidence" step of templates/imaji.yml (same brief, same evidence, same send),
# except that it also sees untracked files (a repo that has no commits yet).
#
# Usage: scripts/local-onboard.sh <alias> <mindId> [base-url] [token]
# Env:   MINDS_BUILDER_API_KEY (required), IMAJI_REPO (owner/name, required when
#        there is no git remote), IMAJI_BASE_URL, IMAJI_KIT_TOKEN
set -euo pipefail
ALIAS="${1:?alias}"; MIND="${2:?mindId}"
BASE_URL="${3:-${IMAJI_BASE_URL:-https://imaji.s0nderlabs.xyz}}"
TOKEN="${4:-${IMAJI_KIT_TOKEN:?IMAJI_KIT_TOKEN or 4th arg}}"
REPO="${IMAJI_REPO:-$(git remote get-url origin 2>/dev/null | sed -E 's#.*github.com[:/]##; s#\.git$##' || true)}"
[ -n "$REPO" ] || { echo "set IMAJI_REPO=owner/name" >&2; exit 2; }
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
WORK="$(mktemp -d)"; M="$WORK/message.txt"; : > "$M"
# The bearer token is a write credential for /api/render. It has to be in the
# message, but it does not have to survive in a mktemp dir afterwards.
scrub_message() {
  [ "${IMAJI_KEEP_WORK:-}" = "1" ] && return 0
  [ -f "$M" ] || return 0
  sed -i.bak 's|^authorization header: Bearer .*|authorization header: Bearer <kit token, scrubbed>|' "$M" 2>/dev/null || true
  rm -f "$M.bak"
}
trap scrub_message EXIT
cat >> "$M" <<'IMAJI_BRIEF'
imaji onboarding.

You are the Mind behind imaji for this repository. Read the evidence at the
bottom of this message and propose the brand: the name to use in public, one
accent colour as a hex value, whether the ground is light or dark, whether the
type is grotesque, serif or mono, and the voice in three adjectives. Remember
what you propose. I will correct it in chat if it is wrong, and the correction
sticks for every release after this one.

Then render one sample so I can see it. Produce a kit with version "onboarding",
outputs ["card"], and POST it to the render endpoint below. Reply with the brand
you chose, one line on why, and the kit URL the endpoint gave you.

The job, in one paragraph, in case this thread gets long: when a release is
published here I send you the notes, you produce the kit JSON (version, repo,
releaseUrl, outputs, look, brand, tweet, thread, linkedin, card, film, skipped,
memory), you POST that JSON to the render endpoint with the bearer token below,
and you reply with the kit URL the endpoint returns plus a one line summary of
what you made. The renderer has no taste and no memory: every choice about copy,
look and what to leave out is yours. Skipping a release is a valid answer.

End your reply with the kit JSON in one fenced json block, so the job can
recover it if the POST failed.

IMAJI_BRIEF
{
  echo "render endpoint: POST ${BASE_URL%/}/api/render"
  echo "authorization header: Bearer ${TOKEN}"
  echo "content type: application/json"
  echo
} >> "$M"
# Standing preferences, if this repository keeps any. Optional file, and a broken
# one is a warning, never a failure. Same section the workflow appends.
if [ -f imaji.json ]; then
  if PREFS="$(jq -c . imaji.json 2>/dev/null)" && [ -n "$PREFS" ]; then
    {
      echo "--- standing preferences from imaji.json ---"
      printf '%s\n' "$PREFS"
      echo "--- end imaji.json ---"
      echo "Honour these for this release unless I overrode them in chat. If they conflict with a rule I gave you in chat, the chat rule wins."
      echo
    } >> "$M"
  else
    echo "local-onboard: imaji.json is present but does not parse as JSON, continuing without it" >&2
  fi
fi
{
  echo "--- evidence ---"
  echo "repo: $REPO"; echo "default branch: $BRANCH"; echo "repo url: https://github.com/$REPO"; echo
} >> "$M"
FILES="$(git ls-files -co --exclude-standard 2>/dev/null || true)"
if [ -f package.json ]; then
  { echo "package.json:"; jq -r '{name, description, homepage, version, license} | to_entries[] | select(.value != null and .value != "") | "  " + .key + ": " + (.value | tostring)' package.json || true; echo; } >> "$M"
fi
LOGOS="$(printf '%s\n' "$FILES" | grep -Ei '(logo|icon|wordmark)[^/]*\.(svg|png)$' | head -10 || true)"
if [ -n "$LOGOS" ]; then
  { echo "logo candidates (fetchable only if this repo is public):"; printf '%s\n' "$LOGOS" | while IFS= read -r p; do [ -n "$p" ] && echo "  https://raw.githubusercontent.com/$REPO/$BRANCH/$p"; done; echo; } >> "$M"
fi
THEME_FILES="$(printf '%s\n' "$FILES" | grep -Ei '(globals\.css|theme\.css|tailwind\.config\.[a-z]+)$' | head -10 || true)"
if [ -n "$THEME_FILES" ]; then
  TOKENS="$(printf '%s\n' "$THEME_FILES" | while IFS= read -r p; do [ -f "$p" ] && grep -hoE -e '--[A-Za-z0-9_-]+ *: *#[0-9A-Fa-f]{3,8}' "$p" || true; done | head -30)"
  [ -n "$TOKENS" ] && { echo "theme tokens found in the repo:"; printf '%s\n' "$TOKENS" | sed 's/^/  /'; echo; } >> "$M"
fi
RELEASES="$(gh api "repos/$REPO/releases?per_page=10" --jq '.[] | "  " + .tag_name + "  " + (.published_at // "") + "\n    " + ((.body // "") | gsub("\r"; "") | gsub("\n"; " ") | .[0:400])' 2>/dev/null || true)"
{ echo "last 10 releases:"; if [ -n "$RELEASES" ]; then printf '%s\n' "$RELEASES"; else echo "  none yet"; fi; echo; } >> "$M"
README="$(printf '%s\n' "$FILES" | grep -iE '^readme(\.md|\.markdown|\.rst|\.txt)?$' | head -1 || true)"
if [ -n "$README" ] && [ -f "$README" ]; then
  { echo "--- $README, first 6000 characters ---"; head -c 6000 "$README"; echo; echo "--- end $README ---"; } >> "$M"
fi
echo "local-onboard: $REPO to $ALIAS, $(wc -c < "$M" | tr -d ' ') bytes" >&2
export IMAJI_BASE_URL="$BASE_URL" IMAJI_KIT_TOKEN="$TOKEN"
RESULT="$(scripts/minds-send.sh --alias "$ALIAS" --mind "$MIND" --message-file "$M" --timeout 300000 --work-dir "$WORK/run" --render-fallback)"
echo "--- what the Mind said ---"; cat "$WORK/run/reply.txt" 2>/dev/null || true; echo "--- end ---"
echo "$RESULT"
