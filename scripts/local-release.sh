#!/usr/bin/env bash
# Run the release flow from this Mac, without GitHub.
#
# Same message, same send, same fingerprint guard, same history fallback, same
# render fallback as the release job in templates/imaji.yml. The workflow is the
# source of truth for the wording; this is how you exercise it before a tag ever
# gets pushed.
#
# Usage:
#   scripts/local-release.sh <alias> <mindId> <tag> <notes-file> [base-url] [token]
#   scripts/local-release.sh --dry-run <alias> <mindId> <tag> <notes-file>
#
# Environment:
#   MINDS_BUILDER_API_KEY   required, read from the environment, never printed
#   IMAJI_BASE_URL          used when no base-url argument is given
#   IMAJI_KIT_TOKEN         used when no token argument is given
#   IMAJI_REPO              owner/name, when this directory has no git remote
#
# A real run spends the owner's cognition (about 2.4 cognitions per exchange,
# 134 to 144 seconds for a full kit). Use --dry-run to see the exact message
# first: it contacts nothing.
set -euo pipefail

DRY="no"
if [ "${1:-}" = "--dry-run" ]; then
  DRY="yes"
  shift
fi

usage() {
  sed -n '2,22p' "$0"
  exit 2
}

ALIAS="${1:-}"
MIND="${2:-}"
TAG="${3:-}"
NOTES="${4:-}"
BASE_URL="${5:-${IMAJI_BASE_URL:-https://imaji.s0nderlabs.xyz}}"
TOKEN="${6:-${IMAJI_KIT_TOKEN:-}}"

[ -n "$ALIAS" ] && [ -n "$MIND" ] && [ -n "$TAG" ] && [ -n "$NOTES" ] || usage
[ -f "$NOTES" ] || { echo "local-release: notes file not found: $NOTES" >&2; exit 2; }
if [ "$DRY" = "no" ]; then
  [ -n "${MINDS_BUILDER_API_KEY:-}" ] || { echo "local-release: MINDS_BUILDER_API_KEY is not set" >&2; exit 2; }
  [ -n "$TOKEN" ] || { echo "local-release: no kit token, pass one or set IMAJI_KIT_TOKEN" >&2; exit 2; }
fi

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# owner/name, the way the release job knows it.
REPO="${IMAJI_REPO:-}"
if [ -z "$REPO" ]; then
  REMOTE="$(git remote get-url origin 2>/dev/null || true)"
  REPO="$(printf '%s' "$REMOTE" | sed -E 's#^git@[^:]+:##; s#^https?://[^/]+/##; s#\.git$##')"
fi
case "$REPO" in
  */*) ;;
  *) REPO="local/$(basename "$(pwd)")" ;;
esac

# The default branch, for the raw.githubusercontent.com URLs below. The workflow
# gets it from the release event; here it comes from the remote's HEAD.
BRANCH="$(git rev-parse --abbrev-ref origin/HEAD 2>/dev/null | sed 's#^origin/##' || true)"
# A repository with no origin/HEAD answers "HEAD", which is not a branch.
case "$BRANCH" in ""|HEAD|*[!A-Za-z0-9._/-]*) BRANCH="main" ;; esac

RELEASE_URL="https://github.com/$REPO/releases/tag/$TAG"
PREV="$(git describe --tags --abbrev=0 "$TAG^" 2>/dev/null || true)"
COMPARE=""
[ -n "$PREV" ] && COMPARE="https://github.com/$REPO/compare/$PREV...$TAG"

WORK="$(mktemp -d)"
M="$WORK/message.txt"

cat > "$M" <<'IMAJI_BRIEF'
imaji release job.

A release just went out. Read the notes at the bottom, decide what this release
earns, and write the kit in the brand and voice you already hold for this
repository. Reference the last release when it actually helps; do not force it.

The job, in one paragraph, in case this thread got long: produce the kit JSON
(version, repo, releaseUrl, outputs, look, brand, tweet, thread, linkedin, card,
film, vertical, launch, skipped, memory; outputs may name x, linkedin, card,
film, vertical and launch, and launch needs a launch.beats storyboard of 3 to
10 beats), POST that JSON to the render endpoint below with the
bearer token, and reply with the kit URL the endpoint returns plus a one line
summary of what you made. The renderer has no taste and no memory: the copy, the
look and everything you leave out are your call. If this release does not earn a
kit, reply with "skipping" and one line on why, and post nothing.

End your reply with the kit JSON in one fenced json block, so the job can
recover it if the POST failed.

IMAJI_BRIEF

# The token is a write credential for /api/render, so it never reaches a
# terminal, a scrollback, a tee or a screen recording. A dry run gets a
# placeholder, and a real run scrubs the line out of the work directory on the
# way out unless IMAJI_KEEP_WORK=1 asks to keep it.
TOKEN_FOR_MESSAGE="${TOKEN:-<no token, dry run>}"
[ "$DRY" = "yes" ] && TOKEN_FOR_MESSAGE="<kit token>"
scrub_message() {
  [ "${IMAJI_KEEP_WORK:-}" = "1" ] && return 0
  [ -f "$M" ] || return 0
  sed -i.bak 's|^authorization header: Bearer .*|authorization header: Bearer <kit token, scrubbed>|' "$M" 2>/dev/null || true
  rm -f "$M.bak"
  for f in "$WORK"/run/*.json "$WORK"/*.json; do
    [ -f "$f" ] || continue
    sed -i.bak 's/Bearer [A-Za-z0-9_-]\{16,\}/Bearer <scrubbed>/g' "$f" 2>/dev/null || true
    rm -f "$f.bak"
  done
}
trap scrub_message EXIT

{
  echo "render endpoint: POST ${BASE_URL%/}/api/render"
  echo "authorization header: Bearer $TOKEN_FOR_MESSAGE"
  echo "content type: application/json"
  echo
  echo "repo: $REPO"
  echo "tag: $TAG"
  echo "release url: $RELEASE_URL"
  [ -n "$PREV" ] && echo "previous tag: $PREV"
  [ -n "$COMPARE" ] && echo "compare: $COMPARE"
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
    echo "local-release: imaji.json is present but does not parse as JSON, continuing without it" >&2
  fi
fi

# Evidence a launch video can use. The workflow reads a checked out tag with
# `git ls-files`; here we also take untracked files, so a repository with no
# commits yet still has assets to show.
FILES="$(git ls-files -co --exclude-standard 2>/dev/null || true)"

HOMEPAGE=""
if [ -f package.json ]; then
  HOMEPAGE="$(jq -r '.homepage // empty' package.json 2>/dev/null || true)"
fi
if [ -z "$HOMEPAGE" ]; then
  READMEFILE="$(printf '%s\n' "$FILES" | grep -iE '^readme(\.md|\.markdown|\.rst|\.txt)?$' | head -1 || true)"
  if [ -n "$READMEFILE" ] && [ -f "$READMEFILE" ]; then
    HOMEPAGE="$(grep -ohE 'https://[A-Za-z0-9._~:/?#@$&*+,;=%-]+' "$READMEFILE" \
      | sed -E 's/[.,;:?!]+$//' \
      | grep -v 'github\.com' \
      | grep -Eiv '\.(md|markdown|txt|yml|yaml|json|xml|csv|png|jpe?g|gif|svg|webp|pdf|zip)(\?|#|$)' \
      | grep -Eiv '^https://(github\.com|raw\.githubusercontent\.com|www\.github\.com)/' | awk '{ print length($0), $0 }' | sort -n | head -1 | cut -d' ' -f2- || true)"
  fi
fi
# A deep link is not a homepage: cut it to the origin, unless it is a
# GitHub Pages project site, where the first path segment is the site.
case "$HOMEPAGE" in
  ""|none|*.github.io/*) ;;
  https://*/*) HOMEPAGE="$(printf '%s' "$HOMEPAGE" | sed -E 's#^(https://[^/]+)/.*$#\1#')" ;;
esac
[ -n "$HOMEPAGE" ] || HOMEPAGE="none"

# Screenshots and diagrams. Icons, logos, badges and anything under 2 KB are
# decoration, not evidence.
KEEP="$(printf '%s\n' "$FILES" \
  | grep -Ei '\.(png|jpg|jpeg|webp|gif)$' \
  | grep -Eiv '(node_modules|favicon|icon|logo|badge)' \
  | while IFS= read -r p; do
      [ -f "$p" ] || continue
      SIZE="$(wc -c < "$p" | tr -d ' ')"
      [ "$SIZE" -ge 2048 ] || continue
      printf '%s\n' "$p"
    done || true)"
# A screenshot in docs/ or public/ says more than one at the root, so those come
# first and the twelve cut takes them.
WANTED='(^|/)(docs|screenshots|assets|public)/'
IMAGES="$(printf '%s\n%s\n' \
  "$(printf '%s\n' "$KEEP" | grep -E "$WANTED" || true)" \
  "$(printf '%s\n' "$KEEP" | grep -Ev "$WANTED" || true)" \
  | grep -v '^$' | head -12 || true)"

{
  echo "--- repository assets ---"
  echo "homepage: $HOMEPAGE"
  echo "images (public raw URLs, fetchable only if this repo is public):"
  if [ -n "$IMAGES" ]; then
    printf '%s\n' "$IMAGES" | while IFS= read -r p; do
      [ -n "$p" ] || continue
      echo "https://raw.githubusercontent.com/$REPO/$BRANCH/$p"
    done
  else
    echo "none"
  fi
  echo "--- end repository assets ---"
  echo
} >> "$M"

{
  echo "--- release notes ---"
} >> "$M"
cat "$NOTES" >> "$M"
{
  echo
  echo "--- end release notes ---"
} >> "$M"

if [ "$DRY" = "yes" ]; then
  echo "local-release: dry run, nothing was sent. The message would be:" >&2
  echo >&2
  cat "$M"
  rm -rf "$WORK"
  exit 0
fi

echo "local-release: $REPO $TAG to $ALIAS, $(wc -c < "$M" | tr -d ' ') bytes" >&2
echo "local-release: a full kit takes 134 to 144 seconds, be patient" >&2

RESULT="$(IMAJI_BASE_URL="$BASE_URL" IMAJI_KIT_TOKEN="$TOKEN" "$HERE/minds-send.sh" \
  --alias "$ALIAS" \
  --mind "$MIND" \
  --message-file "$M" \
  --timeout 300000 \
  --work-dir "$WORK/run" \
  --render-fallback)"

echo >&2
echo "--- what the Mind said ---" >&2
cat "$WORK/run/reply.txt" >&2 2>/dev/null || true
echo "--- end ---" >&2
echo >&2

case "$RESULT" in
  KIT_URL=*)
    echo "${RESULT#KIT_URL=}"
    ;;
  SKIPPED=*)
    echo "skipped: ${RESULT#SKIPPED=}"
    ;;
  ERROR=*)
    echo "error: ${RESULT#ERROR=}" >&2
    echo "the kit JSON, if there was one, is at $WORK/run/kit.json" >&2
    exit 1
    ;;
  KIT_JSON=*)
    echo "the Mind wrote a kit but it was never rendered, see $WORK/run/kit.json" >&2
    exit 1
    ;;
  *)
    echo "the Mind replied with nothing this script could use, see $WORK/run/reply.txt" >&2
    exit 1
    ;;
esac
if [ "${IMAJI_KEEP_WORK:-}" = "1" ]; then
  echo "local-release: working files kept at $WORK, bearer line and all" >&2
else
  echo "local-release: working files kept at $WORK, with the bearer line scrubbed" >&2
fi
