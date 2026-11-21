import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Eye, Search, ShieldAlert, X } from 'lucide-react';
import type { AppCopy } from '../../i18n';
import { ClientGameState, PublicPlayer } from '../../shared/types';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import { Spinner } from '../ui/TableLoader';
import { sound } from '../../utils/sound';

interface PoliceInvestigationScreenProps {
  copy: AppCopy;
  state: ClientGameState;
  isSubmitting?: boolean;
  onSubmitGuess: (targetPlayerId: string) => void;
}

export const PoliceInvestigationScreen: React.FC<PoliceInvestigationScreenProps> = ({
  copy,
  state,
  isSubmitting = false,
  onSubmitGuess,
}) => {
  const [candidate, setCandidate] = useState<PublicPlayer | null>(null);
  const [peeking, setPeeking] = useState(false);

  useEffect(() => {
    if (state.isPolice) {
      sound.playPoliceAlert();
    }
  }, [state.isPolice]);

  const suspects = state.players.filter((p) => p.id !== state.myPlayerId);

  if (state.isPolice) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-6 pb-16">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono-code font-bold tracking-[0.18em] uppercase text-[#D9A441] mb-2">
            <Search size={14} />
            <span>{copy.investigation.policeTitle}</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#F6EFE0]">
            {copy.investigation.policePrompt}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#C5BFA8]">
            {copy.investigation.policeSubtext}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {suspects.map((player, idx) => (
            <motion.button
              key={player.id}
              type="button"
              initial={state.settings.animationsEnabled ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                sound.playTap();
                setCandidate(player);
              }}
              className="w-full min-h-[72px] p-4 rounded-2xl bg-[#1B2233] hover:bg-[#242E45] border border-[#323E5C] hover:border-[#D9A441] flex items-center justify-between gap-3 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A441]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <PlayerAvatar
                  name={player.name}
                  avatar={player.avatar}
                  color={player.color}
                  showAvatar={state.settings.showAvatars}
                  size="lg"
                />
                <div className="min-w-0">
                  <span className="block font-display font-bold text-lg text-[#F6EFE0] truncate">
                    {player.name}
                  </span>
                  <span className="text-xs text-[#9FA8BD]">
                    {copy.investigation.tapToAccuse}
                  </span>
                </div>
              </div>

              <span className="px-3 py-1.5 rounded-lg bg-[#2A344D] text-[#D9A441] text-xs font-bold whitespace-nowrap shrink-0">
                {copy.investigation.suspectBadge}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Confirmation Dialog */}
        {candidate && (
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="accuse-title"
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm bg-[#1B2233] border border-[#34405C] rounded-t-3xl sm:rounded-2xl p-6 text-center shadow-2xl"
            >
              <div className="flex justify-end -mt-2 -mr-2">
                <button
                  type="button"
                  onClick={() => setCandidate(null)}
                  aria-label="Close"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#9FA8BD] hover:text-[#F6EFE0] cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex justify-center mb-3">
                <PlayerAvatar
                  name={candidate.name}
                  avatar={candidate.avatar}
                  color={candidate.color}
                  showAvatar={state.settings.showAvatars}
                  size="lg"
                />
              </div>

              <h2 id="accuse-title" className="font-display font-bold text-2xl text-[#F6EFE0]">
                {copy.investigation.confirmTitle}
              </h2>
              <p className="mt-2 text-sm text-[#C5BFA8]">
                {copy.investigation.confirmBody(candidate.name)}
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    sound.playTap();
                    onSubmitGuess(candidate.id);
                    setCandidate(null);
                  }}
                  className="w-full min-h-[50px] px-5 py-3 rounded-xl bg-[#B83B3B] hover:bg-[#CA4646] disabled:opacity-75 active:scale-[0.98] text-[#FFF8F0] font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait"
                >
                  {isSubmitting ? <Spinner size={18} /> : <ShieldAlert size={18} />}
                  <span>
                    {isSubmitting ? copy.loading.submittingGuess : copy.actions.yesCatchThem}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setCandidate(null);
                  }}
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#263047] hover:bg-[#2F3B57] text-[#F6EFE0] font-semibold text-sm cursor-pointer"
                >
                  {copy.actions.cancel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 min-h-[calc(100dvh-72px)] flex flex-col items-center justify-center text-center">
      <motion.div
        animate={state.settings.animationsEnabled ? { scale: [1, 1.05, 1] } : undefined}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-full bg-[#1B2233] border border-[#D9A441]/40 flex items-center justify-center mb-6 text-3xl shadow-lg"
        aria-hidden="true"
      >
        🕵️
      </motion.div>

      <h1 className="font-display font-extrabold text-3xl text-[#F6EFE0]">
        {copy.investigation.waitingTitle}
      </h1>
      <p className="mt-2.5 text-base text-[#D0C8B8] leading-relaxed">
        {copy.investigation.waitingSubtitle}
      </p>
      <p className="mt-2 text-sm text-[#9FA8BD]">{copy.investigation.waitingHint}</p>

      {state.myRole && (
        <div className="mt-10 w-full max-w-xs">
          <button
            type="button"
            onPointerDown={() => setPeeking(true)}
            onPointerUp={() => setPeeking(false)}
            onPointerLeave={() => setPeeking(false)}
            onPointerCancel={() => setPeeking(false)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') setPeeking(true);
            }}
            onKeyUp={() => setPeeking(false)}
            className="w-full min-h-[54px] px-5 py-3 rounded-xl bg-[#1B2233] border border-[#34405C] text-sm font-semibold text-[#D0C8B8] flex items-center justify-center gap-2 select-none cursor-pointer"
          >
            <Eye size={17} />
            <span>
              {peeking
                ? `${copy.roles[state.myRole].title} (${state.myRolePoints} ${copy.roleReveal.ptsShort})`
                : copy.investigation.peekMyRole}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
