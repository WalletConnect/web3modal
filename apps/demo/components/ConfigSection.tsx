'use client';

import React from 'react';
import Button from './ui/button';
import { motion } from 'framer-motion';
import { VARIANTS } from '@/utils/constants';
import { useConfig } from '@/store/ConfigStore';
import Switch from './ui/switch';

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="w-4 h-4 ml-1"
    >
      <title>Copy Icon</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
      />
    </svg>
  );
}

export default function ConfigSection() {
  const {
    enableEmail,
    enableInjected,
    enableEIP6963,
    enableCoinbase,
    setEnableEmail,
    setEnableInjected,
    setEnableEIP6963,
    setEnableCoinbase,
  } = useConfig();

  return (
    <motion.div variants={VARIANTS} className="h-full">
      <motion.div
        variants={VARIANTS}
        initial="initial"
        animate="animate"
        transition={{
          delayChildren: 0.8,
          staggerChildren: 0.2,
        }}
        className="flex flex-col h-full"
      >
        <div className="flex-grow px-12 py-8">
          <motion.h1 variants={VARIANTS} className="text-xl font-bold">
            Build Your Own AppKit
          </motion.h1>
          <motion.p variants={VARIANTS} className="text-[var(--navy-400)] text-sm mt-1 mb-6">
            Modify the configuration to suit your needs. You can copy the config and use it in your
            project.
          </motion.p>
          <motion.div variants={VARIANTS} className="space-y-4">
            <Switch label="Enable Email" checked={enableEmail} onCheckedChange={setEnableEmail} />
            <Switch label="Enable Injected" checked={enableInjected} onCheckedChange={setEnableInjected} />
            <Switch label="Enable EIP-6963" checked={enableEIP6963} onCheckedChange={setEnableEIP6963} />
            <Switch label="Enable Coinbase" checked={enableCoinbase} onCheckedChange={setEnableCoinbase} />
          </motion.div>
        </div>
        <div className="px-10 py-8 bg-white border-t border-slate-100 w-full flex items-center justify-between">
          <Button
            variant="link"
            value="Documentation"
            href="https://docs.reown.com/appkit/overview"
          />
          <Button value="Copy Config" icon={<CopyIcon />} />
        </div>
      </motion.div>
    </motion.div>
  );
}
