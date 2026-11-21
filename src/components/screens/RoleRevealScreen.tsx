import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, EyeOff, Volume2 } from 'lucide-react';
import type { AppCopy } from '../../i18n';
import { ClientGameState } from '../../shared/types';
import { ROLE_THEMES, RoleIllustration } from '../ui/RoleVisuals';
import { Spinner } from '../ui/TableLoader';
import { sound } from '../../utils/sound';

interface RoleRevealScreenProps {
  copy: AppCopy;
  state: ClientGameState;
  isConfirming?: boolean;
  onConfirmRole: () => void;
  onForceProceed: () => void;
}

export const RoleRevealScreen: React.FC<RoleRevealScreenProps> = ({
  copy,
  state,
  isConfirming = false,
  onConfirmRole,
  onForceProceed,
}) => {
  const [flipped, setFlipped] = useState(false);

  const me = state.players.find((p) => p.id === state.myPlayerId);
  const isHost = Boolean(me?.isHost);
  const hasConfirmed = Boolean(me?.hasConfirmedRole);
  const role = state.myRole;
  const points = state.myRolePoints ?? 0;

  const readyCount = state.players.filter((p) => p.hasConfirmedRole).length;
  const totalCount = state.players.length;

  const handleFlip = () => {
    if (flipped || !role) return;
    sound.playFlip();
    setFlipped(true);
    setTimeout(() => {
      sound.playReveal(role);
    }, 180);
  };

  if (!role) return null;

  const roleCopy = copy.roles[role];
  const theme = ROLE_THEMES[role];

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 pb-28 min-h-[calc(100dvh-72px)] flex flex-col items-center justify-center">
      <div className="text-center mb-5">
        <p className="font-mono-code text-xs tracking-[0.2em] uppercase text-[#D9A441] font-bold">
          {copy.roleReveal.eyebrow}
        </p>
        <p className="mt-1 text-xs text-[#9FA8BD] flex items-center justify-center gap-1.5">
          <EyeOff size={13} />
          <span>{copy.roleReveal.hideReminder}</span>
        </p>
      </div>

      {/* 3D Flip Card */}
      <div className="w-full max-w-[320px] perspective-1000">
        <button
          type="button"
          onClick={handleFlip}
          aria-label={flipped ? `${roleCopy.title}` : copy.roleReveal.tapToFlip}
          className="relative w-full aspect-[3/4] text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A441] rounded-2xl"
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{
              duration: state.settings.animationsEnabled ? 0.55 : 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative w-full h-full preserve-3d"
          >
            {/* Front: Sealed Folded Chit */}
            <div className="absolute inset-0 backface-hidden rounded-2xl folded-chit p-6 flex flex-col items-center justify-center text-center border border-[#8B7355]/45">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#8B7355]/60 flex items-center justify-center mb-4 bg-[#F6EFE0]/60">
                <span className="font-display font-bold text-3xl text-[#5C4938]">?</span>
              </div>
              <h2 className="font-display font-bold text-2xl text-[#241E1A]">
                {copy.roleReveal.chitTitle((state.mySlotIndex ?? 0) + 1)}
              </h2>
              <p className="mt-2 text-sm text-[#6B5B4A] font-medium">
                {copy.roleReveal.tapToFlip}
              </p>
              <div className="mt-6 px-4 py-1.5 rounded-lg bg-[#1F1B18] text-[#F6EFE0] text-xs font-semibold tracking-wide">
                {copy.roleReveal.tapToOpenBadge}
              </div>
            </div>

            {/* Back: Revealed Role Card */}
            <div
              className={`absolute inset-0 backface-hidden rotate-y-180 rounded-2xl paper-card p-6 flex flex-col items-center justify-between text-center border-2 ${theme.borderColor}`}
            >
              <div className="w-full flex items-center justify-between text-xs font-mono-code font-bold text-[#6B5B4A]">
                <span>{copy.roleReveal.roundShort(state.currentRound)}</span>
                <span>
                  {points} {copy.roleReveal.ptsShort}
                </span>
              </div>

              <div className="my-auto flex flex-col items-center">
                <RoleIllustration role={role} size="lg" />

                <h2 className={`font-display font-extrabold text-3xl mt-4 tracking-wide ${theme.accentText}`}>
                  {roleCopy.title}
                </h2>
                <p className="font-mono-code font-bold text-sm text-[#3B332B] mt-1">
                  {points} {copy.roleReveal.pointsUnit}
                </p>
                <p className="text-sm text-[#5A4D40] mt-2 font-medium max-w-[22ch]">
                  {roleCopy.revealHint}
                </p>
              </div>

              <div className="w-full pt-3 border-t border-[#8B7355]/25 text-xs text-[#6B5B4A] italic">
                “{roleCopy.tagline}”
              </div>
            </div>
          </motion.div>
        </button>
      </div>

      {/* Action / Ready State + Funny Card Sound Replay */}
      <div className="w-full max-w-[320px] mt-5 space-y-2.5">
        {flipped && (
          <button
            type="button"
            onClick={() => sound.playReveal(role)}
            className="w-full min-h-[40px] px-4 py-1.5 rounded-xl bg-[#1B2233]/80 hover:bg-[#242D42] border border-[#2D3852] text-xs font-semibold text-[#D9A441] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Volume2 size={14} />
            <span>{copy.actions.replaySound}</span>
          </button>
        )}

        {flipped && !hasConfirmed && (
          <button
            type="button"
            disabled={isConfirming}
            onClick={() => {
              sound.playTap();
              onConfirmRole();
            }}
            className="w-full min-h-[52px] px-6 py-3.5 rounded-xl bg-[#D9A441] hover:bg-[#E4B354] disabled:opacity-75 active:scale-[0.98] text-[#1A140E] font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(217,164,65,0.28)] transition-all cursor-pointer disabled:cursor-wait"
          >
            {isConfirming ? <Spinner size={18} /> : <Check size={18} strokeWidth={2.5} />}
            <span>{isConfirming ? copy.loading.confirmingRole : copy.actions.ready}</span>
          </button>
        )}

        {flipped && hasConfirmed && (
          <div className="w-full min-h-[50px] px-4 py-3 rounded-xl bg-[#1B2233] border border-[#2B354D] text-center">
            <p className="text-sm font-medium text-[#F6EFE0]">{copy.actions.waitingOthers}</p>
            <p className="text-xs text-[#9FA8BD] mt-0.5 tabular-nums">
              {copy.roleReveal.readyCount(readyCount, totalCount)}
            </p>
          </div>
        )}

        {isHost && flipped && hasConfirmed && readyCount < totalCount && (
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onForceProceed();
            }}
            className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-transparent hover:bg-[#1B2233] border border-[#34405C] text-xs font-semibold text-[#D0C8B8] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{copy.actions.proceedToHunt}</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
