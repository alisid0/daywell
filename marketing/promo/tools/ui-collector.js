// Runs inside a Daywell screen (UI audit, 23 October 2026): every visible control, text run and form field with the
// computed styles that matter for a design review. Returned by value to tools/ui-audit.mjs.
(() => {
  const vis = el => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    // Closed <details> keep a box but aren't drawn, so ask the browser what is really visible, and skip anything off to the side.
    if (el.checkVisibility && !el.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })) return false;
    if (r.right <= 0 || r.left >= innerWidth) return false;
    return r.bottom > -innerHeight && r.top < innerHeight * 4;
  };
  const clear = c => !c || c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c);
  // Background colours from the element outwards, stopping at the first fully opaque one.
  const backs = el => {
    const out = [];
    for (let e = el; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor;
      if (clear(c)) continue;
      out.push(c);
      if (!c.startsWith("rgba")) break;
    }
    return out;
  };
  const words = el => (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 48);
  const classes = el => typeof el.className === "string" ? el.className.split(/\s+/).filter(Boolean).slice(0, 3).join(".") : "";
  const controls = [...document.querySelectorAll("button, a[href], [role=button], [role=tab], [role=switch], summary, select, input[type=checkbox], input[type=radio]")]
    .filter(vis).map(el => {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(), role: el.getAttribute("role") || "", cls: classes(el), text: words(el),
        labelled: Boolean((el.innerText || "").trim() || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.title || el.labels?.length),
        w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, backs: backs(el.parentElement || el), color: cs.color,
        border: cs.borderTopStyle === "none" || cs.borderTopWidth === "0px" ? "none" : `${cs.borderTopWidth} ${cs.borderTopColor}`,
        radius: cs.borderTopLeftRadius, fs: cs.fontSize, fw: cs.fontWeight, ff: cs.fontFamily.split(",")[0].replace(/"/g, "").trim(),
        shadow: cs.boxShadow !== "none", deco: cs.textDecorationLine, transition: `${cs.transitionDuration}|${cs.transitionProperty.slice(0, 60)}`,
        inline: cs.display === "inline",
      };
    });
  const text = [...document.querySelectorAll("body *")]
    .filter(el => !["SCRIPT", "STYLE", "svg"].includes(el.tagName) && [...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim().length > 1))
    .filter(vis).map(el => {
      const cs = getComputedStyle(el);
      return { fs: parseFloat(cs.fontSize), fw: cs.fontWeight, color: cs.color, backs: backs(el), t: [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.nodeValue).join(" ").trim().replace(/\s+/g, " ").slice(0, 48) };
    });
  const fields = [...document.querySelectorAll("input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=range]), textarea, select")]
    .filter(vis).map(el => ({ type: el.type || el.tagName.toLowerCase(), h: Math.round(el.getBoundingClientRect().height), fs: getComputedStyle(el).fontSize,
      labelled: Boolean(el.labels?.length || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")), placeholder: el.placeholder || "" }));
  const motion = [...new Set([...document.querySelectorAll("body *")].filter(vis).map(el => getComputedStyle(el).animationName).filter(n => n && n !== "none"))];
  return { query: location.search, docH: document.documentElement.scrollHeight, controls, text, fields, motion };
})()
