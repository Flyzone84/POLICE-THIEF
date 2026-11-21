import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, PartyPopper, ShieldAlert } from 'lucide-react';
import type { AppCopy } from '../../i18n';
import { ClientGameState } from '../../shared/types';
import { RoleIllustration } from '../ui/RoleVisuals';
import { ConfettiPopper } from '../ui/ConfettiPopper';
import { sound } from '../../utils/sound';

interface GuessResultScreenProps {
  copy: AppCopy;
  state: ClientGameState;
}

export const GuessResultScreen: React.FC<GuessResultScreenProps> = ({ copy, state }) => {
  const result = state.guessResult;

  const isPoliceViewer = result?.policePlayerId === state.myPlayerId;
  const isThiefViewer = result?.thiefPlayerId === state.myPlayerId;
  const isLastRound = state.currentRound >= state.settings.totalRounds;

  useEffect(() => {
    if (!result) return;
    if (result.caught) {
      sound.playCaught(isThiefViewer);
    } else {
      sound.playEscaped(isThiefViewer);
    }
  }, [result, isThiefViewer]);

  if (!result) return null;

  const showCelebrationPopper =
    state.settings.animationsEnabled &&
    ((result.caught && !isThiefViewer) || (!result.caught && isThiefViewer));

  const showBustedDrops =
    state.settings.animationsEnabled && result.caught && isThiefViewer;

  let heading = '';
  let subheading = '';
  let badgeText = '';

  if (result.caught) {
    if (isPoliceViewer) {
      heading = copy.guessResult.policeCaughtTitle;
      subheading = copy.guessResult.policeCaughtSubtitle;
      badgeText = copy.guessResult.caughtBadge;
    } else if (isThiefViewer) {
      heading = copy.guessResult.thiefCaughtTitle;
      subheading = copy.guessResult.thiefCaughtSubtitle;
      badgeText = copy.guessResult.bustedBadge;
    } else {
      heading = copy.guessResult.caughtTitle;
      subheading = copy.guessResult.caughtSubtitle;
      badgeText = copy.guessResult.caughtBadge;
    }
  } else {
    if (isThiefViewer) {
      heading = copy.guessResult.thiefEscapedTitle;
      subheading = copy.guessResult.thiefEscapedSubtitle;
      badgeText = copy.guessResult.escapedBadge;
    } else if (isPoliceViewer) {
      heading = copy.guessResult.policeMissedTitle;
      subheading = copy.guessResult.policeMissedSubtitle;
      badgeText = copy.guessResult.escapedBadge;
    } else {
      heading = copy.guessResult.escapedTitle;
      subheading = copy.guessResult.escapedSubtitle;
      badgeText = copy.guessResult.escapedBadge;
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 pb-16 min-h-[calc(100dvh-72px)] flex flex-col justify-center relative">
      <ConfettiPopper active={showCelebrationPopper} variant="celebration" />
      <ConfettiPopper active={showBustedDrops} variant="busted" />

      {/* Verdict Stamp Header */}
      <motion.div
        initial={state.settings.animationsEnabled ? { scale: 0.9, opacity: 0 } : false}
        animate={
          result.caught && isThiefViewer && state.settings.animationsEnabled
            ? { scale: 1, opacity: 1, x: [-7, 7, -5, 5, -2, 2, 0] }
            : { scale: 1, opacity: 1 }
        }
        transition={{ duration: 0.45 }}
        className="text-center mb-6"
      >
        {result.caught && isThiefViewer && (
          <div
            className="mx-auto mb-4 w-28 h-24 rounded-2xl bg-[#1A1316] border border-[#9E2A2B]/60 relative overflow-hidden flex items-center justify-center shadow-inner"
            aria-hidden="true"
          >
            <span className="text-4xl z-0">😔</span>
            <div className="absolute inset-0 flex justify-evenly pointer-events-none">
              <div className="w-1.5 h-full bg-[#3A4052]/85" />
              <div className="w-1.5 h-full bg-[#3A4052]/85" />
              <div className="w-1.5 h-full bg-[#3A4052]/85" />
              <div className="w-1.5 h-full bg-[#3A4052]/85" />
            </div>
          </div>
        )}

        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm tracking-wide mb-3 ${
            result.caught && !isThiefViewer
              ? 'bg-[#3A7D6B]/25 text-[#7DE0C1] border border-[#3A7D6B]/50'
              : !result.caught && isThiefViewer
              ? 'bg-[#D9A441]/25 text-[#F6D37A] border border-[#D9A441]/60'
              : 'bg-[#B83B3B]/25 text-[#F29C9C] border border-[#B83B3B]/50'
          }`}
        >
          {result.caught && isPoliceViewer ? (
            <PartyPopper size={18} />
          ) : result.caught && !isThiefViewer ? (
            <CheckCircle2 size={18} />
          ) : !result.caught && isThiefViewer ? (
            <PartyPopper size={18} />
          ) : (
            <ShieldAlert size={18} />
          )}
          <span>{badgeText}</span>
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#F6EFE0]">
          {heading}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-[#D0C8B8] max-w-md mx-auto">
          {subheading}
        </p>
      </motion.div>

      {/* Revealed Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={state.settings.animationsEnabled ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className={`paper-card rounded-2xl p-5 flex items-center gap-4 ${
            isPoliceViewer ? 'ring-2 ring-[#D9A441]' : ''
          }`}
        >
          <RoleIllustration role="Police" size="md" />
          <div className="min-w-0">
            <span className="text-[11px] font-mono-code font-bold tracking-[0.14em] text-[#254E70]">
              {copy.guessResult.policeLabel}
            </span>
            <h2 className="font-display font-bold text-xl text-[#1F1B18] truncate mt-0.5">
              {result.policePlayerName}
            </h2>
            <p className="text-xs font-semibold text-[#5A4D40] mt-1 tabular-nums">
              {result.caught
                ? copy.guessResult.rewardClaimed(result.policeReward)
                : copy.guessResult.zeroRound}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={state.settings.animationsEnabled ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className={`paper-card rounded-2xl p-5 flex items-center gap-4 ${
            isThiefViewer && result.caught ? 'opacity-85 grayscale-[30%]' : ''
          }`}
        >
          <RoleIllustration role="Thief" size="md" />
          <div className="min-w-0">
            <span className="text-[11px] font-mono-code font-bold tracking-[0.14em] text-[#9E2A2B]">
              {copy.guessResult.thiefLabel}
            </span>
            <h2 className="font-display font-bold text-xl text-[#1F1B18] truncate mt-0.5">
              {result.thiefPlayerName}
            </h2>
            <p className="text-xs font-semibold text-[#5A4D40] mt-1 tabular-nums">
              {result.caught
                ? copy.guessResult.zeroCaught
                : copy.guessResult.rewardStolen(result.policeReward)}
            </p>
          </div>
        </motion.div>
      </div>

      {!result.caught && (
        <div className="mt-4 bg-[#1B2233] border border-[#2B354D] rounded-xl p-4 text-center text-sm text-[#D0C8B8]">
          <span>{copy.guessResult.guessedLabel}: </span>
          <strong className="text-[#F6EFE0]">{result.guessedPlayerName}</strong>
          <span aria-hidden="true"> · </span>
          <span className="text-[#7DE0C1] font-medium">{copy.guessResult.innocentLabel}</span>
        </div>
      )}

      {/* Smooth Automatic Progression Indicator (No Host Button Needed) */}
      <div className="mt-8 max-w-xs mx-auto w-full text-center">
        <p className="text-xs font-medium text-[#A9B2C7] mb-2">
          {isLastRound
            ? copy.guessResult.finalScoreboardOpening
            : copy.guessResult.nextRoundStarting}
        </p>
        <div className="h-1 w-full bg-[#242D42] rounded-full overflow-hidden">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: state.settings.animationsEnabled ? 3.7 : 1.4,
              ease: 'linear',
            }}
            style={{ transformOrigin: 'left' }}
            className="h-full bg-[#D9A441]"
          />
        </div>
      </div>
    </div>
  );
};
