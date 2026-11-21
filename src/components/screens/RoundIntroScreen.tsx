import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import type { AppCopy } from '../../i18n';
import { ClientGameState } from '../../shared/types';
import { sound } from '../../utils/sound';

interface RoundIntroScreenProps {
  copy: AppCopy;
  state: ClientGameState;
}

export const RoundIntroScreen: React.FC<RoundIntroScreenProps> = ({ copy, state }) => {
  useEffect(() => {
    sound.playShuffle();
  }, [state.currentRound]);

  const subtitle =
    state.currentRound === 1 ? copy.roundIntro.firstSubtitle : copy.roundIntro.nextSubtitle;

  return (
    <div className="w-full max-w-lg mx-auto px-4 min-h-[calc(100dvh-72px)] flex flex-col items-center justify-center text-center">
      <div className="relative h-32 w-52 flex items-center justify-center mb-8" aria-hidden="true">
        {[-1, 0, 1].map((offset) => (
          <motion.div
            key={offset}
            initial={{ x: offset * 28, rotate: offset * 8, scale: 0.94 }}
            animate={
              state.settings.animationsEnabled
                ? {
                    x: [offset * 28, -offset * 24, offset * 14, 0],
                    rotate: [offset * 8, -offset * 10, offset * 5, offset * 3],
                    y: [0, -10, 4, 0],
                  }
                : undefined
            }
            transition={{ duration: 1.4, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
            className="absolute w-20 h-24 rounded-xl folded-chit flex items-center justify-center shadow-xl"
          >
            <span className="font-display font-bold text-2xl text-[#6B5B4A]">?</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={state.settings.animationsEnabled ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="font-mono-code text-xs tracking-[0.18em] uppercase text-[#D9A441] font-bold mb-2">
          {copy.roundIntro.roundOf(state.currentRound, state.settings.totalRounds)}
        </p>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-[#F6EFE0] tracking-tight">
          {copy.roundIntro.roundTitle(state.currentRound)}
        </h1>
        <p className="mt-3 text-lg text-[#D0C8B8]">{subtitle}</p>
        <p className="mt-6 text-xs text-[#9FA8BD] tracking-wide">{copy.roundIntro.shuffling}</p>
      </motion.div>
    </div>
  );
};
