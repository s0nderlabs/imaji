#!/usr/bin/env python3
"""Keep templates/imaji.yml and scripts/ from drifting apart.

The workflow runs in other people's repositories, so it cannot depend on this
one at runtime: it writes its two helpers to disk with a heredoc and runs them
from there. That means the yml carries a copy of scripts/parse-reply.py and
scripts/minds-send.sh, and a copy can rot.

  python3 scripts/sync-template.py            check the copies match, exit 1 if not
  python3 scripts/sync-template.py --write     rewrite the copies from scripts/

scripts/ is the source of truth. Never hand edit the embedded copies.
stdlib only.
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TEMPLATE = os.path.join(ROOT, "templates", "imaji.yml")

BLOCKS = [
    ("IMAJI_PARSE_REPLY_PY", os.path.join(HERE, "parse-reply.py")),
    ("IMAJI_MINDS_SEND_SH", os.path.join(HERE, "minds-send.sh")),
]


def read_lines(path):
    with open(path, "r", encoding="utf-8") as handle:
        return handle.read().split("\n")


def find_blocks(lines, marker):
    """Every (start_index, end_index, indent) heredoc for this marker."""
    found = []
    opener = "<<'%s'" % marker
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.rstrip().endswith(opener):
            indent = line[: len(line) - len(line.lstrip())]
            j = i + 1
            while j < len(lines) and lines[j].strip() != marker:
                j += 1
            if j >= len(lines):
                raise SystemExit("sync-template: unterminated heredoc %s at line %d" % (marker, i + 1))
            found.append((i, j, indent))
            i = j
        i += 1
    return found


def indent_source(source_lines, indent):
    return [(indent + line) if line.strip() else "" for line in source_lines]


def main():
    write = "--write" in sys.argv[1:]
    lines = read_lines(TEMPLATE)
    problems = []

    for marker, source_path in BLOCKS:
        source = read_lines(source_path)
        while source and source[-1] == "":
            source.pop()
        blocks = find_blocks(lines, marker)
        if not blocks:
            problems.append("%s: no heredoc for %s" % (os.path.basename(TEMPLATE), marker))
            continue
        # Back to front, so earlier indices stay valid while rewriting.
        for start, end, indent in reversed(blocks):
            wanted = indent_source(source, indent)
            actual = lines[start + 1 : end]
            if actual == wanted:
                continue
            if write:
                lines[start + 1 : end] = wanted
            else:
                problems.append(
                    "%s line %d: the embedded copy of %s does not match scripts/%s"
                    % (
                        os.path.basename(TEMPLATE),
                        start + 2,
                        marker,
                        os.path.basename(source_path),
                    )
                )

    if write:
        with open(TEMPLATE, "w", encoding="utf-8") as handle:
            handle.write("\n".join(lines))
        print("sync-template: rewrote the embedded copies in templates/imaji.yml")
        return 0

    if problems:
        for problem in problems:
            print("sync-template: " + problem)
        print("sync-template: run python3 scripts/sync-template.py --write")
        return 1
    print("sync-template: templates/imaji.yml matches scripts/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
