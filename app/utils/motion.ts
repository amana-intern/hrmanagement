// Shared motion tokens so every animated component in the app moves the same way.
// Springs for anything interactive (modals, buttons, sliding highlights).
// Eased tweens for decorative/sequential reveals (page transitions, list staggers, expand/collapse).

export const easeOut = [0.22, 1, 0.36, 1] as const;

// Lower stiffness / lower damping = slower to settle and more visible motion.
export const springSnappy = { type: 'spring', stiffness: 110, damping: 15 } as const;
export const springSoft = { type: 'spring', stiffness: 60, damping: 13 } as const;

export const durationFast = 0.35;
export const durationBase = 0.5;
export const durationSlow = 0.7;

/** Fade + rise, for cards/rows appearing into view. Relies on variant propagation —
 * pair with an ancestor that sets `initial="hidden" animate="visible"` (or "exit"). */
export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: durationBase, ease: easeOut } },
  exit: { opacity: 0, y: -8, transition: { duration: durationFast, ease: easeOut } },
};

/** Stagger container: apply to a parent, pair children with `fadeUp`. */
export function staggerContainer(staggerChildren = 0.05, delayChildren = 0) {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren, delayChildren },
    },
  };
}

/** Pure timing orchestrator for the page-route transition — no visual properties of
 * its own, just staggers descendant `motion.*` components (e.g. `SectionCard`,
 * `PageTopBar`) that declare `variants={fadeUp}` and inherit this state. */
export const pageStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
  exit: {},
};
