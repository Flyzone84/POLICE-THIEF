import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Trophy } from 'lucide-react';
import type { AppCopy } from '../../i18n';
import { ClientGameState } from '../../shared/types';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import { ROLE_THEMES } from '../ui/RoleVisuals';
import { sound } from '../../utils/sound';

interface ScoreboardScreenProps {
  copy: AppCopy;
  state: ClientGameState;
  onNext: () => void;
}

export const ScoreboardScreen: React.FC<ScoreboardScreenProps> = ({ copy, state, onNext }) => {
  const entries = state.roundSummary || [];
  const me = state.players.find((p) => p.id === state.myPlayerId);
  const isHost = Boolean(me?.isHost);
  const isLastRound = state.currentRound >= state.settings.totalRounds;

  const renderRankIcon = (rank: number) => {
    if (rank === 1) return <span aria-label="1st">🏆</span>;
    if (rank === 2) return <span aria-label="2nd">🥈</span>;
    if (rank === 3) return <span aria-label="3rd">🥉</span>;
    return <span className="font-mono-code text-xs text-[#9FA8BD]">{rank}</span>;
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 pb-28">
      <div className="text-center mb-6">
        <p className="font-mono-code text-xs tracking-[0.2em] uppercase text-[#D9A441] font-bold">
          {copy.scoreboard.roundComplete(state.currentRound)}
        </p>
        <h1 className="font-display font-extrabold text-3xl text-[#F6EFE0] mt-1">
          {copy.scoreboard.standingsTitle}
        </h1>
        <p className="text-xs text-[#9FA8BD] mt-1">
          {copy.scoreboard.roundOf(state.currentRound, state.settings.totalRounds)}
        </p>
      </div>

      <div className="bg-[#1B2233] border border-[#2B354D] rounded-2xl overflow-hidden shadow-xl">
        <div className="grid grid-cols-12 px-4 py-3 border-b border-[#2B354D] text-[11px] font-semibold uppercase tracking-wider text-[#9FA8BD]">
          <div className="col-span-2">{copy.scoreboard.rankCol}</div>
          <div className="col-span-5">{copy.scoreboard.playerCol}</div>
          <div className="col-span-2 text-right">{copy.scoreboard.roundCol}</div>
          <div className="col-span-3 text-right">{copy.scoreboard.totalCol}</div>
        </div>

        <div className="divide-y divide-[#252E44]">
          {entries.map((entry, idx) => {
            const isMe = entry.playerId === state.myPlayerId;
            const roleTheme = ROLE_THEMES[entry.role];
            const localizedRole = copy.roles[entry.role]?.title || entry.role;
            return (
              <motion.div
                key={entry.playerId}
                initial={state.settings.animationsEnabled ? { opacity: 0, x: -8 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                className={`grid grid-cols-12 items-center px-4 py-3.5 ${
                  isMe ? 'bg-[#D9A441]/10' : ''
                }`}
              >
                <div className="col-span-2 flex items-center gap-1.5 font-bold text-base">
                  {renderRankIcon(entry.rank)}
                </div>

                <div className="col-span-5 flex items-center gap-2.5 min-w-0 pr-2">
                  <PlayerAvatar
                    name={entry.name}
                    avatar={entry.avatar}
                    color={entry.color}
                    showAvatar={state.settings.showAvatars}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[#F6EFE0] truncate">
                      {entry.name}
                      {isMe ? ` ${copy.lobby.youTag}` : ''}
                    </div>
                    <div className="text-xs text-[#A9B2C7] flex items-center gap-1">
                      <span aria-hidden="true">{roleTheme.emoji}</span>
                      <span>{localizedRole}</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 text-right font-mono-code text-xs sm:text-sm font-semibold text-[#7DE0C1] tabular-nums">
                  +{entry.roundPoints}
                </div>

                <div className="col-span-3 text-right font-mono-code text-base font-bold text-[#F6EFE0] tabular-nums">
                  {entry.totalScore}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-[#111622] via-[#111622]/95 to-transparent sm:static sm:p-0 sm:bg-none sm:mt-8">
        <div className="max-w-sm mx-auto">
          {isHost ? (
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                onNext();
              }}
              className="w-full min-h-[52px] px-6 py-3.5 rounded-xl bg-[#D9A441] hover:bg-[#E4B354] active:scale-[0.98] text-[#1A140E] font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(217,164,65,0.28)] transition-all cursor-pointer"
            >
              {isLastRound ? <Trophy size={18} /> : null}
              <span>
                {isLastRound ? copy.actions.finalResults : copy.actions.nextRound}
              </span>
              {!isLastRound ? <ArrowRight size={18} /> : null}
            </button>
          ) : (
            <div className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#1B2233] border border-[#2B354D] text-center text-sm text-[#A9B2C7]">
              {isLastRound
                ? copy.scoreboard.waitingHostFinal
                : copy.scoreboard.waitingHostNext}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
