import React from 'react';
import { motion } from 'motion/react';
import { Lock, Check } from 'lucide-react';
import type { AppCopy } from '../../i18n';
import { PublicSlot } from '../../shared/types';
import { Spinner } from './TableLoader';

interface FoldedChitProps {
  slot: PublicSlot;
  isMine: boolean;
  isPending: boolean;
  disabled: boolean;
  animationsEnabled: boolean;
  copy: AppCopy;
  onSelect: (index: number) => void;
}

export const FoldedChit: React.FC<FoldedChitProps> = ({
  slot,
  isMine,
  isPending,
  disabled,
  animationsEnabled,
  copy,
  onSelect,
}) => {
  const isClaimedByOther = slot.claimedByPlayerId !== null && !isMine;

  return (
    <motion.button
      type="button"
      disabled={disabled || isClaimedByOther || isMine || isPending}
      onClick={() => onSelect(slot.index)}
      initial={animationsEnabled ? { opacity: 0, y: 10, rotate: slot.index % 2 === 0 ? -1.5 : 1.5 } : false}
      animate={{
        opacity: isClaimedByOther ? 0.36 : 1,
        y: isMine ? -4 : 0,
        scale: isMine ? 1.03 : 1,
        rotate: isMine ? 0 : slot.index % 2 === 0 ? -1 : 1,
      }}
      whileTap={!disabled && !isClaimedByOther && !isMine && !isPending ? { scale: 0.95 } : undefined}
      transition={{ duration: 0.15 }}
      aria-label={
        isMine
          ? `${copy.slotSelection.chitLabel(slot.index + 1)} — ${copy.slotSelection.yourChit}`
          : isClaimedByOther
          ? `${copy.slotSelection.chitLabel(slot.index + 1)} — ${slot.claimedByPlayerName}`
          : `${copy.slotSelection.chitLabel(slot.index + 1)} — ${copy.slotSelection.tapToPick}`
      }
      className={`relative w-full aspect-[4/3] min-h-[96px] rounded-xl p-3 flex flex-col items-center justify-center text-center transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A441] ${
        isMine || isPending
          ? 'paper-card ring-2 ring-[#D9A441] shadow-[0_12px_28px_rgba(217,164,65,0.3)] cursor-default'
          : isClaimedByOther
          ? 'bg-[#21293B] border border-[#323D54] text-[#9099AD] cursor-not-allowed'
          : disabled
          ? 'folded-chit opacity-70 cursor-not-allowed'
          : 'folded-chit hover:-translate-y-1 hover:shadow-[0_14px_26px_rgba(0,0,0,0.55)] cursor-pointer active:translate-y-0'
      }`}
    >
      {!isClaimedByOther && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 top-1/2 h-px bg-[#8B7355]/20"
        />
      )}

      {isPending ? (
        <>
          <div className="w-8 h-8 rounded-full bg-[#D9A441]/25 text-[#8C5E14] flex items-center justify-center mb-1.5">
            <Spinner size={18} />
          </div>
          <span className="font-display font-bold text-sm text-[#1F1B18]">
            {copy.loading.claimingChit}
          </span>
        </>
      ) : isMine ? (
        <>
          <div className="w-8 h-8 rounded-full bg-[#D9A441] text-[#1A1510] flex items-center justify-center mb-1.5 shadow-sm">
            <Check size={18} strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-sm text-[#1F1B18]">
            {copy.slotSelection.yourChit}
          </span>
          <span className="text-[11px] text-[#6B5B4A] font-medium mt-0.5">
            {copy.slotSelection.sealed}
          </span>
        </>
      ) : isClaimedByOther ? (
        <>
          <Lock size={18} className="text-[#7B8499] mb-1.5" />
          <span className="text-xs font-semibold text-[#C2C9D6] truncate max-w-full px-1">
            {slot.claimedByPlayerName}
          </span>
          <span className="text-[11px] text-[#7B8499] mt-0.5">{copy.slotSelection.taken}</span>
        </>
      ) : (
        <>
          <div className="w-9 h-9 rounded-full border border-[#8B7355]/45 bg-[#F6EFE0]/80 flex items-center justify-center mb-1.5 shadow-inner">
            <span className="font-display font-bold text-lg text-[#4A3B2C]">?</span>
          </div>
          <span className="font-display font-semibold text-sm text-[#2B231D]">
            {copy.slotSelection.chitLabel(slot.index + 1)}
          </span>
          <span className="text-[11px] text-[#7A6855] mt-0.5">
            {copy.slotSelection.tapToPick}
          </span>
        </>
      )}
    </motion.button>
  );
};
