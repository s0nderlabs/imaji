/* demo/composition/build.js

   Builds the stage and the ONE paused gsap timeline the renderer drives.
   Two parts live in this file, selected by the query string:

     index.html?part=a   the cold open through the bridge
     index.html?part=c   the end card

   Between them render.mjs drops the launch video the Mind wrote for v0.3.0,
   untouched, and joins the three with the concat demuxer.

   The look: one sheet of warm paper, a hint of weather behind it, and every
   product shot held still inside a window. No camera move anywhere. The only
   motion inside a window is the content's own.

   Rules the harness needs: gsap.set and gsap.fromTo only, no CSS animation,
   no rAF, no Date.now, no Math.random, no network. Everything on screen is a
   string from demo/assets/text.js or a local file under demo/assets/. */

const T = window.DEMO_TEXT
const PART = (window.DEMO_PART || new URLSearchParams(location.search).get("part") || "a").toLowerCase()
const stage = document.querySelector(".stage")
const FPS = 30

/* ---------- tiny DOM helpers ---------- */

function el(tag, cls, parent, html) {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (html !== undefined) n.innerHTML = html
  if (parent) parent.appendChild(n)
  return n
}
function layer(cls) {
  return el("div", "layer" + (cls ? " " + cls : ""), stage)
}
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/* every still the composition paints, loaded before IMAJI_READY */
const pending = []
function img(src, cls, parent) {
  const n = el("img", cls, parent)
  n.src = src
  pending.push(
    new Promise((res) => {
      if (n.complete && n.naturalWidth) res()
      else {
        n.onload = res
        n.onerror = res
      }
    }),
  )
  return n
}

/* ---------- the weather ---------- */

/* Three blurred beams behind everything, dormant until the first beat. The
   drift is one slow one-shot tween on the master playhead, so a seek in
   either direction lands on the same picture. */
function weather(tl, duration) {
  const a = el("div", "aurora", stage)
  const A = el("i", "beamA", a)
  const B = el("i", "beamB", a)
  const C = el("i", "beamC", a)
  tl.fromTo(a, { opacity: 0.05 }, { opacity: 1, duration: 0.7, ease: "power2.out" }, 0.5)
  tl.fromTo(A, { rotation: 13, xPercent: 0, yPercent: 0 },
    { rotation: 7, xPercent: -8, yPercent: 5, duration, ease: "sine.inOut" }, 0)
  tl.fromTo(B, { rotation: -11, xPercent: 0, yPercent: 0 },
    { rotation: -5, xPercent: 9, yPercent: -6, duration, ease: "sine.inOut" }, 0)
  tl.fromTo(C, { xPercent: 0, yPercent: 0, scale: 1 },
    { xPercent: -12, yPercent: 9, scale: 1.16, duration, ease: "sine.inOut" }, 0)
}

/* ---------- typed text ---------- */

/* Splits a line into one span per character. The accent word, if given, is
   the only coloured run in the line. */
function chars(host, text, accWord) {
  const a = accWord ? text.indexOf(accWord) : -1
  const b = a >= 0 ? a + accWord.length : -1
  const out = []
  let word = null
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === " ") {
      word = null
      const s = el("span", "ch", el("span", "sp", host))
      s.textContent = c
      out.push(s)
      continue
    }
    if (!word) word = el("span", "w", host)
    const s = el("span", "ch" + (a >= 0 && i >= a && i < b ? " acc" : ""), word)
    s.textContent = c
    out.push(s)
  }
  return out
}

/* Reveals `cs` one character at a time between t0 and t0+dur, moving the caret
   with them, then blinks the caret twice and parks it. */
function type(tl, cs, caret, t0, dur, opts) {
  const step = dur / Math.max(cs.length, 1)
  const o = opts || {}
  for (let i = 0; i < cs.length; i++) {
    const t = t0 + i * step
    tl.set(cs[i], { opacity: 1 }, t)
    if (caret) {
      const c = cs[i]
      const h = Math.round(c.offsetHeight * 0.72)
      tl.set(caret, {
        x: c.offsetLeft + c.offsetWidth,
        y: c.offsetTop + Math.round((c.offsetHeight - h) / 2),
        height: h,
        opacity: 1,
      }, t)
    }
  }
  const end = t0 + dur
  if (caret && !o.keep) {
    tl.set(caret, { opacity: 0 }, end + 0.36)
    tl.set(caret, { opacity: 1 }, end + 0.72)
    tl.set(caret, { opacity: 0 }, end + 1.08)
  }
  return end
}

/* ---------- the word wipe ----------
   Cold open and end card only. Each word is one span whose glyphs clip a
   gradient; sweeping the gradient left reveals the word from muted to ink. */
function words(host, text, accWord) {
  const out = []
  const parts = text.split(" ")
  parts.forEach((w, i) => {
    const s = el("span", "wipe" + (accWord && w === accWord ? " acc" : ""), host)
    s.textContent = w + (i < parts.length - 1 ? " " : "")
    out.push(s)
  })
  return out
}
function wipe(tl, ws, t0, step, dur) {
  ws.forEach((w, i) => {
    const p = { v: 100 }
    tl.fromTo(p, { v: 100 }, {
      v: 0, duration: dur, ease: "power2.out",
      onUpdate: () => { w.style.backgroundPositionX = p.v + "%" },
    }, t0 + i * step)
  })
  return t0 + (ws.length - 1) * step + dur
}

/* ---------- statements ---------- */

function statement(spec) {
  const L = layer()
  const say = el("div", "say", L)
  const l1 = el("div", "l1" + (spec.small ? " sm" : ""), say)
  const caret = el("i", "caret", l1)
  const cs = chars(l1, spec.line1, spec.acc)
  let cs2 = null
  if (spec.line2) cs2 = chars(el("div", "l2", say), spec.line2)
  return { L, caret, cs, cs2 }
}

/* fade in, type line one, settle line two, hold, hard cut */
function playStatement(tl, s, t0, tType, hold) {
  tl.set(s.L, { opacity: 1 }, t0)
  const done = type(tl, s.cs, s.caret, t0 + 0.2, tType)
  if (s.cs2) for (let i = 0; i < s.cs2.length; i++) tl.set(s.cs2[i], { opacity: 1 }, done + 0.36 + i * 0.011)
  const out = done + hold
  tl.set(s.L, { opacity: 0 }, out)
  return out
}

/* ---------- a window on the paper ---------- */

const FRAME = { x: 140, y: 79, w: 1640, h: 922 }

/* Returns the window element. It arrives once, with one rise and one fade,
   and is never touched again while it is on screen. */
function frameWindow(box) {
  const L = layer()
  const b = box || FRAME
  const f = el("div", "frame", L)
  f.style.cssText += "left:" + b.x + "px;top:" + b.y + "px;width:" + b.w + "px;height:" + b.h + "px"
  /* four handles, as if the window were selected on an artboard */
  const h = el("div", "handles", L)
  const pts = [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]]
  for (const [x, y] of pts) {
    el("i", "", h).style.cssText = "left:" + (x - 5) + "px;top:" + (y - 5) + "px"
  }
  return { L, f, box: b }
}
function enter(tl, w, t0) {
  tl.fromTo(w.f, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, t0)
  tl.fromTo(w.L, { opacity: 0 }, { opacity: 1, duration: 0.001 }, t0)
  return t0
}
function leave(tl, w, t) {
  tl.set(w.L, { opacity: 0 }, t)
}

/* A kit page screenshot, placed inside a window at a fixed scale so its text
   stays readable, and clamped so the page always covers the window. */
function plate(win, file, S, cx, cy) {
  const pw = 1440 * S
  const ph = 810 * S
  const ox = Math.min(0, Math.max(win.box.w - pw, win.box.w / 2 - cx * S))
  const oy = Math.min(0, Math.max(win.box.h - ph, win.box.h / 2 - cy * S))
  const p = el("div", "plate", win.f)
  p.style.cssText += "left:" + ox.toFixed(1) + "px;top:" + oy.toFixed(1) + "px;width:" + pw.toFixed(1) + "px"
  img("../assets/shots/" + file + ".png", "", p)
  return { ox, oy, S, host: p }
}

/* ---------- reels ----------
   Real footage is painted onto a canvas one frame at a time. Frames are
   fetched on demand: render.mjs awaits window.__prepare(t) before every
   screenshot, and the reel keeps a small sliding window of decoded images
   rather than holding hundreds at once. */

const REELS = []
function reel(cv, segs) {
  const r = { cv, ctx: cv.getContext("2d"), segs, cache: new Map(), order: [] }
  REELS.push(r)
  return r
}
function srcOf(seg, i) {
  return seg.base + String(seg.first + i).padStart(seg.pad, "0") + seg.ext
}
function indexAt(r, t) {
  for (const s of r.segs) {
    if (t >= s.t0 && t < s.t1) {
      return { seg: s, i: Math.max(0, Math.min(s.count - 1, Math.round((t - s.t0) * FPS))) }
    }
  }
  return null
}
function load(r, seg, i) {
  const key = seg.base + i
  const hit = r.cache.get(key)
  if (hit) return hit
  const n = new Image()
  n.src = srcOf(seg, i)
  const p = n.decode ? n.decode().then(() => n).catch(() => n)
    : new Promise((res) => { n.onload = () => res(n); n.onerror = () => res(n) })
  const rec = { img: n, ready: p }
  r.cache.set(key, rec)
  r.order.push(key)
  while (r.order.length > 72) {
    const k = r.order.shift()
    if (k !== key) r.cache.delete(k)
  }
  return rec
}
async function prepare(t) {
  for (const r of REELS) {
    const at = indexAt(r, t)
    if (!at) continue
    const want = []
    for (let k = -1; k <= 20; k++) {
      const i = at.i + k
      if (i >= 0 && i < at.seg.count) want.push(load(r, at.seg, i))
    }
    const here = load(r, at.seg, at.i)
    await here.ready
    void want
    if (here.img.naturalWidth) {
      r.ctx.drawImage(here.img, 0, 0, r.cv.width, r.cv.height)
    }
  }
}
window.__prepare = prepare

/* =====================================================================
   PART A
   ===================================================================== */

const A = {
  open: [0, 7.0],
  s2: [7.0, 10.2], term: [10.2, 15.0],
  s3: [15.0, 18.4], run: [18.4, 23.0],
  s4: [23.0, 27.4], chat: [27.4, 41.0],
  s5: [41.0, 43.6], card: [43.6, 46.6], tweet: [46.6, 49.2], thread: [49.2, 51.6], film: [51.6, 55.0],
  s6: [55.0, 58.6], rec1: [58.6, 60.4], rec2: [60.4, 66.8],
  s7: [66.8, 70.2], rec3: [70.2, 73.8],
  bridge: [73.8, 77.0],
}

function buildPartA() {
  const tl = gsap.timeline({ paused: true })
  weather(tl, A.bridge[1])

  /* --- 1. the cold open --- */
  const open = layer()
  const openSay = el("div", "say", open)
  const mark = el("div", "mark", open)
  /* centred through gsap (xPercent), not a CSS transform: the entrance tween
     below owns transform and would otherwise drop the -50% shift */
  mark.style.cssText = "left:50%;top:296px;height:128px"
  img("../assets/imaji-5b-on-light.svg", "", mark)
  const o1 = el("div", "l1", openSay)
  o1.style.marginTop = "150px"
  const oWs = words(o1, T.open.line1, T.open.acc)
  const o2 = el("div", "l2", openSay, "")
  const oCs2 = chars(o2, T.open.line2)

  /* --- 2. the terminal --- */
  const termW = frameWindow({ x: 210, y: 375, w: 1500, h: 330 })
  const tbar = el("div", "bar", termW.f)
  el("s", "", tbar); el("s", "", tbar); el("s", "", tbar)
  el("span", "t", tbar, esc(T.repo))
  const tbd = el("div", "bd", termW.f)
  const cmdLine = el("div", "tl cmd", tbd)
  el("span", "p", cmdLine, "$&nbsp;")
  const cmdCaret = el("i", "caret", cmdLine)
  const cmdCs = chars(cmdLine, T.command)
  el("div", "tl gap", tbd)
  const outCs = chars(el("div", "tl", tbd), T.releaseUrl)

  /* --- 3. the run --- */
  const runW = frameWindow({ x: 180, y: 210, w: 1560, h: 660 })
  const abar = el("div", "bar", runW.f)
  el("s", "", abar); el("s", "", abar); el("s", "", abar)
  el("span", "t", abar, esc("Actions / imaji / release " + T.tag))
  const abd = el("div", "bd", runW.f)
  abd.style.padding = "28px 46px"
  const stepEls = T.steps.map((name) => {
    const r = el("div", "stepline", abd)
    const tick = el("i", "tick", r)
    el("span", "n", r, esc(name))
    return { r, tick }
  })
  const logHost = el("div", "", abd)
  logHost.style.cssText = "margin-top:16px;padding-left:38px"
  const logEls = T.log.map((line) => {
    const r = el("div", "tl", logHost)
    r.style.cssText = "font-size:21px;line-height:1.62;opacity:0"
    r.textContent = line
    return r
  })
  const msgPane = el("div", "msgpane", runW.f)
  msgPane.style.opacity = "0"
  const msgRoll = el("div", "roll", msgPane)
  for (const line of T.message) {
    const r = el("div", "mr" + (/^---/.test(line) ? " h" : /^(repo|tag|release url|previous tag):/.test(line) ? " b" : ""), msgRoll)
    r.textContent = line === "" ? " " : line
  }
  el("div", "fadetop", msgPane)
  el("div", "fade", msgPane)

  /* --- 4. the Minds app, rebuilt --- */
  const chatW = frameWindow()
  chatW.f.style.background = "#0a0a0a"
  const app = el("div", "app", chatW.f)
  buildMindsApp(app)
  const M = app.__minds
  const AS = 1.20
  app.style.transform = "translate(" + (-336 * AS).toFixed(1) + "px,0px) scale(" + AS + ")"

  /* --- 5. the kit page --- */
  const KIT = { x: 240, y: 135, w: 1440, h: 810 }
  const cardW = frameWindow(KIT); plate(cardW, "kit-card", 2.6, 500, 122)
  const tweetW = frameWindow(KIT); plate(tweetW, "kit-tweet", 1.7, 703, 137)
  const threadW = frameWindow(KIT); plate(threadW, "kit-thread", 1.6, 703, 390)
  const filmW = frameWindow(KIT)
  const fp = plate(filmW, "kit-film", 2.0, 740, 141)
  const fb = T.filmBox
  const fcv = el("canvas", "filmcv", filmW.f)
  fcv.width = Math.round(fb.w * 2)
  fcv.height = Math.round(fb.h * 2)
  fcv.style.cssText +=
    "left:" + (fb.x * fp.S + fp.ox).toFixed(1) + "px;top:" + (fb.y * fp.S + fp.oy).toFixed(1) + "px;" +
    "width:" + (fb.w * fp.S).toFixed(1) + "px;height:" + (fb.h * fp.S).toFixed(1) + "px"
  /* the beat of the film worth showing: the headline card and the three lines
     it steps through, played at its own speed */
  reel(fcv, [{
    t0: A.film[0], t1: A.film[1],
    count: Math.min(T.frames - 60, Math.round((A.film[1] - A.film[0]) * FPS)),
    base: "../assets/frames/frame_", first: 61, pad: 3, ext: ".png",
  }])

  /* --- 6 and 7. the recording of the real app --- */
  const recW = frameWindow()
  const rcv = el("canvas", "reelcv", recW.f)
  rcv.width = 1640
  rcv.height = 922
  rcv.style.cssText += "width:1640px;height:922px"
  const R = T.rec
  const recReel = reel(rcv, [
    { t0: A.rec1[0], t1: A.rec1[1], count: R.r1, base: "../assets/rec/r1_", first: 1, pad: 4, ext: ".jpg" },
    { t0: A.rec2[0], t1: A.rec2[1], count: R.r2, base: "../assets/rec/r2_", first: 1, pad: 4, ext: ".jpg" },
    { t0: A.rec3[0], t1: A.rec3[1], count: R.r3, base: "../assets/rec/r3_", first: 1, pad: 4, ext: ".jpg" },
  ])
  void recReel

  /* --- the statements --- */
  const st2 = statement({ line1: T.s2.line1, acc: T.s2.acc })
  const st3 = statement({ line1: T.s3.line1, acc: T.s3.acc })
  const st4 = statement({ line1: T.s4.line1, acc: T.s4.acc, small: true })
  const st5 = statement({ line1: T.s5.line1, acc: T.s5.acc })
  const st6 = statement({ line1: T.s5b.line1, acc: T.s5b.acc, line2: T.s5b.line2 })
  const st7 = statement({ line1: T.s5c.line1, acc: T.s5c.acc, line2: T.s5c.line2 })
  const stB = statement({ line1: T.bridge.line1, acc: T.bridge.acc, line2: T.bridge.line2 })

  el("div", "grain", stage)
  const black = el("div", "black", stage)

  /* ---------------- the timeline ---------------- */

  /* 1. the cold open */
  tl.set(open, { opacity: 1 }, 0)
  tl.fromTo(mark, { opacity: 0, y: 14, xPercent: -50 }, { opacity: 1, y: 0, xPercent: -50, duration: 0.9, ease: "power3.out" }, 0.3)
  const openDone = wipe(tl, oWs, 1.5, 0.19, 0.62)
  for (let i = 0; i < oCs2.length; i++) tl.set(oCs2[i], { opacity: 1 }, openDone + 0.34 + i * 0.010)
  tl.set(open, { opacity: 0 }, A.open[1])

  /* 2. you tag a release */
  playStatement(tl, st2, A.s2[0], 1.2, 1.8)
  enter(tl, termW, A.term[0])
  const cmdDone = type(tl, cmdCs, cmdCaret, A.term[0] + 0.7, 1.9, { keep: true })
  tl.set(cmdCaret, { opacity: 0 }, cmdDone + 0.5)
  for (let i = 0; i < outCs.length; i++) tl.set(outCs[i], { opacity: 1 }, cmdDone + 0.62 + i * 0.013)
  leave(tl, termW, A.term[1])

  /* 3. a GitHub Action wakes your Mind */
  playStatement(tl, st3, A.s3[0], 1.55, 1.65)
  enter(tl, runW, A.run[0])
  stepEls.forEach(({ r, tick }, i) => {
    tl.set(r, { opacity: 1 }, A.run[0] + 0.35 + i * 0.2)
    tl.set(tick, { backgroundColor: "#E2583E", boxShadow: "none" }, A.run[0] + 0.35 + i * 0.2 + 0.22)
  })
  logEls.forEach((r, i) => tl.set(r, { opacity: 1 }, A.run[0] + 1.85 + i * 0.13))
  tl.fromTo(msgPane, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" }, A.run[0] + 2.6)
  tl.fromTo(msgRoll, { y: 0 }, { y: -760, duration: 2.0, ease: "none" }, A.run[0] + 2.6)
  leave(tl, runW, A.run[1])

  /* 4. your Mind reads it and writes the kit */
  playStatement(tl, st4, A.s4[0], 2.4, 1.8)
  enter(tl, chatW, A.chat[0])
  tl.set(M.think, { opacity: 1 }, A.chat[0] + 0.6)
  M.dots.forEach((d, i) => {
    for (let k = 0; k < 6; k++) {
      tl.set(d, { opacity: 0.35 }, A.chat[0] + 0.6 + k * 0.36 + i * 0.12)
      tl.set(d, { opacity: 1 }, A.chat[0] + 0.6 + k * 0.36 + i * 0.12 + 0.18)
    }
  })
  tl.set(M.think, { opacity: 0 }, A.chat[0] + 2.8)
  tl.set(M.who, { opacity: 1 }, A.chat[0] + 2.8)
  type(tl, M.noteCs, null, A.chat[0] + 2.95, 2.8)
  tl.set(M.code, { opacity: 1 }, A.chat[0] + 6.0)
  M.codeEls.forEach((c, i) => tl.set(c, { opacity: 1 }, A.chat[0] + 6.05 + i * 0.05))
  tl.set(M.meta, { opacity: 1 }, A.chat[0] + 9.4)
  tl.fromTo(M.roll, { y: 0 }, { y: -560, duration: 6.6, ease: "none" }, A.chat[0] + 6.4)
  leave(tl, chatW, A.chat[1])

  /* 5. imaji renders */
  playStatement(tl, st5, A.s5[0], 0.8, 1.6)
  enter(tl, cardW, A.card[0]); leave(tl, cardW, A.card[1])
  enter(tl, tweetW, A.tweet[0]); leave(tl, tweetW, A.tweet[1])
  enter(tl, threadW, A.thread[0]); leave(tl, threadW, A.thread[1])
  enter(tl, filmW, A.film[0]); leave(tl, filmW, A.film[1])

  /* 6. it remembers every release, and 7. it refuses */
  playStatement(tl, st6, A.s6[0], 1.5, 1.9)
  enter(tl, recW, A.rec1[0])
  leave(tl, recW, A.rec2[1])
  playStatement(tl, st7, A.s7[0], 0.7, 2.5)
  enter(tl, recW, A.rec3[0])
  leave(tl, recW, A.rec3[1])

  /* 8. the bridge */
  tl.set(stB.L, { opacity: 1 }, A.bridge[0])
  const bDone = type(tl, stB.cs, stB.caret, A.bridge[0] + 0.2, 0.9)
  for (let i = 0; i < stB.cs2.length; i++) tl.set(stB.cs2[i], { opacity: 1 }, bDone + 0.28 + i * 0.0035)
  tl.fromTo(black, { opacity: 0 }, { opacity: 1, duration: 0.26, ease: "power2.in" }, A.bridge[1] - 0.5)
  tl.set(black, { opacity: 1 }, A.bridge[1] - 0.24)
  tl.set(stB.L, { opacity: 0 }, A.bridge[1] - 0.2)

  tl.set({}, {}, A.bridge[1])
  return tl
}

/* =====================================================================
   the Minds app, rebuilt at 1:1 from the recorded interface
   ===================================================================== */

function buildMindsApp(root) {
  const m = T.minds

  const rail = el("div", "rail", root)
  const railShapes = [
    "border-radius:50%;width:15px;height:15px;box-shadow:inset 0 0 0 2.5px CC",
    "width:13px;height:16px;border-radius:2px 2px 5px 5px;box-shadow:inset 0 0 0 2px CC",
    "width:16px;height:12px;border-radius:3px;box-shadow:inset 0 0 0 2px CC",
    "width:16px;height:13px;border-radius:3px;box-shadow:inset 0 0 0 2px CC",
    "width:15px;height:15px;border-radius:3px;box-shadow:inset 0 0 0 2px CC",
  ]
  m.rail.forEach((name, i) => {
    const it = el("div", "it" + (i === 0 ? " on" : ""), rail)
    it.style.top = 20 + i * 74 + "px"
    const tile = el("div", "tile", it)
    const g = el("span", "", tile)
    g.style.cssText = "display:block;" + railShapes[i].replace(/CC/g, i === 0 ? "#ffffff" : "#9a9a9a")
    if (name === "Quests") el("span", "badge", tile, "5")
    el("div", "lb", it, esc(name))
  })

  const side = el("div", "side", root)
  el("div", "h", side, "Minds")
  el("div", "add", side, "+ Add")
  el("div", "disc", side, "DISCOVER <b>Hide</b>")
  m.discover.forEach(([t, s], i) => {
    const c = el("div", "card", side)
    c.style.top = 88 + i * 82 + "px"
    el("div", "t", c, '<i class="g"></i>' + esc(t))
    el("div", "s", c, esc(s))
  })
  el("div", "dots", side, "<i></i><i class='on'></i>")
  el("div", "cnt", side, "1 MINDS")
  const mind = el("div", "mind", side)
  el("div", "av", mind, "I")
  const mw = el("div", "", mind)
  el("div", "nm", mw, esc(m.mind))
  el("div", "rw", mw, "<b>" + esc(m.runway) + "</b> days runway")
  const th = el("div", "trow", side)
  el("span", "", th, esc(m.title.slice(0, 24)) + "...")
  el("span", "ago", th, "now")
  const foot = el("div", "foot", side)
  el("div", "av", foot, "A")
  const fw = el("div", "", foot)
  el("div", "n1", fw, esc(m.account[0]))
  el("div", "n2", fw, esc(m.account[1]))

  const main = el("div", "mainpane", root)
  const hdr = el("div", "hdr", main)
  el("div", "ttl", hdr, esc(m.title))
  el("div", "sub", hdr, esc(m.mind) + '<span class="d">.</span><b>' + esc(m.runway) + "</b> <em>days runway</em>")

  const thread = el("div", "thread", main)
  const roll = el("div", "threadroll", thread)
  const col = el("div", "col", roll)

  const div = el("div", "divider", col)
  el("i", "", div); el("span", "", div, "Today"); el("i", "", div)

  const ob = el("div", "outbound", col)
  const bub = el("div", "bubble", ob)
  bub.textContent = m.userMessage.join("\n")
  el("div", "clip", bub)
  const meta1 = el("div", "meta right", col)
  el("i", "cp", meta1)
  el("span", "pill", meta1, "<i></i>Add to chat")
  el("span", "tm", meta1, esc(m.sentAt))

  const inb = el("div", "inbound", col)
  el("div", "av", inb, "I")
  const body = el("div", "bodycol", inb)
  const who = el("div", "who", body, esc(m.mind) + ' <span class="tag">' + esc(T.tag) + "</span>")
  who.style.opacity = "0"
  const think = el("div", "think", body)
  think.style.opacity = "0"
  el("span", "", think, "Thinking")
  const dots = [el("i", "", think), el("i", "", think), el("i", "", think)]
  const note = el("div", "para", body)
  const noteCs = chars(note, m.note)
  const code = el("div", "code", body)
  code.style.opacity = "0"
  const codeEls = m.code.map((line) => {
    const c = el("div", "cl", code)
    c.textContent = line
    return c
  })
  const meta2 = el("div", "meta", body)
  meta2.style.opacity = "0"
  el("span", "tm", meta2, esc(m.replyAt))
  el("i", "cp", meta2)
  el("span", "pill", meta2, "<i></i>Add to chat")

  const comp = el("div", "composer", main)
  el("span", "plus", comp, "+")
  el("span", "ph", comp, esc(m.composer))
  el("s", "", el("div", "mic", comp))

  root.__minds = { roll, who, think, dots, note, noteCs, code, codeEls, meta: meta2 }
}

/* =====================================================================
   PART C: the end card
   ===================================================================== */

function buildPartC() {
  const tl = gsap.timeline({ paused: true })
  weather(tl, 10.0)

  const L = layer()
  const box = el("div", "end", L)
  const mark = el("div", "mark", box)
  mark.style.cssText = "position:relative;left:auto;height:96px;margin-bottom:60px"
  img("../assets/imaji-5b-on-light.svg", "", mark)
  const title = el("div", "title", box)
  const tWs = words(title, T.end.title)
  const three = el("div", "three", box)
  const steps = T.end.steps.map((s, i) => el("div", "", three, "<i>" + (i + 1) + "</i>" + esc(s)))
  const agents = el("div", "agents", box, esc(T.end.agents))
  const rule = el("div", "rule", box)
  const live = el("div", "live", box, esc(T.end.live))
  const url = el("div", "url", box, esc(T.site))
  const quiet = el("div", "quiet", box, esc(T.end.quiet))
  const tagline = el("div", "tagline", box, esc(T.end.tagline))

  el("div", "grain", stage)
  const black = el("div", "black", stage)

  tl.set(L, { opacity: 1 }, 0)
  tl.fromTo(black, { opacity: 1 }, { opacity: 0, duration: 0.36, ease: "power2.out" }, 0)
  tl.fromTo(mark, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.2)
  wipe(tl, tWs, 1.0, 0.2, 0.6)
  steps.forEach((s, i) => tl.fromTo(s, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, 2.3 + i * 0.55))
  tl.fromTo(agents, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, 4.4)
  tl.fromTo(rule, { width: 0 }, { width: 200, duration: 0.7, ease: "expo.out" }, 5.0)
  tl.fromTo(live, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 5.5)
  tl.fromTo(url, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, 6.0)
  tl.fromTo(quiet, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power2.out" }, 6.9)
  tl.fromTo(tagline, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power2.out" }, 7.7)
  tl.set({}, {}, 10.0)
  return tl
}

/* ---------- boot ---------- */

const NEED = [
  "15px Manrope", "700 15px Manrope", "800 25px Manrope",
  "13px 'Space Mono'", "28px 'Space Mono'",
  "700 100px Adventor", "35px 'Open Sauce One'", "500 15px 'Open Sauce One'",
  "13px 'Geist Pixel'",
]
Promise.all(NEED.map((f) => document.fonts.load(f)))
  .then(() => document.fonts.ready)
  .then(() => {
    const missing = NEED.filter((f) => !document.fonts.check(f))
    window.IMAJI_FONTS = { missing }
    if (missing.length) throw new Error("fonts missing: " + missing.join(", "))
    const tl = PART === "c" ? buildPartC() : buildPartA()
    window.__timelines = { main: tl }
    tl.pause()
    tl.time(0)
    return Promise.all(pending)
  })
  .then(() => prepare(0))
  .then(() => {
    window.IMAJI_READY = true
  })
