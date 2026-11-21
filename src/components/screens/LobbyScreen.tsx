import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Crown, Link2, Play, Settings2, Share2, WifiOff, X } from 'lucide-react';
import type { AppCopy } from '../../i18n';
import { ClientGameState, ESSENTIAL_ROLES, Language, RoomSettings } from '../../shared/types';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import { Spinner } from '../ui/TableLoader';
import { sound } from '../../utils/sound';

interface LobbyScreenProps {
  copy: AppCopy;
  state: ClientGameState;
  isStarting?: boolean;
  onStartGame: () => void;
  onUpdateSettings: (settings: RoomSettings) => void;
  onShowNotice: (msg: string) => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  copy,
  state,
  isStarting = false,
  onStartGame,
  onUpdateSettings,
  onShowNotice,
}) => {
  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  const me = state.players.find((p) => p.id === state.myPlayerId);
  const isHost = Boolean(me?.isHost);
  const shareUrl = `${window.location.origin}/?room=${state.roomCode}`;

  const requiredMin = state.settings.allowEarlyStart
    ? Math.max(4, state.settings.minPlayers)
    : state.settings.maxPlayers;
  const canStart = state.players.length >= 4 && state.players.length >= requiredMin;

  const copyText = async (text: string, type: 'code' | 'link') => {
    sound.playTap();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 1800);
    } catch {
      onShowNotice(text);
    }
  };

  const handleShare = async () => {
    sound.playTap();
    if (navigator.share) {
      try {
        await navigator.share({
          title: copy.appName,
          text: copy.lobby.shareText(state.roomCode),
          url: shareUrl,
        });
        return;
      } catch {
        // User dismissed share or unsupported; fall through to copy
      }
    }
    copyText(shareUrl, 'link');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 pb-32 lg:pb-12">
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
        {/* Left Column: Room Code & Share */}
        <div className="lg:col-span-5 space-y-4">
          <div className="paper-card rounded-2xl p-6 text-center">
            <span className="text-xs font-semibold tracking-[0.16em] uppercase text-[#6B5B4A]">
              {copy.lobby.roomCodeLabel}
            </span>
            <div className="font-mono-code font-bold text-4xl sm:text-5xl tracking-[0.22em] text-[#1F1B18] my-2 select-all">
              {state.roomCode}
            </div>

            <div className="text-xs text-[#6B5B4A] font-medium flex items-center justify-center gap-2 mb-5">
              <span>{copy.lobby.joinedSummary(state.players.length, state.settings.maxPlayers)}</span>
              <span aria-hidden="true">·</span>
              <span>{copy.lobby.roundInfo(state.settings.totalRounds)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => copyText(state.roomCode, 'code')}
                className="min-h-[44px] px-2 rounded-xl bg-[#1F1B18] hover:bg-[#322B26] text-[#F6EFE0] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                {copiedType === 'code' ? <Check size={14} /> : <Copy size={14} />}
                <span className="truncate">
                  {copiedType === 'code' ? copy.actions.copied : copy.actions.copyCode}
                </span>
              </button>

              <button
                type="button"
                onClick={() => copyText(shareUrl, 'link')}
                className="min-h-[44px] px-2 rounded-xl bg-[#E3D5BA] hover:bg-[#D9C7A6] text-[#1F1B18] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                {copiedType === 'link' ? <Check size={14} /> : <Link2 size={14} />}
                <span className="truncate">
                  {copiedType === 'link' ? copy.actions.copied : copy.actions.copyLink}
                </span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="min-h-[44px] px-2 rounded-xl bg-[#D9A441] hover:bg-[#E4B354] text-[#1A140E] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Share2 size={14} />
                <span className="truncate">{copy.actions.share}</span>
              </button>
            </div>
          </div>

          <div className="bg-[#1B2233] border border-[#2B354D] rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <motion.div
                animate={
                  state.settings.animationsEnabled
                    ? { rotate: [-4, 4, -4], y: [0, -2, 0] }
                    : undefined
                }
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                className="w-10 h-10 rounded-lg folded-chit flex items-center justify-center shrink-0 text-sm font-display font-bold"
                aria-hidden="true"
              >
                ?
              </motion.div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#F6EFE0] truncate">
                  {canStart ? copy.lobby.tableReady : copy.lobby.waitingPlayers}
                </p>
                <p className="text-xs text-[#9FA8BD]">
                  {copy.lobby.minPlayersHint(Math.max(4, requiredMin))}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setShowRulesModal(true);
              }}
              className="min-h-[44px] px-3.5 rounded-xl bg-[#242D42] hover:bg-[#2E3954] text-xs font-semibold text-[#F6EFE0] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Settings2 size={15} />
              <span>{copy.lobby.editSettings}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Players List */}
        <div className="lg:col-span-7 mt-6 lg:mt-0">
          <div className="flex items-baseline justify-between mb-3 px-1">
            <h2 className="font-display font-bold text-xl text-[#F6EFE0]">
              {copy.lobby.playersLabel}
            </h2>
            <span className="font-mono-code text-sm font-bold text-[#D9A441]">
              {state.players.length} / {state.settings.maxPlayers}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {state.players.map((p, index) => (
              <motion.div
                key={p.id}
                initial={state.settings.animationsEnabled ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className={`rounded-xl p-3.5 border flex items-center justify-between gap-3 ${
                  p.id === state.myPlayerId
                    ? 'bg-[#222B40] border-[#D9A441]/45'
                    : 'bg-[#1B2233] border-[#2B354D]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PlayerAvatar
                    name={p.name}
                    avatar={p.avatar}
                    color={p.color}
                    showAvatar={state.settings.showAvatars}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-[#F6EFE0] truncate">
                        {p.name}
                      </span>
                      {p.id === state.myPlayerId && (
                        <span className="text-xs text-[#9FA8BD]">{copy.lobby.youTag}</span>
                      )}
                    </div>
                    <div className="text-xs text-[#9FA8BD] flex items-center gap-1.5 mt-0.5">
                      {!p.connected ? (
                        <span className="text-[#E59866] inline-flex items-center gap-1">
                          <WifiOff size={12} />
                          {copy.lobby.reconnectingStatus}
                        </span>
                      ) : p.isHost ? (
                        <span className="text-[#D9A441] font-semibold inline-flex items-center gap-1">
                          <Crown size={12} />
                          {copy.lobby.hostBadge}
                        </span>
                      ) : (
                        <span>{copy.lobby.readyStatus}</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {Array.from({ length: Math.max(0, state.settings.maxPlayers - state.players.length) }).map(
              (_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="rounded-xl p-3.5 border border-dashed border-[#2C364E] bg-[#141A28]/60 flex items-center gap-3 text-[#6E7891]"
                >
                  <div className="w-11 h-11 rounded-full border border-dashed border-[#34405C] flex items-center justify-center text-sm">
                    ?
                  </div>
                  <span className="text-sm">{copy.lobby.waitingPlayers}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Area */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-[#111622] via-[#111622]/95 to-transparent lg:static lg:p-0 lg:bg-none lg:mt-8">
        <div className="max-w-md mx-auto">
          {isHost ? (
            <button
              type="button"
              disabled={!canStart || isStarting}
              onClick={() => {
                sound.playTap();
                onStartGame();
              }}
              className="w-full min-h-[54px] px-6 py-3.5 rounded-xl bg-[#D9A441] hover:bg-[#E4B354] disabled:bg-[#2C3447] disabled:text-[#848EA3] active:scale-[0.98] text-[#1A140E] font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_10px_28px_rgba(217,164,65,0.25)] disabled:shadow-none transition-all whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
            >
              {isStarting ? <Spinner size={18} /> : <Play size={18} fill="currentColor" />}
              <span>
                {isStarting
                  ? copy.loading.startingGame
                  : !canStart
                  ? copy.lobby.needMorePlayers(state.players.length, Math.max(4, requiredMin))
                  : state.players.length < state.settings.maxPlayers
                  ? copy.lobby.startWithCount(state.players.length)
                  : copy.actions.startGame}
              </span>
            </button>
          ) : (
            <div className="w-full min-h-[52px] px-5 py-3 rounded-xl bg-[#1B2233] border border-[#2B354D] text-center flex items-center justify-center text-sm font-medium text-[#D0C8B8]">
              {copy.lobby.waitingHost}
            </div>
          )}
        </div>
      </div>

      {/* Table Rules Modal */}
      {showRulesModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={copy.lobby.editSettings}
        >
          <div className="w-full max-w-md bg-[#1B2233] border border-[#2F3A56] rounded-t-3xl sm:rounded-2xl p-6 max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-xl text-[#F6EFE0]">
                {copy.lobby.editSettings}
              </h3>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#A9B2C7] hover:text-[#F6EFE0] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-[#2B354D]">
                <span className="text-[#A9B2C7]">{copy.languageLabel}</span>
                {isHost ? (
                  <div className="flex gap-1.5">
                    {(['en', 'ml'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => onUpdateSettings({ ...state.settings, language: lang })}
                        className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer ${
                          state.settings.language === lang
                            ? 'bg-[#D9A441] text-[#1A140E]'
                            : 'bg-[#111622] text-[#D0C8B8]'
                        }`}
                      >
                        {copy.languageNames[lang]}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="font-semibold text-[#F6EFE0]">
                    {copy.languageNames[state.settings.language]}
                  </span>
                )}
              </div>

              <div className="flex justify-between py-2 border-b border-[#2B354D]">
                <span className="text-[#A9B2C7]">{copy.lobby.playersSetting}</span>
                <span className="font-mono-code font-bold text-[#F6EFE0]">
                  {state.settings.minPlayers}–{state.settings.maxPlayers}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-[#2B354D]">
                <span className="text-[#A9B2C7]">{copy.lobby.roundsSetting}</span>
                {isHost ? (
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 5, 10].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => onUpdateSettings({ ...state.settings, totalRounds: r })}
                        className={`px-2.5 py-1 rounded-md font-mono-code text-xs font-bold cursor-pointer ${
                          state.settings.totalRounds === r
                            ? 'bg-[#D9A441] text-[#1A140E]'
                            : 'bg-[#111622] text-[#D0C8B8]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="font-mono-code font-bold text-[#F6EFE0]">
                    {state.settings.totalRounds}
                  </span>
                )}
              </div>

              <div>
                <span className="block text-[#A9B2C7] mb-2">{copy.lobby.roleValuesSetting}</span>
                <div className="grid grid-cols-2 gap-2">
                  {ESSENTIAL_ROLES.map((role) => (
                    <div
                      key={role}
                      className="bg-[#111622] rounded-lg px-3 py-2 flex items-center justify-between"
                    >
                      <span className="text-[#F6EFE0]">{copy.roles[role].title}</span>
                      <span className="font-mono-code font-bold text-[#D9A441]">
                        {state.settings.roleValues[role]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {isHost && (
                <label className="flex items-center justify-between min-h-[44px] pt-2 cursor-pointer">
                  <span className="text-[#D0C8B8]">{copy.setup.allowEarlyStart}</span>
                  <input
                    type="checkbox"
                    checked={state.settings.allowEarlyStart}
                    onChange={(e) =>
                      onUpdateSettings({ ...state.settings, allowEarlyStart: e.target.checked })
                    }
                    className="w-5 h-5 accent-[#D9A441] cursor-pointer"
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
