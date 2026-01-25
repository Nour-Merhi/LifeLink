import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
import "../../styles/ScrollReveal.css";

/**
 * Wraps content and reveals it with a scroll-triggered animation when it enters the viewport.
 * Uses IntersectionObserver under the hood.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {'fade-up'|'fade-in'|'slide-left'|'slide-right'} [props.animation='fade-up']
 * @param {number} [props.delay=0] - CSS transition-delay in ms (e.g. for staggering)
 * @param {string} [props.className] - Additional class names
 * @param {string} [props.id] - HTML id for the wrapper
 * @param {string} [props.as='section'] - HTML element to render
 */
export default function AnimatedSection({
  children,
  animation = "fade-up",
  delay = 0,
  className = "",
  id,
  as: Component = "section",
  ...rest
}) {
  const { ref, isInView } = useIntersectionObserver({
    threshold: 0.15,
    rootMargin: "0px 0px -40px 0px",
    triggerOnce: true,
  });

  const classes = [
    "scroll-reveal",
    `scroll-reveal--${animation}`,
    isInView ? "scroll-reveal--visible" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style = delay > 0 ? { transitionDelay: `${delay}ms` } : undefined;

  return (
    <Component ref={ref} id={id} className={classes} style={style} {...rest}>
      {children}
    </Component>
  );
}
