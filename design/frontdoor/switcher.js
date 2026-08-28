/* imaji font switcher. Drop <link rel="stylesheet" href="../fonts.css"> and
   <script src="../switcher.js"></script> into a layout whose CSS reads
   --font-display, --font-text, --font-mono, --weight-display, --track-display
   on :root. State lives in the URL hash (shareable) and localStorage, and the
   picking sheet can drive it through postMessage. Press F to hide the dock. */
(function () {
  var FAMILIES = {
    display: ["PolySans", "PolySans Mono", "Die Grotesk", "Die Grotesk C", "Open Sauce One", "Helvetica Neue", "Adventor", "Peace Sans", "Tempting", "Geist Pixel", "PP Mori", "Recoleta"],
    text: ["Open Sauce One", "PolySans", "Die Grotesk", "Die Grotesk C", "Helvetica Neue", "Adventor", "PP Mori"],
    mono: ["PolySans Mono", "Geist Pixel", "Geist Pixel Grid", "SF Mono"]
  }
  var WEIGHTS = [300, 400, 500, 600, 700, 800]
  var FALLBACK = { display: '"Open Sauce One", "Helvetica Neue", Helvetica, sans-serif', text: '"Open Sauce One", "Helvetica Neue", Helvetica, sans-serif', mono: 'ui-monospace, "SF Mono", Menlo, monospace' }
  var DEFAULT = window.IMAJI_FONT_DEFAULTS || { display: "", text: "", mono: "", weight: "", track: "" }
  var state = Object.assign({}, DEFAULT)

  function read() {
    var m = location.hash.match(/fonts=([^&]+)/)
    if (m) { try { Object.assign(state, JSON.parse(decodeURIComponent(m[1]))) } catch (e) {} ; return }
    try { var s = JSON.parse(localStorage.getItem("imaji-fonts") || "null"); if (s) Object.assign(state, s) } catch (e) {}
  }
  function stack(role, name) {
    if (!name) return ""
    if (name === "SF Mono") return 'ui-monospace, "SF Mono", Menlo, monospace'
    return '"' + name + '", ' + FALLBACK[role]
  }
  function apply() {
    var r = document.documentElement.style
    var keys = ["display", "text", "mono"]
    keys.forEach(function (k) { var v = stack(k, state[k]); if (v) r.setProperty("--font-" + k, v); else r.removeProperty("--font-" + k) })
    if (state.weight) r.setProperty("--weight-display", String(state.weight)); else r.removeProperty("--weight-display")
    if (state.track !== "" && state.track !== undefined && state.track !== null) r.setProperty("--track-display", state.track + "em"); else r.removeProperty("--track-display")
    try { localStorage.setItem("imaji-fonts", JSON.stringify(state)) } catch (e) {}
    var clean = {}; Object.keys(state).forEach(function (k) { if (state[k] !== "" && state[k] !== null && state[k] !== undefined) clean[k] = state[k] })
    var h = location.hash.replace(/[#&]?fonts=[^&]*/, "").replace(/^#?&/, "#")
    var enc = Object.keys(clean).length ? "fonts=" + encodeURIComponent(JSON.stringify(clean)) : ""
    var next = (h && h !== "#" ? h + (enc ? "&" : "") : (enc ? "#" : "")) + enc
    if (next !== location.hash) history.replaceState(null, "", next || location.pathname)
    sync()
  }
  var dock, controls = {}
  function select(label, key, options, format) {
    var wrap = document.createElement("label")
    wrap.className = "ifs-f"
    var span = document.createElement("span"); span.textContent = label
    var sel = document.createElement("select")
    var none = document.createElement("option"); none.value = ""; none.textContent = "layout default"; sel.appendChild(none)
    options.forEach(function (o) { var op = document.createElement("option"); op.value = o; op.textContent = format ? format(o) : o; sel.appendChild(op) })
    sel.addEventListener("change", function () { state[key] = sel.value === "" ? "" : (key === "weight" ? Number(sel.value) : sel.value); apply() })
    wrap.appendChild(span); wrap.appendChild(sel); controls[key] = sel
    return wrap
  }
  function build() {
    var css = document.createElement("style")
    css.textContent = ".ifs{position:fixed;right:14px;bottom:14px;z-index:2147483000;display:flex;flex-wrap:wrap;gap:8px;align-items:center;max-width:calc(100vw - 28px);padding:10px 12px;border-radius:12px;background:rgba(28,23,20,.92);color:#f3efe8;font:12px/1.3 'Helvetica Neue',Helvetica,sans-serif;box-shadow:0 1px 2px rgba(0,0,0,.3),0 12px 32px rgba(0,0,0,.35);backdrop-filter:blur(10px) saturate(1.3);-webkit-backdrop-filter:blur(10px) saturate(1.3)}.ifs.hidden{display:none}.ifs-f{display:flex;flex-direction:column;gap:3px;min-width:96px}.ifs-f span{color:#a69e94;font-size:11px}.ifs select,.ifs input{font:12px 'Helvetica Neue',Helvetica,sans-serif;color:#f3efe8;background:#2a2320;border:0;border-radius:7px;padding:5px 7px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}.ifs input[type=range]{padding:0;height:26px;background:transparent;box-shadow:none;width:110px}.ifs button{font:12px 'Helvetica Neue',Helvetica,sans-serif;color:#1a1614;background:#e2583e;border:0;border-radius:7px;padding:7px 10px;cursor:pointer;align-self:flex-end}.ifs button:active{transform:scale(.97)}.ifs .ifs-x{background:transparent;color:#a69e94;padding:7px 6px}@media (max-width:480px){.ifs{left:8px;right:8px;bottom:8px}}"
    document.head.appendChild(css)
    dock = document.createElement("div"); dock.className = "ifs"
    dock.appendChild(select("Display", "display", FAMILIES.display))
    dock.appendChild(select("Text", "text", FAMILIES.text))
    dock.appendChild(select("Mono", "mono", FAMILIES.mono))
    dock.appendChild(select("Display weight", "weight", WEIGHTS, function (w) { return String(w) }))
    var tw = document.createElement("label"); tw.className = "ifs-f"
    var ts = document.createElement("span"); ts.textContent = "Display tracking"
    var tr = document.createElement("input"); tr.type = "range"; tr.min = "-0.05"; tr.max = "0.03"; tr.step = "0.002"
    tr.addEventListener("input", function () { state.track = Number(tr.value); ts.textContent = "Display tracking " + tr.value + "em"; apply() })
    tw.appendChild(ts); tw.appendChild(tr); dock.appendChild(tw); controls.track = tr; controls.trackLabel = ts
    var copy = document.createElement("button"); copy.textContent = "Copy config"
    copy.addEventListener("click", function () {
      var txt = JSON.stringify(state)
      var done = function () { copy.textContent = "Copied"; setTimeout(function () { copy.textContent = "Copy config" }, 1500) }
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, done); else done()
    })
    dock.appendChild(copy)
    var reset = document.createElement("button"); reset.className = "ifs-x"; reset.textContent = "Reset"
    reset.addEventListener("click", function () { state = Object.assign({}, DEFAULT); apply() })
    dock.appendChild(reset)
    document.body.appendChild(dock)
    document.addEventListener("keydown", function (e) { if ((e.key === "f" || e.key === "F") && !/input|select|textarea/i.test(e.target.tagName)) dock.classList.toggle("hidden") })
  }
  function sync() {
    if (!dock) return
    ;["display", "text", "mono", "weight"].forEach(function (k) { if (controls[k]) controls[k].value = state[k] === "" || state[k] === undefined || state[k] === null ? "" : String(state[k]) })
    if (controls.track) { var t = state.track === "" || state.track === undefined || state.track === null ? "" : state.track; controls.track.value = t === "" ? "0" : String(t); controls.trackLabel.textContent = "Display tracking" + (t === "" ? "" : " " + t + "em") }
  }
  window.addEventListener("message", function (e) {
    var d = e.data
    if (!d || d.type !== "imaji-fonts") return
    if (d.reset) state = Object.assign({}, DEFAULT); else Object.assign(state, d.state || {})
    apply()
    if (d.hide !== undefined && dock) dock.classList.toggle("hidden", !!d.hide)
  })
  read()
  function start() { build(); apply(); if (window.parent !== window) try { window.parent.postMessage({ type: "imaji-fonts-ready", state: state }, "*") } catch (e) {} }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start()
})()
