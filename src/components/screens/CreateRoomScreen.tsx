import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Globe, Layers, Users } from 'lucide-react';
import type { AppCopy } from '../../i18n';
import {
  AVATAR_OPTIONS,
  DEFAULT_ROOM_SETTINGS,
  ESSENTIAL_ROLES,
  EXTRA_ROLES,
  ExtraRole,
  Language,
  RoleId,
  RoomSettings,
} from '../../shared/types';
import { ROLE_THEMES } from '../ui/RoleVisuals';
import { Spinner } from '../ui/TableLoader';
import { sound } from '../../utils/sound';

interface CreateRoomScreenProps {
  copy: AppCopy;
  language: Language;
  isCreating?: boolean;
  onLanguageChange: (lang: Language) => void;
  onBack: () => void;
  onCreate: (playerName: string, avatar: string, color: string, settings: RoomSettings) => void;
}

const PLAYER_COUNTS = [4, 5, 6, 7, 8, 9, 10];
const ROUND_COUNTS = [1, 2, 3, 5, 10];

export const CreateRoomScreen: React.FC<CreateRoomScreenProps> = ({
  copy,
  language,
  isCreating = false,
  onLanguageChange,
  onBack,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState(0);
  const [settings, setSettings] = useState<RoomSettings>(() => ({
    ...DEFAULT_ROOM_SETTINGS,
    language,
    roleValues: { ...DEFAULT_ROOM_SETTINGS.roleValues },
    enabledExtraRoles: [...DEFAULT_ROOM_SETTINGS.enabledExtraRoles],
  }));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const selectedAvatar = AVATAR_OPTIONS[selectedAvatarIdx];

  const handleLanguageSelect = (lang: Language) => {
    sound.playTap();
    setSettings((prev) => ({ ...prev, language: lang }));
    onLanguageChange(lang);
  };

  const handleRoleValueChange = (role: RoleId, raw: string) => {
    const parsed = raw === '' ? 0 : Math.max(0, Math.min(99999, parseInt(raw, 10) || 0));
    setSettings((prev) => ({
      ...prev,
      roleValues: {
        ...prev.roleValues,
        [role]: parsed,
      },
    }));
  };

  const toggleExtraRole = (role: ExtraRole) => {
    sound.playTap();
    setSettings((prev) => {
      const exists = prev.enabledExtraRoles.includes(role);
      const next = exists
        ? prev.enabledExtraRoles.filter((r) => r !== role)
        : [...prev.enabledExtraRoles, role];
      return {
        ...prev,
        enabledExtraRoles: next.length > 0 ? next : [role],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setLocalError(copy.errors.INVALID_NAME);
      return;
    }
    sound.playTap();
    onCreate(clean, selectedAvatar.emoji, selectedAvatar.color, {
      ...settings,
      language,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 pb-28">
      <button
        type="button"
        onClick={() => {
          sound.playTap();
          onBack();
        }}
        className="inline-flex items-center gap-2 min-h-[44px] px-2 -ml-2 text-sm font-medium text-[#D0C8B8] hover:text-[#F6EFE0] transition-colors cursor-pointer"
      >
        <ArrowLeft size={18} />
        <span>{copy.actions.back}</span>
      </button>

      <h1 className="font-display font-bold text-3xl text-[#F6EFE0] mt-2 mb-6">
        {copy.setup.title}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 lg:grid lg:grid-cols-12 lg:gap-7 lg:space-y-0">
        {/* Left Column: Language, Identity & Core Counts */}
        <div className="lg:col-span-6 space-y-6">
          {/* Language Selector (Only English & Malayalam) */}
          <section className="bg-[#1B2233] border border-[#2B354D] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#F6EFE0] flex items-center gap-2">
                <Globe size={16} className="text-[#D9A441]" />
                <span>{copy.languageLabel}</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {(['en', 'ml'] as Language[]).map((lang) => {
                const active = language === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageSelect(lang)}
                    aria-pressed={active}
                    className={`min-h-[48px] px-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                      active
                        ? 'bg-[#D9A441] text-[#1A140E] shadow-sm'
                        : 'bg-[#111622] text-[#D0C8B8] border border-[#2B354D] hover:border-[#495778]'
                    }`}
                  >
                    {copy.languageNames[lang]}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Host Name & Avatar */}
          <section className="bg-[#1B2233] border border-[#2B354D] rounded-2xl p-5">
            <label htmlFor="host-name" className="block text-sm font-semibold text-[#F6EFE0] mb-2">
              {copy.setup.yourNameLabel}
            </label>
            <input
              id="host-name"
              type="text"
              maxLength={20}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (localError) setLocalError(null);
              }}
              placeholder={copy.setup.yourNamePlaceholder}
              className="w-full min-h-[48px] px-4 rounded-xl bg-[#111622] border border-[#34405C] focus:border-[#D9A441] focus:outline-none text-[#F6EFE0] placeholder-[#7B8499] text-base"
            />
            {localError && (
              <p role="alert" className="mt-2 text-sm text-[#E57373]">
                {localError}
              </p>
            )}

            <div className="mt-4">
              <span className="block text-xs font-medium text-[#A9B2C7] mb-2.5">
                {copy.setup.pickAvatar}
              </span>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_OPTIONS.map((opt, idx) => {
                  const active = idx === selectedAvatarIdx;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setSelectedAvatarIdx(idx);
                      }}
                      aria-label={`Select ${opt.label} avatar`}
                      aria-pressed={active}
                      className={`min-h-[46px] rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                        active
                          ? 'bg-[#D9A441]/20 ring-2 ring-[#D9A441] scale-105'
                          : 'bg-[#111622] border border-[#2B354D] hover:border-[#495778]'
                      }`}
                    >
                      {opt.emoji}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Max Players & Rounds */}
          <section className="bg-[#1B2233] border border-[#2B354D] rounded-2xl p-5 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-semibold text-[#F6EFE0] flex items-center gap-2">
                  <Users size={16} className="text-[#D9A441]" />
                  {copy.setup.maxPlayers}
                </span>
                <span className="font-mono-code text-sm font-bold text-[#D9A441]">
                  {settings.maxPlayers}
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {PLAYER_COUNTS.map((count) => {
                  const active = settings.maxPlayers === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setSettings((prev) => ({
                          ...prev,
                          maxPlayers: count,
                          minPlayers: Math.min(prev.minPlayers, count),
                        }));
                      }}
                      className={`min-h-[44px] rounded-lg font-mono-code font-bold text-sm transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#D9A441] text-[#1A140E]'
                          : 'bg-[#111622] text-[#D0C8B8] border border-[#2B354D] hover:border-[#495778]'
                      }`}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[#2B354D]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#F6EFE0] flex items-center gap-2">
                  <Layers size={16} className="text-[#D9A441]" />
                  {copy.setup.rounds}
                </span>
                <span className="font-mono-code text-sm font-bold text-[#D9A441]">
                  {settings.totalRounds}
                </span>
              </div>
              <p className="text-xs text-[#9FA8BD] mb-3 leading-relaxed">
                {copy.setup.roundsHelp}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {ROUND_COUNTS.map((r) => {
                  const active = settings.totalRounds === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setSettings((prev) => ({ ...prev, totalRounds: r }));
                      }}
                      className={`min-h-[44px] rounded-lg font-mono-code font-bold text-sm transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#D9A441] text-[#1A140E]'
                          : 'bg-[#111622] text-[#D0C8B8] border border-[#2B354D] hover:border-[#495778]'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Role Points + Optional Settings */}
        <div className="lg:col-span-6 space-y-6">
          <section className="bg-[#1B2233] border border-[#2B354D] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-[#F6EFE0] mb-1">
              {copy.setup.rolePoints}
            </h2>
            <p className="text-xs text-[#9FA8BD] mb-4">{copy.setup.essentialRoles}</p>

            <div className="grid grid-cols-2 gap-3">
              {ESSENTIAL_ROLES.map((role) => (
                <div
                  key={role}
                  className="bg-[#111622] border border-[#2B354D] rounded-xl p-3 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span aria-hidden="true">{ROLE_THEMES[role].emoji}</span>
                    <span className="text-sm font-medium text-[#F6EFE0] truncate">
                      {copy.roles[role].title}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={99999}
                    step={50}
                    aria-label={`${copy.roles[role].title} points`}
                    value={settings.roleValues[role]}
                    onChange={(e) => handleRoleValueChange(role, e.target.value)}
                    className="w-20 min-h-[38px] px-2.5 rounded-lg bg-[#1B2233] border border-[#34405C] focus:border-[#D9A441] focus:outline-none text-right font-mono-code text-sm text-[#F6EFE0]"
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-[#2B354D]">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="w-full min-h-[44px] flex items-center justify-between text-sm font-semibold text-[#D0C8B8] hover:text-[#F6EFE0] cursor-pointer"
              >
                <span>{copy.setup.extraRolesSection}</span>
                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <label className="flex items-center justify-between min-h-[44px] gap-3 cursor-pointer">
                    <span className="text-sm text-[#D0C8B8]">{copy.setup.extraRolesToggle}</span>
                    <input
                      type="checkbox"
                      checked={settings.enableExtraRoles}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, enableExtraRoles: e.target.checked }))
                      }
                      className="w-5 h-5 accent-[#D9A441] rounded cursor-pointer"
                    />
                  </label>

                  {settings.enableExtraRoles && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {EXTRA_ROLES.map((role) => {
                        const enabled = settings.enabledExtraRoles.includes(role);
                        return (
                          <div
                            key={role}
                            className={`rounded-xl p-2.5 border flex items-center justify-between gap-2 transition-opacity ${
                              enabled
                                ? 'bg-[#111622] border-[#2B354D]'
                                : 'bg-[#111622]/40 border-[#232B3E] opacity-55'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleExtraRole(role)}
                              className="flex items-center gap-2 min-h-[36px] text-left cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={enabled}
                                readOnly
                                className="w-4 h-4 accent-[#D9A441] pointer-events-none"
                              />
                              <span className="text-sm text-[#F6EFE0]">
                                {copy.roles[role].title}
                              </span>
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={99999}
                              step={50}
                              disabled={!enabled}
                              aria-label={`${copy.roles[role].title} points`}
                              value={settings.roleValues[role]}
                              onChange={(e) => handleRoleValueChange(role, e.target.value)}
                              className="w-20 min-h-[36px] px-2 rounded-lg bg-[#1B2233] border border-[#34405C] focus:border-[#D9A441] focus:outline-none text-right font-mono-code text-xs text-[#F6EFE0]"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#2B354D] space-y-3">
                    <label className="flex items-center justify-between min-h-[44px] gap-3 cursor-pointer">
                      <span className="text-sm text-[#D0C8B8]">{copy.setup.allowEarlyStart}</span>
                      <input
                        type="checkbox"
                        checked={settings.allowEarlyStart}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, allowEarlyStart: e.target.checked }))
                        }
                        className="w-5 h-5 accent-[#D9A441] cursor-pointer"
                      />
                    </label>

                    {settings.allowEarlyStart && (
                      <div className="flex items-center justify-between min-h-[44px] gap-3">
                        <span className="text-sm text-[#D0C8B8]">{copy.setup.minPlayers}</span>
                        <div className="flex items-center gap-1.5">
                          {[4, 5, 6]
                            .filter((n) => n <= settings.maxPlayers)
                            .map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() =>
                                  setSettings((prev) => ({ ...prev, minPlayers: n }))
                                }
                                className={`w-10 h-9 rounded-lg font-mono-code text-xs font-bold cursor-pointer ${
                                  settings.minPlayers === n
                                    ? 'bg-[#D9A441] text-[#1A140E]'
                                    : 'bg-[#111622] text-[#D0C8B8] border border-[#2B354D]'
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    <label className="flex items-center justify-between min-h-[44px] gap-3 cursor-pointer">
                      <span className="text-sm text-[#D0C8B8]">{copy.setup.showAvatars}</span>
                      <input
                        type="checkbox"
                        checked={settings.showAvatars}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, showAvatars: e.target.checked }))
                        }
                        className="w-5 h-5 accent-[#D9A441] cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between min-h-[44px] gap-3 cursor-pointer">
                      <span className="text-sm text-[#D0C8B8]">{copy.setup.soundEffects}</span>
                      <input
                        type="checkbox"
                        checked={settings.soundEnabled}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, soundEnabled: e.target.checked }))
                        }
                        className="w-5 h-5 accent-[#D9A441] cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between min-h-[44px] gap-3 cursor-pointer">
                      <span className="text-sm text-[#D0C8B8]">{copy.setup.animations}</span>
                      <input
                        type="checkbox"
                        checked={settings.animationsEnabled}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, animationsEnabled: e.target.checked }))
                        }
                        className="w-5 h-5 accent-[#D9A441] cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-[#111622] via-[#111622]/95 to-transparent lg:static lg:col-span-12 lg:p-0 lg:bg-none lg:mt-4">
          <div className="max-w-md mx-auto lg:max-w-xs lg:ml-auto lg:mr-0">
            <button
              type="submit"
              disabled={isCreating}
              className="w-full min-h-[52px] px-6 py-3.5 rounded-xl bg-[#D9A441] hover:bg-[#E4B354] disabled:opacity-75 active:scale-[0.98] text-[#1A140E] font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_10px_28px_rgba(217,164,65,0.28)] transition-all whitespace-nowrap cursor-pointer disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6EFE0]"
            >
              {isCreating && <Spinner size={18} />}
              <span>{isCreating ? copy.loading.openingRoom : copy.setup.createRoomCta}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
