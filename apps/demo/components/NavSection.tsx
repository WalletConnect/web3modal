'use client'

import Image from 'next/image'
import W3mLogo from '@/assets/images/w3m-logo.png'
import { motion } from 'framer-motion'
import { VARIANTS } from '@/utils/constants'

export default function NavSection() {
  return (
    <nav className="fixed top-0 left-0 h-20 w-full px-10 text-2xl flex items-center font-bold gap-2 bg-white border-b border-slate-100">
      <motion.a variants={VARIANTS} href="/" className="flex gap-2 items-center leading-none">
        <Image
          src={W3mLogo}
          placeholder="blur"
          alt="AppKit Logo"
          width={40}
          height={40}
          className="rounded-lg"
        />
        <span className="pt-0.5">AppKit</span>
      </motion.a>
    </nav>
  )
}
