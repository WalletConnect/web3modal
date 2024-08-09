'use client'

import { VARIANTS } from '@/utils/constants'
import React from 'react'
import { motion } from 'framer-motion'
import { useConfig } from '@/store/ConfigStore'

export default function ViewSection() {
  const { enableEmail, enableEIP6963, enableInjected, enableCoinbase } = useConfig()

  return (
    <motion.div
      variants={VARIANTS}
      className="bg-white relative h-[36rem] w-96 grid place-items-center rounded-3xl text-xl shadow-slate-900/5 shadow-lg border-slate-200 border text-center p-8"
    >
      <p className="absolute top-0 ml-auto py-8 opacity-50 text-sm">Hopefully AppKit here lol</p>
      <div className="w-full">
        <p className="flex justify-between">
          Email:
          <span>{enableEmail ? '🟢' : '🔴'}</span>
        </p>
        <p className="flex justify-between">
          EIP-6963:
          <span>{enableEIP6963 ? '🟢' : '🔴'}</span>
        </p>
        <p className="flex justify-between">
          Injected:
          <span>{enableInjected ? '🟢' : '🔴'}</span>
        </p>
        <p className="flex justify-between">
          Coinbase:
          <span>{enableCoinbase ? '🟢' : '🔴'}</span>
        </p>
      </div>
    </motion.div>
  )
}
