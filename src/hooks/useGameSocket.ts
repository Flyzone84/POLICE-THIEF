import { useCallback, useEffect, useRef, useState } from 'react';
import { getCopy } from '../i18n';
import {
  ClientGameState,
  ClientMessage,
  GameErrorCode,
  Language,
  RoomSettings,
  ServerMessage,
} from '../shared/types';
import { sound } from '../utils/sound';

const CLIENT_ID_KEY = 'pt_client_id';
const ROOM_CODE_KEY = 'pt_room_code';

function getOrCreateClientId(): string {
  try {
    let id = sessionStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `p_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return `p_${Math.random().toString(36).slice(2, 11)}`;
  }
}

function hasSavedRoom(): boolean {
  try {
    return Boolean(sessionStorage.getItem(ROOM_CODE_KEY));
  } catch {
    return false;
  }
}

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting';
export type PendingAction =
  | 'create_room'
  | 'join_room'
  | 'start_game'
  | 'select_slot'
  | 'confirm_role'
  | 'submit_guess'
  | 'play_again'
  | null;

export function useGameSocket(preferredLanguage: Language = 'en') {
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [localMuted, setLocalMuted] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [pendingSlotIndex, setPendingSlotIndex] = useState<number | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(() => hasSavedRoom());

  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(getOrCreateClientId());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hadConnectedOnceRef = useRef<boolean>(false);
  const pendingMessagesRef = useRef<ClientMessage[]>([]);
  const langRef = useRef<Language>(preferredLanguage);

  useEffect(() => {
    langRef.current = gameState?.settings.language || preferredLanguage;
  }, [gameState?.settings.language, preferredLanguage]);

  const clearPending = useCallback(() => {
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    setPendingAction(null);
    setPendingSlotIndex(null);
  }, []);

  const startPending = useCallback((action: PendingAction, slotIdx: number | null = null) => {
    if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
    setPendingAction(action);
    setPendingSlotIndex(slotIdx);
    pendingTimeoutRef.current = setTimeout(() => {
      setPendingAction(null);
      setPendingSlotIndex(null);
    }, 8000);
  }, []);

  const showError = useCallback((msg: string) => {
    setErrorMessage(msg);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const showNotice = useCallback((msg: string) => {
    setNoticeMessage(msg);
  }, []);

  useEffect(() => {
    if (!noticeMessage) return;
    const t = setTimeout(() => setNoticeMessage(null), 3500);
    return () => clearTimeout(t);
  }, [noticeMessage]);

  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(null), 5000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  useEffect(() => {
    const roomSound = gameState ? gameState.settings.soundEnabled : true;
    sound.enabled = roomSound && !localMuted;
  }, [gameState, localMuted]);

  const sendMessage = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      pendingMessagesRef.current.push(msg);
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');

      const savedRoom = sessionStorage.getItem(ROOM_CODE_KEY);
      if (savedRoom) {
        ws.send(
          JSON.stringify({
            type: 'reconnect',
            clientId: clientIdRef.current,
            roomCode: savedRoom,
          } satisfies ClientMessage)
        );
      } else {
        setIsRestoringSession(false);
      }

      if (pendingMessagesRef.current.length > 0) {
        const queued = [...pendingMessagesRef.current];
        pendingMessagesRef.current = [];
        queued.forEach((m) => ws.send(JSON.stringify(m)));
      }

      if (hadConnectedOnceRef.current && savedRoom) {
        setNoticeMessage(getCopy(langRef.current).connection.restored);
      }
      hadConnectedOnceRef.current = true;
    };

    ws.onmessage = (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(String(event.data)) as ServerMessage;
      } catch {
        return;
      }

      const activeCopy = getCopy(langRef.current);

      if (msg.type === 'state') {
        clearPending();
        setIsRestoringSession(false);
        setGameState(msg.state);
        try {
          sessionStorage.setItem(ROOM_CODE_KEY, msg.state.roomCode);
        } catch {
          // ignore storage error
        }
      } else if (msg.type === 'error') {
        clearPending();
        setIsRestoringSession(false);
        const friendly =
          activeCopy.errors[msg.code as GameErrorCode] ||
          msg.message ||
          activeCopy.errors.INVALID_ACTION;
        setErrorMessage(friendly);
        if (msg.code === 'ROOM_NOT_FOUND') {
          try {
            sessionStorage.removeItem(ROOM_CODE_KEY);
          } catch {
            // ignore
          }
          setGameState(null);
        }
      } else if (msg.type === 'notice') {
        setNoticeMessage(msg.message);
      } else if (msg.type === 'reconnected') {
        setIsRestoringSession(false);
        setNoticeMessage(activeCopy.connection.restored);
      } else if (msg.type === 'left_room') {
        clearPending();
        setIsRestoringSession(false);
        try {
          sessionStorage.removeItem(ROOM_CODE_KEY);
        } catch {
          // ignore
        }
        setGameState(null);
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      setConnectionStatus('reconnecting');
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 1200);
    };

    ws.onerror = () => {
      // onclose handles reconnect
    };
  }, [clearPending]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const createRoom = useCallback(
    (playerName: string, avatar: string, color: string, settings: RoomSettings) => {
      setErrorMessage(null);
      startPending('create_room');
      sendMessage({
        type: 'create_room',
        clientId: clientIdRef.current,
        playerName,
        avatar,
        color,
        settings,
      });
    },
    [sendMessage, startPending]
  );

  const joinRoom = useCallback(
    (roomCode: string, playerName: string, avatar: string, color: string) => {
      setErrorMessage(null);
      startPending('join_room');
      sendMessage({
        type: 'join_room',
        clientId: clientIdRef.current,
        roomCode: roomCode.trim().toUpperCase(),
        playerName,
        avatar,
        color,
      });
    },
    [sendMessage, startPending]
  );

  const updateSettings = useCallback(
    (settings: RoomSettings) => sendMessage({ type: 'update_settings', settings }),
    [sendMessage]
  );

  const startGame = useCallback(() => {
    startPending('start_game');
    sendMessage({ type: 'start_game' });
  }, [sendMessage, startPending]);

  const selectSlot = useCallback(
    (slotIndex: number) => {
      startPending('select_slot', slotIndex);
      sendMessage({ type: 'select_slot', slotIndex });
    },
    [sendMessage, startPending]
  );

  const confirmRole = useCallback(() => {
    startPending('confirm_role');
    sendMessage({ type: 'confirm_role' });
  }, [sendMessage, startPending]);

  const forceProceedToHunt = useCallback(
    () => sendMessage({ type: 'force_proceed_to_hunt' }),
    [sendMessage]
  );

  const submitGuess = useCallback(
    (targetPlayerId: string) => {
      startPending('submit_guess');
      sendMessage({ type: 'submit_guess', targetPlayerId });
    },
    [sendMessage, startPending]
  );

  const nextPhase = useCallback(() => sendMessage({ type: 'next_phase' }), [sendMessage]);

  const playAgain = useCallback(() => {
    startPending('play_again');
    sendMessage({ type: 'play_again' });
  }, [sendMessage, startPending]);

  const leaveRoom = useCallback(() => {
    clearPending();
    setIsRestoringSession(false);
    sendMessage({ type: 'leave_room' });
    try {
      sessionStorage.removeItem(ROOM_CODE_KEY);
    } catch {
      // ignore
    }
    setGameState(null);
  }, [sendMessage, clearPending]);

  return {
    gameState,
    connectionStatus,
    pendingAction,
    pendingSlotIndex,
    isRestoringSession,
    errorMessage,
    noticeMessage,
    localMuted,
    setLocalMuted,
    showError,
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
  };
}
