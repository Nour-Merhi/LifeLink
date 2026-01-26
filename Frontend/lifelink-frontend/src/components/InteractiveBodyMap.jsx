import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimate } from "framer-motion";
import BodySvg from "../assets/imgs/HumanBodySvg/Body.svg?react";
import ORGAN_INFO from "../data/organsData";
import "../styles/animation.css";


const ORGAN_IDS = new Set(Object.keys(ORGAN_INFO));

function titleFromId(id) {
  if (!id) return "Organ";
  const pretty = id.replace(/[_-]/g, " ").trim();
  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
}

function findOrganGroupFromTarget(targetEl) {
  if (!targetEl || typeof targetEl.closest !== "function") return null;

  // Start at the nearest <g id="...">
  let g = targetEl.closest("g[id]");
  while (g) {
    const id = g.getAttribute("id");
    if (id && ORGAN_IDS.has(id)) return g;
    // Climb to parent and look again for an ancestor group
    g = g.parentElement ? g.parentElement.closest("g[id]") : null;
  }
  return null;
}

function buildIsolatedOrganSvgMarkup(svgEl, organGEl) {
  if (!svgEl || !organGEl) return null;

  const defsEl = svgEl.querySelector("defs");
  const defsMarkup = defsEl ? defsEl.outerHTML : "";

  // Crop the viewBox to the organ bounding box so it fills the isolated preview
  let viewBox = svgEl.getAttribute("viewBox") || null;
  try {
    const bbox = organGEl.getBBox();
    const pad = Math.max(bbox.width, bbox.height) * 0.2;
    const x = bbox.x - pad;
    const y = bbox.y - pad;
    const w = bbox.width + pad * 2;
    const h = bbox.height + pad * 2;
    viewBox = `${x} ${y} ${w} ${h}`;
  } catch {
    // getBBox can fail in rare cases; fallback to original viewBox
  }

  const safeViewBox = viewBox || "0 0 1000 1000";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${safeViewBox}" width="100%" height="100%">
      ${defsMarkup}
      ${organGEl.outerHTML}
    </svg>
  `;
}

function TypingText({ text, speed = 40, className = "", showCaret = true }) {
  const [out, setOut] = useState("");

  useEffect(() => {
    let i = 0;
    setOut("");
    const t = window.setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) window.clearInterval(t);
    }, Math.max(6, speed));
    return () => window.clearInterval(t);
  }, [text, speed]);

  return (
    <span className={className}>
      {out}
      {showCaret ? <span className="inline-block w-[0.55ch] animate-pulse opacity-70">|</span> : null}
    </span>
  );
}

export default function InteractiveBodyMap() {
  const containerRef = useRef(null);
  const svgWrapRef = useRef(null);
  const [scope, animate] = useAnimate();

  const [hoveredId, setHoveredId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [focus, setFocus] = useState(null); // { id, svgMarkup, clickX, clickY }

  const activeInfo = useMemo(() => {
    if (!activeId) return null;
    return (
      ORGAN_INFO[activeId] || {
        name: titleFromId(activeId),
        canDonate: true,
        description: "Placeholder: Donation can save lives. This organ’s educational description will be added soon.",
      }
    );
  }, [activeId]);

  const hoveredGroupRef = useRef(null);

  const applyHighlight = (gEl) => {
    if (!gEl) return;

    gEl.style.cursor = "pointer";
    gEl.style.transformBox = "fill-box";
    gEl.style.transformOrigin = "center";
  };

  const clearHighlight = (gEl) => {
    if (!gEl) return;
  };

  useEffect(() => {
    const root = svgWrapRef.current;
    if (!root) return;
    const svg = root.querySelector("svg");
    if (!svg) return;

    svg.style.height = "100%";
    svg.style.width = "auto";
    svg.style.maxWidth = "100%";
    svg.style.maxHeight = "100%";
    svg.style.display = "block";

    const onPointerOver = (e) => {
      const organG = findOrganGroupFromTarget(e.target);
      if (!organG) return;

      const prev = hoveredGroupRef.current;
      if (prev && prev !== organG) {
        clearHighlight(prev);
        animate(prev, { scale: 1 }, { duration: 0.18, ease: "easeOut" });
      }

      hoveredGroupRef.current = organG;
      const id = organG.getAttribute("id");
      setHoveredId(id);
      applyHighlight(organG);
      animate(organG, { scale: 1.04 }, { duration: 0.18, ease: "easeOut" });
    };

    const onPointerOut = (e) => {
      const fromOrgan = findOrganGroupFromTarget(e.target);
      if (!fromOrgan) return;

      const toOrgan = e.relatedTarget ? findOrganGroupFromTarget(e.relatedTarget) : null;
      if (toOrgan === fromOrgan) return; 

      if (hoveredGroupRef.current === fromOrgan) hoveredGroupRef.current = null;
      const id = fromOrgan.getAttribute("id");
      setHoveredId((prev) => (prev === id ? null : prev));
      clearHighlight(fromOrgan);
      animate(fromOrgan, { scale: 1 }, { duration: 0.18, ease: "easeOut" });
    };

    const onClick = (e) => {
      const organG = findOrganGroupFromTarget(e.target);
      if (!organG) return;
      const id = organG.getAttribute("id");
      setActiveId(id);

      const svgMarkup = buildIsolatedOrganSvgMarkup(svg, organG);
      setFocus({
        id,
        svgMarkup,
        clickX: e.clientX,
        clickY: e.clientY,
      });

      animate(organG, { scale: [1.02, 1.07, 1.03] }, { duration: 0.35, ease: "easeOut" });
    };

    svg.addEventListener("pointerover", onPointerOver);
    svg.addEventListener("pointerout", onPointerOut);
    svg.addEventListener("click", onClick);

    return () => {
      svg.removeEventListener("pointerover", onPointerOver);
      svg.removeEventListener("pointerout", onPointerOut);
      svg.removeEventListener("click", onClick);
    };
  }, [animate]);

  // Close focus overlay on ESC
  useEffect(() => {
    if (!focus) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setFocus(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focus]);

  const handleMove = (e) => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return;
    setCursor({
      x: e.clientX - box.left,
      y: e.clientY - box.top,
    });
  };

  const openFocusById = (id) => {
    const root = svgWrapRef.current;
    const svg = root?.querySelector("svg");
    if (!svg) return;
    const g = svg.querySelector(`g[id="${id}"]`);
    if (!g) return;

    const svgMarkup = buildIsolatedOrganSvgMarkup(svg, g);
    setActiveId(id);
    setFocus({
      id,
      svgMarkup,
      clickX: window.innerWidth * 0.5,
      clickY: window.innerHeight * 0.5,
    });
  };

  return (
    <div ref={containerRef} onMouseMove={handleMove} className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Interactive Human Body Map</h1>
          <p className="mt-1 text-sm md:text-base text-zinc-300">
            Explore donation-friendly organs. Hover to learn, click to see details.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Body */}
          <motion.div
            ref={scope}
            className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 md:p-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-red-500/10 via-transparent to-transparent" />

            <div className="relative">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-zinc-300">
                  <span className="font-medium text-white">Tip:</span> Hover organs for tooltip, click to pin details.
                </div>
                {activeId ? (
                  <button
                    type="button"
                    className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10"
                    onClick={() => setActiveId(null)}
                  >
                    Clear selection
                  </button>
                ) : null}
              </div>

              <div ref={svgWrapRef} className="mx-auto max-w-[520px] h-[860px] md:max-w-[560px] md:h-[1120px] flex items-center justify-center">
                <BodySvg />
              </div>
            </div>

            {/* Floating tooltip */}
            <AnimatePresence>
              {hoveredId ? (
                <motion.div
                  key="tooltip"
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-20 pointer-events-none"
                  style={{
                    left: Math.min(cursor.x + 14, (containerRef.current?.clientWidth || 0) - 220),
                    top: Math.max(cursor.y - 6, 8),
                  }}
                >
                  <div className="rounded-xl border border-white/10 bg-zinc-950/85 backdrop-blur px-3 py-2 shadow-xl">
                    <div className="text-sm font-medium">{titleFromId(hoveredId)}</div>
                    <div className="text-xs text-zinc-300">Click to learn more</div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>

          {/* Info panel */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {activeInfo ? (
                <motion.aside
                  key={activeId}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 md:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-zinc-300">Selected organ</div>
                      <h2 className="mt-1 text-xl font-semibold">{activeInfo.name}</h2>
                    </div>
                    <span
                      className={[
                        "shrink-0 text-xs px-3 py-1 rounded-full border",
                        activeInfo.canDonate ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-200" : "bg-amber-500/15 border-amber-400/30 text-amber-200",
                      ].join(" ")}
                    >
                      {activeInfo.canDonate ? "Can be donated" : "Not typically donated"}
                    </span>
                  </div>

                  <div className="mt-4 text-sm text-zinc-200 leading-relaxed">{activeInfo.description}</div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-3 col-span-1">
                      <div className="text-xs text-zinc-300">Why it matters</div>
                      <div className="mt-1 text-sm text-white">{activeInfo?.impact || "Saving lives through donation"}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-3 col-span-1">
                      <div className="text-xs text-zinc-300">Next step</div>
                      <div className="mt-1 text-sm text-white">Learn eligibility & register</div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium shadow-lg shadow-red-500/20"
                      onClick={() => {
                        // Placeholder: wire to your donation flow later
                        alert("Coming soon: link to donation registration flow.");
                      }}
                    >
                      Become a donor
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm"
                      onClick={() => setActiveId(null)}
                    >
                      Close
                    </button>
                  </div>
                </motion.aside>
              ) : (
                <motion.aside
                  key="empty"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 md:p-6"
                >
                  <div className="text-xs uppercase tracking-wider text-zinc-300">Info panel</div>
                  <h2 className="mt-1 text-xl font-semibold">Select an organ</h2>
                  <p className="mt-2 !text-[18px] text-zinc-200">
                    Hover an organ to see its name, then click to pin details here. We’ll expand these descriptions with real educational content next.
                  </p>

                  <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4">
                    <div className="text-sm font-medium">Or click one of the organs below</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.keys(ORGAN_INFO).slice(0, 6).map((id) => (
                        <button
                          key={id}
                          type="button"
                          className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10"
                          onClick={() => openFocusById(id)}
                        >
                          {ORGAN_INFO[id].name}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Focus overlay: zoom organ to left, blur/dim background, animate info on right */}
      <AnimatePresence>
        {focus?.id && focus?.svgMarkup ? (
          <motion.div
            key="organ-focus"
            className="fixed inset-0 z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Backdrop blur + dim */}
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 w-full h-full cursor-default"
              onClick={() => setFocus(null)}
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)" }}
            />

            <div className="relative mx-auto max-w-6xl h-full px-4 py-8 flex items-center">
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Left: isolated organ */}
                <motion.div
                  className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 md:p-6 overflow-hidden"
                  initial={() => {
                    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
                    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
                    return {
                      opacity: 0,
                      x: focus.clickX - vw * 0.25,
                      y: focus.clickY - vh * 0.5,
                      scale: 0.6,
                    };
                  }}
                  animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 140, damping: 18 }}
                >
                  <div className="text-xs uppercase tracking-wider text-zinc-300">Focused organ</div>
                  <div className="mt-2 h-[320px] md:h-[420px] flex items-center justify-center animate-pulse-scale">
                    <div className="w-full h-full max-w-[420px]" dangerouslySetInnerHTML={{ __html: focus.svgMarkup }} />
                  </div>
                </motion.div>

                {/* Right: animated info */}
                <motion.aside
                  className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 md:p-7"
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={{
                    show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
                    hidden: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
                  }}
                >
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                    className="flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs uppercase tracking-wider text-zinc-300">Organ details</div>
                      <h2 className="mt-1 text-2xl font-semibold">{activeInfo?.name || titleFromId(focus.id)}</h2>
                    </div>
                    <button
                      type="button"
                      className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10"
                      onClick={() => setFocus(null)}
                    >
                      Close
                    </button>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="mt-3">
                    <span
                      className={[
                        "inline-flex text-xs px-3 py-1 rounded-full border",
                        activeInfo?.canDonate ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-200" : "bg-amber-500/15 border-amber-400/30 text-amber-200",
                      ].join(" ")}
                    >
                      {activeInfo?.canDonate ? "Can be donated" : "Not typically donated"}
                    </span>
                  </motion.div>

                  <motion.p
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                    className="mt-4 text-sm md:text-base text-zinc-100 leading-relaxed"
                  >
                    <TypingText
                      key={focus.id}
                      text={
                        activeInfo?.description ||
                        "Placeholder: Donation can save lives. This organ’s educational description will be added soon."
                      }
                      speed={80}
                    />
                  </motion.p>

                  <motion.div
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                    className="mt-6 grid grid-cols-2 gap-3"
                  >
                    <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-3">
                      <div className="text-xs text-zinc-300">Impact</div>
                      <div className="mt-1 text-sm text-white">{activeInfo?.impact || "One donor can save multiple lives"}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-3">
                      <div className="text-xs text-zinc-300">Learn more</div>
                      <div className="mt-1 text-sm text-white">Eligibility & donation steps</div>
                    </div>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="mt-6 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium shadow-lg shadow-red-500/20"
                      onClick={() => alert("Coming soon: link to donation registration flow.")}
                    >
                      Become a donor
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm"
                      onClick={() => setFocus(null)}
                    >
                      Back to body
                    </button>
                  </motion.div>
                </motion.aside>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

