import React from 'react';
import { motion } from 'motion/react';
import { Plus, LogIn } from 'lucide-react';
import type { AppCopy } from '../../i18n';
import { sound } from '../../utils/sound';

interface HomeScreenProps {
  copy: AppCopy;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ copy, onCreateRoom, onJoinRoom }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-14 flex flex-col lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center min-h-[calc(100dvh-72px)]">
      {/* Left / Hero Column */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left"
      >
        {/* Nostalgic stacked paper-chit motif */}
        <div className="relative flex items-center justify-center mb-6 select-none" aria-hidden="true">
          <div className="w-14 h-16 rounded-lg folded-chit -rotate-12 -mr-4 flex items-center justify-center shadow-lg">
            <span className="text-xl">👑</span>
          </div>
          <div className="w-16 h-20 rounded-lg paper-card z-10 flex items-center justify-center shadow-xl border border-[#C5902D]/50">
            <span className="text-2xl">🕵️</span>
          </div>
          <div className="w-14 h-16 rounded-lg folded-chit rotate-12 -ml-4 flex items-center justify-center shadow-lg">
            <span className="text-xl">🥷</span>
          </div>
        </div>

        <p className="text-xs tracking-[0.12em] uppercase text-[#D9A441] font-semibold mb-2">
          {copy.nostalgiaTag}
        </p>

        <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#F6EFE0] leading-[1.12] text-balance">
          {copy.appName}
        </h1>

        <p className="mt-3 text-lg sm:text-xl text-[#D0C8B8] max-w-md leading-relaxed">
          {copy.subtitle}
        </p>

        {/* Primary Thumb-Reach Actions */}
        <div className="w-full max-w-sm lg:max-w-md mt-8 flex flex-col sm:flex-row gap-3.5">
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onCreateRoom();
            }}
            className="flex-1 min-h-[54px] px-6 py-3.5 rounded-xl bg-[#D9A441] hover:bg-[#E4B354] active:scale-[0.98] text-[#1A140E] font-bold text-base tracking-wide flex items-center justify-center gap-2.5 shadow-[0_8px_24px_rgba(217,164,65,0.28)] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6EFE0]"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span>{copy.actions.createRoom}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onJoinRoom();
            }}
            className="flex-1 min-h-[54px] px-6 py-3.5 rounded-xl bg-[#222A3D] hover:bg-[#2A344B] active:scale-[0.98] text-[#F6EFE0] border border-[#D9A441]/35 font-bold text-base tracking-wide flex items-center justify-center gap-2.5 transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A441]"
          >
            <LogIn size={20} strokeWidth={2.2} />
            <span>{copy.actions.joinRoom}</span>
          </button>
        </div>
      </motion.section>

      {/* Right / Paper Rules Card */}
      <motion.aside
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="lg:col-span-5 mt-10 lg:mt-0 w-full max-w-md mx-auto lg:max-w-none"
      >
        <div className="paper-card rounded-2xl p-6 sm:p-7">
          <h2 className="font-display font-bold text-xl text-[#1F1B18] mb-4">
            {copy.home.howItWorksTitle}
          </h2>
          <ol className="space-y-4">
            {copy.home.howItWorksSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-3.5">
                <span className="font-mono-code font-bold text-sm text-[#8C5E14] pt-0.5 shrink-0">
                  0{index + 1}.
                </span>
                <p className="text-sm sm:text-[15px] text-[#3B332B] leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>

          <div className="mt-6 pt-4 border-t border-[#8B7355]/25 flex items-center justify-between text-xs text-[#6B5B4A] font-medium">
            <span>{copy.home.badges[0]}</span>
            <span aria-hidden="true">·</span>
            <span>{copy.home.badges[1]}</span>
            <span aria-hidden="true">·</span>
            <span>{copy.home.badges[2]}</span>
          </div>
        </div>
      </motion.aside>
    </div>
  );
};
