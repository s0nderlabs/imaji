#!/usr/bin/env python3
"""Read minds-cli JSON on stdin, print the one useful thing in the Mind's reply.

Input is whatever `minds send --wait` or `minds history` printed on stdout.
Output is exactly one line (default mode):

  KIT_URL=<url>          the Mind rendered the kit already and gave us the URL
  KIT_JSON=<compact>     the Mind wrote the kit but we still have to POST it
  SKIPPED=<line>         the Mind decided this release does not earn a kit
  NOTHING                nothing usable in the reply

Other modes, used by minds-send.sh:

  --emit fingerprint     print the chosen message fingerprint, or nothing
  --emit text            print the chosen message as plain text

Filters:

  --after <fingerprint>  ignore messages not newer than this one
  --exclude-file <path>  ignore a message that is just an echo of this file
                         (the message we sent, when polling history)

stdlib only, python3.9 or newer.
"""

import argparse
import html
import json
import re
import sys

TEXT_KEYS = ("messageText", "message_text", "text", "message", "content", "body")


def walk_messages(node, out):
    if isinstance(node, dict):
        fp = node.get("fingerprint")
        if isinstance(fp, str) and fp:
            for key in TEXT_KEYS:
                value = node.get(key)
                if isinstance(value, str) and value.strip():
                    out.append({"fingerprint": fp, "raw": value, "senderType": node.get("senderType")})
                    break
        for value in node.values():
            walk_messages(value, out)
    elif isinstance(node, list):
        for value in node:
            walk_messages(value, out)


def collect(data):
    """Every message-looking object in the payload, newest last."""
    if isinstance(data, dict):
        reply = data.get("reply")
        if isinstance(reply, dict):
            direct = []
            walk_messages(reply, direct)
            if direct:
                return direct
    found = []
    walk_messages(data, found)
    seen = set()
    unique = []
    for item in found:
        key = (item["fingerprint"], item["raw"][:200])
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    unique.sort(key=lambda m: m["fingerprint"])
    return unique


def to_text(raw):
    s = re.sub(r"(?is)<(script|style)\b.*?</\1\s*>", " ", raw)
    s = re.sub(r"(?i)<br\s*/?>", "\n", s)
    s = re.sub(r"(?i)<li\b[^>]*>", "- ", s)
    s = re.sub(r"(?i)</(p|div|li|h[1-6]|pre|tr|ul|ol|blockquote)\s*>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    s = s.replace("\u00a0", " ")
    s = re.sub(r"[ \t]+\n", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def normalise(text):
    return re.sub(r"\s+", " ", text).strip().lower()


def json_candidates(raw):
    """Every JSON-looking blob in the reply, best first."""
    blocks = []
    for match in re.finditer(r"(?is)<pre[^>]*>\s*<code[^>]*>(.*?)</code>\s*</pre>", raw):
        blocks.append(html.unescape(match.group(1)))
    for match in re.finditer(r"(?is)<code[^>]*>(.*?)</code>", raw):
        blocks.append(html.unescape(match.group(1)))
    text = to_text(raw)
    for match in re.finditer(r"(?s)```(?:json)?\s*(.*?)```", text):
        blocks.append(match.group(1))
    blocks.append(text)
    out = []
    for block in blocks:
        block = re.sub(r"^\s*json\s*\n", "", block)
        start = block.find("{")
        end = block.rfind("}")
        if start == -1 or end <= start:
            continue
        out.append(block[start : end + 1].strip())
    return out


def extract_kit(raw):
    for blob in json_candidates(raw):
        try:
            parsed = json.loads(blob)
        except ValueError:
            continue
        if isinstance(parsed, dict) and isinstance(parsed.get("version"), str) and parsed.get("repo"):
            return parsed
    return None


URL_RE = re.compile(r"https?://[^\s\"'<>)\]}]+/k/[^\s\"'<>)\]}]*")


def extract_kit_url(raw):
    text = to_text(raw)
    urls = []
    for match in URL_RE.finditer(text):
        url = match.group(0).rstrip(".,;:!?)'\"\u2019")
        if url not in urls:
            urls.append(url)
    if not urls:
        return None
    deep = [u for u in urls if re.search(r"/k/[0-9a-f]{24}/[^/\s]+", u)]
    return deep[-1] if deep else None


SKIP_RE = re.compile(
    r"(?i)\b(skip|skipping|skipped|skipping this one|no kit|not shipping a kit|does not earn|doesn't earn)\b"
)


def extract_skip(raw):
    text = to_text(raw)
    for line in text.splitlines():
        line = line.strip().lstrip("-* ").strip()
        if not line or not SKIP_RE.search(line):
            continue
        if len(line) > 300:
            for sentence in re.split(r"(?<=[.!?])\s+", line):
                if SKIP_RE.search(sentence):
                    line = sentence.strip()
                    break
        return line[:300]
    return None


def main():
    parser = argparse.ArgumentParser(add_help=True)
    parser.add_argument("--emit", choices=("result", "fingerprint", "text"), default="result")
    parser.add_argument("--after", default="")
    parser.add_argument("--exclude-file", default="")
    args = parser.parse_args()

    try:
        data = json.loads(sys.stdin.read() or "null")
    except ValueError:
        data = None
    if data is None:
        print("" if args.emit != "result" else "NOTHING")
        return 0

    messages = collect(data)
    if args.after:
        messages = [m for m in messages if m["fingerprint"] > args.after]
    if args.exclude_file:
        try:
            with open(args.exclude_file, "r", encoding="utf-8", errors="replace") as handle:
                sent = normalise(handle.read())[:160]
        except OSError:
            sent = ""
        if sent:
            messages = [m for m in messages if normalise(to_text(m["raw"]))[:160] != sent]
    if not messages:
        print("" if args.emit != "result" else "NOTHING")
        return 0

    from_mind = [m for m in messages if m.get("senderType") == 0]
    chosen = (from_mind or messages)[-1]

    if args.emit == "fingerprint":
        print(chosen["fingerprint"])
        return 0
    if args.emit == "text":
        print(to_text(chosen["raw"]))
        return 0

    raw = chosen["raw"]
    url = extract_kit_url(raw)
    if url:
        print("KIT_URL=" + url)
        return 0
    kit = extract_kit(raw)
    skip = extract_skip(raw)
    if kit is not None:
        # JOB.md tells the Mind that a deliberate skip comes back as a kit whose
        # outputs list is empty. That is a skip, not something to render.
        if isinstance(kit.get("outputs"), list) and not kit["outputs"]:
            reasons = kit.get("skipped")
            if isinstance(reasons, list) and reasons and isinstance(reasons[0], str):
                print("SKIPPED=" + reasons[0].strip()[:300])
            else:
                print("SKIPPED=" + (skip or "the Mind decided this release does not earn a kit"))
            return 0
        print("KIT_JSON=" + json.dumps(kit, separators=(",", ":"), ensure_ascii=False))
        return 0
    if skip:
        print("SKIPPED=" + skip)
        return 0
    print("NOTHING")
    return 0


if __name__ == "__main__":
    sys.exit(main())
