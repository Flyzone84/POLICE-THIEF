import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, LogOut, WifiOff, AlertCircle } from 'lucide-react';
import { getCopy } from './i18n';
import type { Language } from './shared/types';
import { useGameSocket } from './hooks/useGameSocket';
import { HomeScreen } from './components/screens/HomeScreen';
import { CreateRoomScreen } from './components/screens/CreateRoomScreen';
import { JoinRoomScreen } from './components/screens/JoinRoomScreen';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { RoundIntroScreen } from './components/screens/RoundIntroScreen';
import { SlotSelectionScreen } from './components/screens/SlotSelectionScreen';
import { RoleRevealScreen } from './components/screens/RoleRevealScreen';
import { PoliceInvestigationScreen } from './components/screens/PoliceInvestigationScreen';
import { GuessResultScreen } from './components/screens/GuessResultScreen';
import { ScoreboardScreen } from './components/screens/ScoreboardScreen';
import { FinalResultScreen } from './components/screens/FinalResultScreen';
import { TableLoader } from './components/ui/TableLoader';

type PreGameRoute = 'HOME' | 'CREATE' | 'JOIN';

export default function App() {
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('pt_lang');
      return saved === 'ml' ? 'ml' : 'en';
    } catch {
      return 'en';
    }
  });

  const handleLanguageChange = (lang: Language) => {
    setPreferredLanguage(lang);
    try {
      localStorage.setItem('pt_lang', lang);
    } catch {
      // ignore
    }
  };

  const {
    gameState,
    connectionStatus,
    pendingAction,
    pendingSlotIndex,
    isRestoringSession,
    errorMessage,
    noticeMessage,
    localMuted,
    setLocalMuted,
    clearError,
    showNotice,
    createRoom,
    joinRoom,
    updateSettings,
    startGame,
    selectSlot,
    confirmRole,
    forceProceedToHunt,
    submitGuess,
    nextPhase,
    playAgain,
    leaveRoom,
  } = useGameSocket(preferredLanguage);

  const [preGameRoute, setPreGameRoute] = useState<PreGameRoute>('HOME');
  const [urlRoomCode, setUrlRoomCode] = useState<string>('');

  const activeLanguage: Language = gameState?.settings.language || preferredLanguage;
  const copy = getCopy(activeLanguage);

  // Support joining directly via shareable URL: ?room=A7K92
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code && code.trim().length >= 4) {
      setUrlRoomCode(code.trim().toUpperCase());
      setPreGameRoute('JOIN');
    }
  }, []);

  // Sync HTML document title & lang attribute with active language
  useEffect(() => {
    document.documentElement.lang = activeLanguage;
    document.title = `${copy.appName} — ${copy.subtitle}`;
  }, [activeLanguage, copy]);

  const handleReturnHome = () => {
    leaveRoom();
    setPreGameRoute('HOME');
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    setUrlRoomCode('');
  };

  const renderPhase = () => {
    if (!gameState) {
      if (isRestoringSession) {
        return (
          <TableLoader
            title={copy.loading.restoringTitle}
            subtitle={copy.loading.restoringSubtitle}
          />
        );
      }
      if (preGameRoute === 'CREATE') {
        return (
          <CreateRoomScreen
            copy={copy}
            language={preferredLanguage}
            isCreating={pendingAction === 'create_room'}
            onLanguageChange={handleLanguageChange}
            onBack={() => {
              clearError();
              setPreGameRoute('HOME');
            }}
            onCreate={createRoom}
          />
        );
      }
      if (preGameRoute === 'JOIN') {
        return (
          <JoinRoomScreen
            copy={copy}
            initialRoomCode={urlRoomCode}
            isJoining={pendingAction === 'join_room'}
            onBack={() => {
              clearError();
              setUrlRoomCode('');
              setPreGameRoute('HOME');
              if (window.location.search) {
                window.history.replaceState({}, '', window.location.pathname);
              }
            }}
            onJoin={joinRoom}
          />
        );
      }
      return (
        <HomeScreen
          copy={copy}
          onCreateRoom={() => {
            clearError();
            setPreGameRoute('CREATE');
          }}
          onJoinRoom={() => {
            clearError();
            setPreGameRoute('JOIN');
          }}
        />
      );
    }

    switch (gameState.phase) {
      case 'LOBBY':
        return (
          <LobbyScreen
            copy={copy}
            state={gameState}
            isStarting={pendingAction === 'start_game'}
            onStartGame={startGame}
            onUpdateSettings={updateSettings}
            onShowNotice={showNotice}
          />
        );
      case 'ROUND_INTRO':
        return <RoundIntroScreen copy={copy} state={gameState} />;
      case 'SLOT_SELECTION':
        return (
          <SlotSelectionScreen
            copy={copy}
            state={gameState}
            pendingSlotIndex={pendingSlotIndex}
            onSelectSlot={selectSlot}
          />
        );
      case 'ROLE_REVEAL':
        return (
          <RoleRevealScreen
            copy={copy}
            state={gameState}
            isConfirming={pendingAction === 'confirm_role'}
            onConfirmRole={confirmRole}
            onForceProceed={forceProceedToHunt}
          />
        );
      case 'POLICE_INVESTIGATION':
        return (
          <PoliceInvestigationScreen
            copy={copy}
            state={gameState}
            isSubmitting={pendingAction === 'submit_guess'}
            onSubmitGuess={submitGuess}
          />
        );
      case 'GUESS_RESULT':
        return <GuessResultScreen copy={copy} state={gameState} />;
      case 'ROUND_SCOREBOARD':
        return <ScoreboardScreen copy={copy} state={gameState} onNext={nextPhase} />;
      case 'FINAL_RESULT':
        return (
          <FinalResultScreen
            copy={copy}
            state={gameState}
            onPlayAgain={playAgain}
            onReturnHome={handleReturnHome}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-dvh table-canvas text-[#F6EFE0] flex flex-col">
      {/* Compact Sticky Header */}
      <header className="sticky top-0 z-40 h-14 px-4 sm:px-6 bg-[#111622]/90 backdrop-blur-md border-b border-[#242D42] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-display font-extrabold text-base sm:text-lg tracking-tight text-[#F6EFE0] whitespace-nowrap shrink-0 truncate">
            {copy.brandHeader}
          </span>
          {gameState && (
            <span className="text-xs text-[#A9B2C7] whitespace-nowrap hidden sm:inline">
              {copy.join.roomLabel}{' '}
              <span className="font-mono-code font-bold text-[#D9A441]">
                {gameState.roomCode}
              </span>
              {gameState.currentRound > 0 &&
                ` · ${copy.roundIntro.roundOf(
                  gameState.currentRound,
                  gameState.settings.totalRounds
                )}`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!gameState && (
            <div className="flex items-center bg-[#1B2233] border border-[#2B354D] rounded-lg p-0.5 mr-1">
              {(['en', 'ml'] as Language[]).map((lang) => {
                const active = activeLanguage === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageChange(lang)}
                    className={`min-h-[34px] px-2.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#D9A441] text-[#1A140E]'
                        : 'text-[#C5BFA8] hover:text-[#F6EFE0]'
                    }`}
                  >
                    {lang === 'en' ? 'EN' : 'മലയാളം'}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => setLocalMuted((m) => !m)}
            aria-label={localMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center text-[#C5BFA8] hover:text-[#F6EFE0] hover:bg-[#1B2233] transition-colors cursor-pointer"
          >
            {localMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {gameState && (
            <button
              type="button"
              onClick={handleReturnHome}
              aria-label={copy.actions.leaveRoom}
              className="min-h-[44px] px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-[#C5BFA8] hover:text-[#F6EFE0] hover:bg-[#1B2233] transition-colors whitespace-nowrap cursor-pointer"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">{copy.actions.leaveRoom}</span>
            </button>
          )}
        </div>
      </header>

      {/* Reconnecting Banner */}
      {connectionStatus === 'reconnecting' && (
        <div
          role="status"
          className="bg-[#9E5A1E] text-[#FFF8F0] px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2"
        >
          <WifiOff size={14} />
          <span>{copy.connection.reconnecting}</span>
        </div>
      )}

      {/* Friendly Error Toast */}
      {errorMessage && (
        <div className="fixed top-16 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div
            role="alert"
            className="pointer-events-auto max-w-md w-full bg-[#3A1B1E] border border-[#B83B3B] text-[#FCE8E8] rounded-xl px-4 py-3 shadow-2xl flex items-start gap-2.5 text-sm"
          >
            <AlertCircle size={18} className="text-[#E57373] shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
            <button
              type="button"
              onClick={clearError}
              className="text-xs font-bold text-[#F29C9C] hover:text-white px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Notice Toast */}
      {noticeMessage && !errorMessage && (
        <div className="fixed top-16 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div
            role="status"
            className="max-w-md bg-[#222B40] border border-[#D9A441]/50 text-[#F6EFE0] rounded-xl px-4 py-2.5 shadow-xl text-sm font-medium text-center"
          >
            {noticeMessage}
          </div>
        </div>
      )}

      <main className="flex-1">{renderPhase()}</main>
    </div>
  );
}
