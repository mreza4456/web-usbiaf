"use client"

import { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';

// ─── Animation Variants ────────────────────────────────────────────────────────

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay: i * 0.1 },
  }),
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

// ─── AnimateWhenVisible ────────────────────────────────────────────────────────

interface AnimateProps {
  children: React.ReactNode;
  variants?: Variants;
  custom?: number;
  className?: string;
}

export function AnimateWhenVisible({ children, variants = fadeUp, custom, className = '' }: AnimateProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      variants={variants}
      custom={custom}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerContainer ─────────────────────────────────────────────────────────

export function StaggerContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{
        visible: { transition: { staggerChildren: 0.12 } },
        hidden: {},
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── HeroMotion ───────────────────────────────────────────────────────────────
// Wraps each hero line with its own entrance animation

interface HeroMotionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function HeroMotion({ children, delay = 0, className = '' }: HeroMotionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── MotionFeatureItem ────────────────────────────────────────────────────────

export function MotionFeatureItem({ feature, index }: { feature: string; index: number }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="flex items-center px-5 bg-white overflow-hidden rounded-full shadow-sm hover:shadow-md transition-all"
    >
      <div className="bg-gray-100 p-3 aspect-square h-full flex items-center justify-center">
        <img src="images/stars.png" alt="star" className="w-7 h-7" />
      </div>
      <span className="text-arial text-primary p-3">{feature}</span>
    </motion.div>
  );
}