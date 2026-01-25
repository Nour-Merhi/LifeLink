import { useEffect, useRef, useState } from "react";

/**
 * Observes an element with IntersectionObserver and reports when it enters the viewport.
 * @param {Object} options
 * @param {number} [options.threshold=0.15] - Ratio of element visible to trigger (0–1)
 * @param {string} [options.rootMargin='0px 0px -40px 0px'] - Margin around root (negative bottom = trigger earlier)
 * @param {boolean} [options.triggerOnce=true] - If true, stop observing after first intersect (animate once)
 * @returns {{ ref: React.RefObject, isInView: boolean }}
 */
export function useIntersectionObserver(options = {}) {
  const {
    threshold = 0.15,
    rootMargin = "0px 0px -40px 0px",
    triggerOnce = true,
  } = options;

  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            setIsInView(false);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isInView };
}
