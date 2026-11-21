import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { AppCopy } from '../../i18n';
import { AVATAR_OPTIONS, GameErrorCode } from '../../shared/types';
import { Spinner } from '../ui/TableLoader';
import { sound } from '../../utils/sound';

interface JoinRoomScreenProps {
  copy: AppCopy;
  initialRoomCode?: string;
  isJoining?: boolean;
  onBack: () => void;
  onJoin: (roomCode: string, playerName: string, avatar: string, color: string) => void;
}

export const JoinRoomScreen: React.FC<JoinRoomScreenProps> = ({
  copy,
  initialRoomCode = '',
  isJoining = false,
  onBack,
  onJoin,
}) => {
  const [step, setStep] = useState<'CODE' | 'NAME'>(initialRoomCode ? 'NAME' : 'CODE');
  const [code, setCode] = useState(initialRoomCode.toUpperCase());
  const [name, setName] = useState('');
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState(2);
  const [showAvatars, setShowAvatars] = useState(true);
  const [hostName, setHostName] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const selectedAvatar = AVATAR_OPTIONS[selectedAvatarIdx];

  const verifyRoomCode = async (targetCode: string) => {
    const clean = targetCode.trim().toUpperCase();
    if (clean.length < 4) {
      setLocalError(copy.errors.INVALID_CODE);
      return;
    }

    setChecking(true);
    setLocalError(null);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const errCode = (data.code as GameErrorCode) || 'ROOM_NOT_FOUND';
        setLocalError(copy.errors[errCode] || copy.errors.ROOM_NOT_FOUND);
        setStep('CODE');
        return;
      }
      setCode(data.roomCode);
      setHostName(data.hostName || null);
      setShowAvatars(data.showAvatars !== false);
      setStep('NAME');
    } catch {
      setLocalError(copy.connection.networkError);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (initialRoomCode) {
      verifyRoomCode(initialRoomCode);
    }
  }, [initialRoomCode]);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playTap();
    verifyRoomCode(code);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setLocalError(copy.errors.INVALID_NAME);
      return;
    }
    sound.playTap();
    onJoin(code, clean, selectedAvatar.emoji, selectedAvatar.color);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 min-h-[calc(100dvh-72px)] flex flex-col">
      <button
        type="button"
        onClick={() => {
          sound.playTap();
          if (step === 'NAME' && !initialRoomCode) {
            setStep('CODE');
            setLocalError(null);
          } else {
            onBack();
          }
        }}
        className="inline-flex items-center gap-2 min-h-[44px] px-2 -ml-2 text-sm font-medium text-[#D0C8B8] hover:text-[#F6EFE0] self-start cursor-pointer"
      >
        <ArrowLeft size={18} />
        <span>{copy.actions.back}</span>
      </button>

      <div className="my-auto py-6">
        {step === 'CODE' ? (
          <form
            onSubmit={handleCodeSubmit}
            className="bg-[#1B2233] border border-[#2B354D] rounded-2xl p-6 sm:p-7 shadow-xl"
          >
            <h1 className="font-display font-bold text-2xl text-[#F6EFE0] text-center mb-2">
              {copy.join.codeTitle}
            </h1>
            <p className="text-sm text-[#A9B2C7] text-center mb-6">{copy.join.codeHelp}</p>

            <input
              type="text"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                if (localError) setLocalError(null);
              }}
              placeholder={copy.join.codePlaceholder}
              aria-label={copy.join.codeTitle}
              className="w-full min-h-[60px] px-4 rounded-xl bg-[#111622] border border-[#34405C] focus:border-[#D9A441] focus:outline-none text-center font-mono-code font-bold text-2xl tracking-[0.28em] text-[#F6EFE0] placeholder-[#4B556B]"
            />

            {localError && (
              <p role="alert" className="mt-3 text-sm text-[#E57373] text-center">
                {localError}
              </p>
            )}

            <button
              type="submit"
              disabled={checking}
              className="w-full mt-6 min-h-[52px] px-6 py-3.5 rounded-xl bg-[#D9A441] hover:bg-[#E4B354] disabled:opacity-75 active:scale-[0.98] text-[#1A140E] font-bold text-base tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-wait"
            >
              {checking && <Spinner size={18} />}
              <span>{checking ? copy.join.checkingRoom : copy.actions.joinGame}</span>
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleNameSubmit}
            className="bg-[#1B2233] border border-[#2B354D] rounded-2xl p-6 sm:p-7 shadow-xl"
          >
            <div className="text-center text-xs text-[#D9A441] font-medium mb-2">
              <span>{copy.join.roomLabel} </span>
              <span className="font-mono-code font-bold">{code}</span>
              {hostName && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span>{copy.join.hostedBy(hostName)}</span>
                </>
              )}
            </div>

            <h1 className="font-display font-bold text-2xl text-[#F6EFE0] text-center mb-6">
              {copy.join.nameTitle}
            </h1>

            <input
              type="text"
              maxLength={20}
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (localError) setLocalError(null);
              }}
              placeholder={copy.join.namePlaceholder}
              aria-label={copy.join.namePlaceholder}
              className="w-full min-h-[52px] px-4 rounded-xl bg-[#111622] border border-[#34405C] focus:border-[#D9A441] focus:outline-none text-center text-lg font-medium text-[#F6EFE0] placeholder-[#68738A]"
            />

            {showAvatars && (
              <div className="mt-5">
                <span className="block text-xs font-medium text-[#A9B2C7] text-center mb-2.5">
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
                        aria-label={`Choose ${opt.label} avatar`}
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
            )}

            {localError && (
              <p role="alert" className="mt-3 text-sm text-[#E57373] text-center">
                {localError}
              </p>
            )}

            <button
              type="submit"
              disabled={isJoining}
              className="w-full mt-6 min-h-[52px] px-6 py-3.5 rounded-xl bg-[#D9A441] hover:bg-[#E4B354] disabled:opacity-75 active:scale-[0.98] text-[#1A140E] font-bold text-base tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-wait"
            >
              {isJoining && <Spinner size={18} />}
              <span>{isJoining ? copy.loading.joiningRoom : copy.actions.continue}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
