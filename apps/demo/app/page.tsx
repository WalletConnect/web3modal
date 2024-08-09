'use client'

import Gradient from '@/components/Gradient'
import ConfigSection from '@/components/ConfigSection'
import ViewSection from '@/components/ViewSection'
import NavSection from '@/components/NavSection'
import { motion } from 'framer-motion'
import { VARIANTS } from '@/utils/constants'

export default function Home() {
  // AppKit Demo
  return (
    <motion.main
      variants={VARIANTS}
      initial="initial"
      animate="animate"
      transition={{
        delayChildren: 0.2,
        staggerChildren: 0.4
      }}
      className="h-d-screen relative overflow-hidden"
    >
      <NavSection />
      <div className="grid grid-cols-3 h-full pt-20">
        <div className="col-span-1 bg-white border-r border-slate-100 relative">
          <ConfigSection />
        </div>
        <div className="col-span-2 shadow-[inset_0_-2px_24px_rgba(0,0,0,0.05)] px-12 py-8 grid place-items-center relative">
          <ViewSection />
        </div>
      </div>
      <Gradient />
    </motion.main>
  )
}
