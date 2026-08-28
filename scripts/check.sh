#!/usr/bin/env bash
# Everything that can be checked about the workflow without a GitHub runner,
# a Mind, or an API key. Run: bash scripts/check.sh
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$HERE")"
PY="${PYTHON:-python3}"
cd "$ROOT"

fail=0
step() { printf '\n== %s\n' "$1"; }
note() { printf '   %s\n' "$1"; }
bad() { fail=1; printf '   FAILED: %s\n' "$1"; }

step "python syntax"
if "$PY" -c 'import ast,sys
for path in sys.argv[1:]:
    ast.parse(open(path, encoding="utf-8").read(), path)' scripts/parse-reply.py scripts/sync-template.py; then
  note "parse-reply.py and sync-template.py compile"
else
  bad "python syntax"
fi

step "shell syntax"
for f in scripts/*.sh; do
  if bash -n "$f"; then note "bash -n $f"; else bad "bash -n $f"; fi
done

step "parse-reply unit tests"
if bash scripts/parse-reply.test.sh; then :; else bad "parse-reply.test.sh"; fi

step "minds-send offline tests"
if bash scripts/minds-send.test.sh; then :; else bad "minds-send.test.sh"; fi

step "templates/imaji.yml matches scripts/"
if "$PY" scripts/sync-template.py; then :; else bad "the embedded copies have drifted"; fi

step "templates/imaji.yml parses as YAML"
if "$PY" - <<'PYEOF'
import sys
try:
    import yaml
except ImportError:
    print("   pyyaml missing, trying ruby")
    sys.exit(70)
with open("templates/imaji.yml", encoding="utf-8") as handle:
    doc = yaml.safe_load(handle)
jobs = list(doc.get("jobs", {}))
print("   parsed, jobs: " + ", ".join(jobs))
PYEOF
then :
elif [ $? -eq 70 ]; then
  if ruby -ryaml -e 'YAML.load_file("templates/imaji.yml")'; then
    note "ruby parsed it"
  else
    bad "YAML does not parse"
  fi
else
  bad "YAML does not parse"
fi

step "every run: block in templates/imaji.yml is valid bash"
TMPDIR_RUN="$(mktemp -d)"
if "$PY" - "$TMPDIR_RUN" <<'PYEOF'
import os, sys
try:
    import yaml
except ImportError:
    print("   pyyaml missing, skipping run block extraction")
    sys.exit(0)
out = sys.argv[1]
with open("templates/imaji.yml", encoding="utf-8") as handle:
    doc = yaml.safe_load(handle)
n = 0
for job_name, job in doc.get("jobs", {}).items():
    for i, step in enumerate(job.get("steps", [])):
        script = step.get("run")
        if not script:
            continue
        n += 1
        name = "%s-%02d-%s" % (job_name, i, str(step.get("name", "run")).replace(" ", "-").lower())
        path = os.path.join(out, name + ".sh")
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(script)
print("   extracted %d run blocks" % n)
PYEOF
then
  for f in "$TMPDIR_RUN"/*.sh; do
    [ -e "$f" ] || continue
    if bash -n "$f"; then note "bash -n $(basename "$f")"; else bad "bash -n $(basename "$f")"; fi
  done
else
  bad "could not extract run blocks"
fi

step "the workflow writes back the exact scripts it embeds"
SANDBOX="$(mktemp -d)"
WRITER="$TMPDIR_RUN/release-02-write-the-imaji-helper-scripts.sh"
if [ -f "$WRITER" ]; then
  if IMAJI_WORK="$SANDBOX" bash "$WRITER" >/dev/null 2>&1; then
    for pair in "parse-reply.py" "minds-send.sh"; do
      if diff -q "scripts/$pair" "$SANDBOX/$pair" >/dev/null; then
        note "$pair came out byte identical"
      else
        bad "$pair differs after the heredoc round trip"
      fi
    done
  else
    bad "the helper writing step failed to run"
  fi
else
  bad "could not find the helper writing step"
fi
rm -rf "$SANDBOX"
rm -rf "$TMPDIR_RUN"

step "the local harness sends the same brief as the workflow"
RELEASE_YML="$(mktemp)"
if "$PY" - "$RELEASE_YML" <<'PYEOF'
import re, sys

def block(path, dedent):
    text = open(path, encoding="utf-8").read()
    lines = text.split("\n")
    for i, line in enumerate(lines):
        if line.rstrip().endswith("<<'IMAJI_BRIEF'"):
            indent = line[: len(line) - len(line.lstrip())] if dedent else ""
            out = []
            for j in range(i + 1, len(lines)):
                if lines[j].strip() == "IMAJI_BRIEF":
                    return "\n".join(out).strip()
                out.append(lines[j][len(indent):] if lines[j].startswith(indent) else lines[j])
    return None

# the release job is the second IMAJI_BRIEF in the template, the onboard one is first
text = open("templates/imaji.yml", encoding="utf-8").read()
release_part = text.split("\njobs:\n", 1)[-1].split("\n  release:\n", 1)[-1]
open(sys.argv[1], "w", encoding="utf-8").write(release_part)
a = block(sys.argv[1], True)
b = block("scripts/local-release.sh", False)
if a is None or b is None:
    print("   could not find both briefs")
    sys.exit(1)
if a != b:
    print("   the briefs differ")
    for line in [l for l in a.split("\n") if l not in b.split("\n")]:
        print("   template only: " + line)
    for line in [l for l in b.split("\n") if l not in a.split("\n")]:
        print("   local only:    " + line)
    sys.exit(1)
print("   identical")
PYEOF
then :; else bad "the local harness brief has drifted from the workflow"; fi
rm -f "$RELEASE_YML"

step "no emdash, no emoji"
if "$PY" - <<'PY_EOF'
import os, sys, unicodedata

roots = ["scripts", "templates", "docs/WORKFLOW.md"]
bad = []
paths = []
for root in roots:
    if os.path.isfile(root):
        paths.append(root)
        continue
    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d != "__pycache__"]
        paths.extend(os.path.join(base, f) for f in files)
for path in paths:
    try:
        text = open(path, encoding="utf-8").read()
    except (UnicodeDecodeError, OSError):
        continue
    for n, line in enumerate(text.split("\n"), 1):
        for ch in line:
            code = ord(ch)
            if ch == "\u2014":
                bad.append("%s:%d emdash" % (path, n))
                break
            if code > 0x2100 and unicodedata.category(ch) == "So":
                bad.append("%s:%d emoji %r" % (path, n, ch))
                break
for line in bad:
    print("   " + line)
sys.exit(1 if bad else 0)
PY_EOF
then note "clean"; else bad "an emdash or an emoji got in"; fi

printf '\n'
if [ "$fail" -eq 0 ]; then
  echo "all checks passed"
else
  echo "checks failed"
fi
exit "$fail"
