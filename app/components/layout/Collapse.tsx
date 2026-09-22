'use client';

import { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { durationFast, easeOut } from '@/app/utils/motion';

/**
 * Animates height 0 <-> 'auto' — framer-motion measures the real DOM height itself
 * rather than the app pre-computing a pixel value, which is what made the earlier
 * CSS max-height/timer and framer-motion-spring attempts snap (they guessed a height
 * instead of measuring it).
 */
export default function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="collapse"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: durationFast, ease: easeOut }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
