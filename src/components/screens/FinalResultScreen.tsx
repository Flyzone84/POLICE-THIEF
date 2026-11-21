import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Home, RotateCcw, Trophy } from 'lucide-react';
import type { AppCopy } from '../../i18n';
import { ClientGameState } from '../../shared/types';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import { ConfettiPopper } from '../ui/ConfettiPopper';
import { sound } from '../../utils/sound';

interface FinalResultScreenProps {
  copy: AppCopy;
  state: ClientGameState;
  onPlayAgain: () => void;
  onReturnHome: () => void;
}

export const FinalResultScreen: React.FC<FinalResultScreenProps> = ({
  copy,
  state,
  onPlayAgain,
  onReturnHome,
}) => {
  const leaderboard = state.finalLeaderboard || [];
  const winner = leaderboard[0];
  const podium = leaderboard.slice(0, 3);
  const me = state.players.find((p) => p.id === state.myPlayerId);
  const isHost = Boolean(me?.isHost);

  useEffect(() => {
    sound.playVictory();
  }, []);

  if (!winner) return null;

  const podiumOrder = podium.length >= 3 ? [podium[1], podium[0], podium[2]] : podium;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 pb-16 relative">
      <ConfettiPopper active={state.settings.animationsEnabled} variant="celebration" />

      <motion.section
        initial={state.settings.animationsEnabled ? { opacity: 0, y: 14 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="paper-card rounded-3xl p-6 sm:p-8 text-center mb-8"
      >
        <p className="font-mono-code text-xs font-bold tracking-[0.2em] uppercase text-[#8C5E14]">
          {copy.final.gameOver} · {copy.final.roundsCount(state.settings.totalRounds)}
        </p>

        <div className="mt-4 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-[#D9A441] text-[#1A140E] flex items-center justify-center shadow-lg">
            <Trophy size={32} strokeWidth={2.2} />
          </div>
        </div>

        <p className="mt-3 text-xs font-bold tracking-[0.18em] uppercase text-[#6B5B4A]">
          {copy.final.winnerLabel}
        </p>

        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-[#1F1B18] mt-1">
          {winner.name}
        </h1>

        <div className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-[#1F1B18] text-[#F6EFE0]">
          <span className="text-[11px] uppercase tracking-wider text-[#D9A441] block">
            {copy.final.totalScoreLabel}
          </span>
          <span className="font-mono-code font-bold text-2xl sm:text-3xl tabular-nums">
            {winner.totalScore}
          </span>
        </div>
      </motion.section>

      {podium.length >= 2 && (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 items-end mb-8">
          {podiumOrder.map((entry) => {
            const heightClass =
              entry.rank === 1
                ? 'min-h-[136px] bg-[#242D44] border-[#D9A441]/60'
                : entry.rank === 2
                ? 'min-h-[112px] bg-[#1B2233] border-[#34405C]'
                : 'min-h-[96px] bg-[#171D2C] border-[#2B354D]';
            const medal = entry.rank === 1 ? '🏆' : entry.rank === 2 ? '🥈' : '🥉';
            return (
              <div
                key={entry.playerId}
                className={`rounded-2xl border p-3 sm:p-4 flex flex-col items-center justify-center text-center ${heightClass}`}
              >
                <span className="text-xl mb-1">{medal}</span>
                <PlayerAvatar
                  name={entry.name}
                  avatar={entry.avatar}
                  color={entry.color}
                  showAvatar={state.settings.showAvatars}
                  size="sm"
                />
                <span className="font-semibold text-xs sm:text-sm text-[#F6EFE0] truncate max-w-full mt-2">
                  {entry.name}
                </span>
                <span className="font-mono-code text-xs font-bold text-[#D9A441] mt-0.5 tabular-nums">
                  {entry.totalScore}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-[#1B2233] border border-[#2B354D] rounded-2xl overflow-hidden mb-8">
        <div className="px-5 py-3.5 border-b border-[#2B354D] flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-[#F6EFE0]">
            {copy.final.standingsTitle}
          </h2>
          <span className="text-xs text-[#9FA8BD]">{copy.final.roomLabel(state.roomCode)}</span>
        </div>

        <div className="divide-y divide-[#252E44]">
          {leaderboard.map((entry) => (
            <div
              key={entry.playerId}
              className="px-5 py-3.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono-code font-bold text-sm text-[#D9A441] w-5 shrink-0">
                  {entry.rank}.
                </span>
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
                    {entry.playerId === state.myPlayerId ? ` ${copy.lobby.youTag}` : ''}
                  </div>
                  <div className="text-xs text-[#9FA8BD]">
                    {entry.roundsWonAsKing > 0
                      ? copy.final.kingCount(entry.roundsWonAsKing)
                      : copy.final.playerTag}
                    {entry.thiefCatches > 0 ? ` · ${copy.final.catchCount(entry.thiefCatches)}` : ''}
                    {entry.thiefEscapes > 0 ? ` · ${copy.final.escapeCount(entry.thiefEscapes)}` : ''}
                  </div>
                </div>
              </div>

              <span className="font-mono-code font-bold text-base text-[#F6EFE0] tabular-nums shrink-0">
                {entry.totalScore}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        {isHost ? (
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onPlayAgain();
            }}
            className="flex-1 min-h-[52px] px-6 py-3.5 rounded-xl bg-[#D9A441] hover:bg-[#E4B354] active:scale-[0.98] text-[#1A140E] font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(217,164,65,0.28)] cursor-pointer whitespace-nowrap"
          >
            <RotateCcw size={18} />
            <span>{copy.actions.playAgain}</span>
          </button>
        ) : (
          <div className="flex-1 min-h-[52px] px-4 py-3 rounded-xl bg-[#1B2233] border border-[#2B354D] flex items-center justify-center text-xs sm:text-sm text-[#A9B2C7] text-center">
            {copy.final.waitingHostReplay}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            sound.playTap();
            onReturnHome();
          }}
          className="flex-1 min-h-[52px] px-6 py-3.5 rounded-xl bg-[#222A3D] hover:bg-[#2A344B] border border-[#34405C] text-[#F6EFE0] font-bold text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <Home size={18} />
          <span>{copy.actions.returnHome}</span>
        </button>
      </div>
    </div>
  );
};
