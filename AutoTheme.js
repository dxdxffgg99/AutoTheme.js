const LS_KEY = "auto-theme:mode"
let currentMode = "light"
let persistPref = true
let stop = null

export const Theme = {
  apply(tokens = {}) {
    const minRatio = prefersMoreContrast() ? 7 : 4.5
    const sys = isDark() ? "dark" : "light"
    const stored = readStoredMode()
    const mode = tokens.mode && tokens.mode !== "auto" ? tokens.mode : (stored || sys)
    currentMode = mode

    const bg = tokens.bg ?? (mode === "dark" ? "#111218" : "#ffffff")
    const fg0 = tokens.fg ?? (mode === "dark" ? "#eaeaf2" : "#0e0f13")
    const primary = tokens.primary ?? (mode === "dark" ? "#7aa2ff" : "#345cff")
    const muted = tokens.muted ?? (mode === "dark" ? "#2a2d3a" : "#f1f3f7")
    const accent = tokens.accent ?? (mode === "dark" ? "#ffb86b" : "#b94cff")

    const fg = ensureContrast(fg0, bg, minRatio)
    const onPrimary = pickOn(primary, minRatio)

    setVars({
      "--bg": bg,
      "--fg": toHex(fg),
      "--primary": primary,
      "--on-primary": onPrimary,
      "--muted": muted,
      "--accent": accent,
    })

    const root = document.documentElement
    root.setAttribute("data-theme", mode)
    root.style.colorScheme = mode

    if (persistPref) try { localStorage.setItem(LS_KEY, mode) } catch {}
  },

  mode(next) {
    if (!next) return currentMode
    if (next === "auto") { clearStoredMode(); Theme.apply({ mode: "auto" }); return currentMode }
    currentMode = next
    if (persistPref) try { localStorage.setItem(LS_KEY, next) } catch {}
    Theme.apply({ mode: next })
    return currentMode
  },

  auto() {
    unwatch()
    const dark = matchMediaSafe("(prefers-color-scheme: dark)")
    const contrast = matchMediaSafe("(prefers-contrast: more)")
    const on = () => Theme.apply({ mode: readStoredMode() ? currentMode : "auto" })
    dark?.addEventListener?.("change", on)
    contrast?.addEventListener?.("change", on)
    stop = () => { dark?.removeEventListener?.("change", on); contrast?.removeEventListener?.("change", on); stop = null }
    Theme.apply({ mode: "auto" })
    return { stop: unwatch }
  },

  persist(enable) { persistPref = !!enable },
}

function unwatch(){ if (typeof stop === "function") { stop() } }
function readStoredMode(){ try { const v = localStorage.getItem(LS_KEY); return v === "light" || v === "dark" ? v : null } catch { return null } }
function clearStoredMode(){ try { localStorage.removeItem(LS_KEY) } catch {} }
function isDark(){ return matchMediaSafe("(prefers-color-scheme: dark)")?.matches ?? false }
function prefersMoreContrast(){ return matchMediaSafe("(prefers-contrast: more)")?.matches ?? false }
function matchMediaSafe(q){ try { return window.matchMedia(q) } catch { return null } }
function setVars(vars){ const s = document.documentElement.style; for (const k in vars) s.setProperty(k, vars[k]) }

function parseColor(x){
  x = String(x).trim()
  if (x[0] === "#") {
    const h = x.slice(1)
    if (h.length === 3) return { r: parseInt(h[0]+h[0],16), g: parseInt(h[1]+h[1],16), b: parseInt(h[2]+h[2],16) }
    return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) }
  }
  if (/^rgb\(/i.test(x)){
    const [r,g,b] = x.replace(/rgb\(|\)/g,"").split(/\s*,\s*/).map(Number); return { r,g,b }
  }
  if (/^hsl\(/i.test(x)){
    const [h,s,l] = x.replace(/hsl\(|\)/g,"").split(/\s*,\s*/)
    return hslToRgb(parseFloat(h), parseFloat(s)/100, parseFloat(l)/100)
  }
  throw new Error("unsupported color")
}

function toHex({r,g,b}){ return "#" + h2(r) + h2(g) + h2(b) }
function h2(n){ return Math.max(0, Math.min(255, n|0)).toString(16).padStart(2,"0") }

function rgbToHsl({r,g,b}){
  r/=255; g/=255; b/=255
  const max=Math.max(r,g,b), min=Math.min(r,g,b)
  let h=0, s=0, l=(max+min)/2
  if(max!==min){
    const d=max-min
    s = l>0.5 ? d/(2-max-min) : d/(max+min)
    switch(max){
      case r: h=(g-b)/d + (g<b?6:0); break
      case g: h=(b-r)/d + 2; break
      default: h=(r-g)/d + 4
    }
    h/=6
  }
  return {h,s,l}
}

function hslToRgb(h,s,l){
  h = ((h%1)+1)%1
  const c=(1-Math.abs(2*l-1))*s
  const x=c*(1-Math.abs((h*6)%2-1))
  const m=l-c/2
  let r=0,g=0,b=0
  if(h<1/6){ r=c; g=x }
  else if(h<2/6){ r=x; g=c }
  else if(h<3/6){ g=c; b=x }
  else if(h<4/6){ g=x; b=c }
  else if(h<5/6){ r=x; b=c }
  else { r=c; b=x }
  return { r: Math.round((r+m)*255), g: Math.round((g+m)*255), b: Math.round((b+m)*255) }
}

function luminance({r,g,b}){
  const t = v => { v/=255; return v<=0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4) }
  return 0.2126*t(r) + 0.7152*t(g) + 0.0722*t(b)
}

function contrast(a,b){
  const A = typeof a === "string" ? parseColor(a) : a
  const B = typeof b === "string" ? parseColor(b) : b
  const L1 = luminance(A), L2 = luminance(B)
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1]
  return (hi + 0.05) / (lo + 0.05)
}

function pickOn(base, min=4.5){
  const w = "#ffffff", k = "#000000"
  const cw = contrast(w, base), ck = contrast(k, base)
  if (cw >= min && cw >= ck) return w
  if (ck >= min && ck >= cw) return k
  return cw > ck ? w : k
}

function ensureContrast(fg, bg, min=4.5){
  let F = typeof fg === "string" ? parseColor(fg) : fg
  const B = typeof bg === "string" ? parseColor(bg) : bg
  if (contrast(F, B) >= min) return F
  let {h,s,l} = rgbToHsl(F)
  const target = luminance(B) > 0.5 ? 0.05 : 0.95
  for (let i=0;i<40;i++){
    l = l + (target - l) * 0.25
    F = hslToRgb(h, s, l)
    if (contrast(F, B) >= min) break
  }
  return F
}

export function a11yContrast(a,b){ return contrast(a,b) }