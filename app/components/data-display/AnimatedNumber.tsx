'use client';

import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

/** Springs a numeric value from 0 up to `value` on mount/update, for stat counters. */
export default function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}
