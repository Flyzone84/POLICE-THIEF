import express from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import {
  DEFAULT_ROOM_SETTINGS,
  ESSENTIAL_ROLES,
  EXTRA_ROLES,
} from './src/shared/types.ts';
import type {
  ClientGameState,
  ClientMessage,
  FinalLeaderboardEntry,
  GameErrorCode,
  GamePhase,
  GuessResultPayload,
  RoleId,
  RoomSettings,
  RoundScoreEntry,
  ServerMessage,
} from './src/shared/types.ts';

interface ServerPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isHost: boolean;
  connected: boolean;
  score: number;
  roundsWonAsKing: number;
  thiefCatches: number;
  thiefEscapes: number;
  ws: WebSocket | null;
}

interface ServerSlot {
  index: number;
  role: RoleId;
  claimedByPlayerId: string | null;
}

interface RoomState {
  code: string;
  phase: GamePhase;
  currentRound: number;
  settings: RoomSettings;
  players: ServerPlayer[];
  slots: ServerSlot[];
  playerRoles: Map<string, RoleId>;
  confirmedRolePlayers: Set<string>;
  guessResult: GuessResultPayload | null;
  roundSummary: RoundScoreEntry[] | null;
  phaseTimer: ReturnType<typeof setTimeout> | null;
  lastActivityAt: number;
}

const rooms = new Map<string, RoomState>();
const socketMeta = new Map<WebSocket, { roomCode: string; playerId: string }>();

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode(): string {
  for (let attempt = 0; attempt < 25; attempt++) {
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += CODE_ALPHABET[crypto.randomInt(0, CODE_ALPHABET.length)];
    }
    if (!rooms.has(code)) return code;
  }
  return `R${crypto.randomInt(1000, 9999)}`;
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sanitizeSettings(input: Partial<RoomSettings> | undefined): RoomSettings {
  const base = {
    ...DEFAULT_ROOM_SETTINGS,
    roleValues: { ...DEFAULT_ROOM_SETTINGS.roleValues },
    enabledExtraRoles: [...DEFAULT_ROOM_SETTINGS.enabledExtraRoles],
  };
  if (!input) return base;

  const maxPlayers = Math.min(10, Math.max(4, Math.round(Number(input.maxPlayers) || 6)));
  const minPlayers = Math.min(maxPlayers, Math.max(4, Math.round(Number(input.minPlayers) || 4)));
  const totalRounds = [1, 2, 3, 5, 10].includes(Number(input.totalRounds))
    ? Number(input.totalRounds)
    : Math.min(20, Math.max(1, Math.round(Number(input.totalRounds) || 5)));

  const roleValues = { ...base.roleValues };
  if (input.roleValues) {
    (Object.keys(roleValues) as RoleId[]).forEach((role) => {
      const val = Number(input.roleValues?.[role]);
      if (Number.isFinite(val) && val >= 0 && val <= 100000) {
        roleValues[role] = Math.round(val);
      }
    });
  }

  const enabledExtraRoles = Array.isArray(input.enabledExtraRoles)
    ? input.enabledExtraRoles.filter((r): r is (typeof EXTRA_ROLES)[number] =>
        (EXTRA_ROLES as readonly string[]).includes(r)
      )
    : base.enabledExtraRoles;

  const language = input.language === 'ml' ? 'ml' : 'en';

  return {
    language,
    maxPlayers,
    minPlayers,
    totalRounds,
    allowEarlyStart: typeof input.allowEarlyStart === 'boolean' ? input.allowEarlyStart : base.allowEarlyStart,
    enableExtraRoles: typeof input.enableExtraRoles === 'boolean' ? input.enableExtraRoles : base.enableExtraRoles,
    showAvatars: typeof input.showAvatars === 'boolean' ? input.showAvatars : base.showAvatars,
    soundEnabled: typeof input.soundEnabled === 'boolean' ? input.soundEnabled : base.soundEnabled,
    animationsEnabled: typeof input.animationsEnabled === 'boolean' ? input.animationsEnabled : base.animationsEnabled,
    roleValues,
    enabledExtraRoles: enabledExtraRoles.length > 0 ? enabledExtraRoles : [...EXTRA_ROLES],
  };
}

function generateRoundRoles(playerCount: number, settings: RoomSettings): RoleId[] {
  const roles: RoleId[] = [...ESSENTIAL_ROLES];
  const extraCount = Math.max(0, playerCount - ESSENTIAL_ROLES.length);

  if (extraCount > 0) {
    const pool =
      settings.enableExtraRoles && settings.enabledExtraRoles.length > 0
        ? shuffleArray(settings.enabledExtraRoles)
        : shuffleArray([...EXTRA_ROLES]);

    for (let i = 0; i < extraCount; i++) {
      roles.push(pool[i % pool.length]);
    }
  }

  return shuffleArray(roles);
}

function clearRoomTimer(room: RoomState) {
  if (room.phaseTimer) {
    clearTimeout(room.phaseTimer);
    room.phaseTimer = null;
  }
}

function sendToSocket(ws: WebSocket | null, msg: ServerMessage) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function sendError(ws: WebSocket | null, code: GameErrorCode, customMessage?: string) {
  sendToSocket(ws, { type: 'error', code, message: customMessage });
}

function buildFinalLeaderboard(room: RoomState): FinalLeaderboardEntry[] {
  const sorted = [...room.players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.roundsWonAsKing - a.roundsWonAsKing;
  });

  return sorted.map((p, idx) => ({
    playerId: p.id,
    name: p.name,
    avatar: p.avatar,
    color: p.color,
    totalScore: p.score,
    rank: idx + 1,
    roundsWonAsKing: p.roundsWonAsKing,
    thiefCatches: p.thiefCatches,
    thiefEscapes: p.thiefEscapes,
  }));
}

function buildClientState(room: RoomState, viewerId: string): ClientGameState {
  const isScoreVisible = room.phase === 'FINAL_RESULT';
  const isRoleVisibleToSelf =
    room.phase === 'ROLE_REVEAL' ||
    room.phase === 'POLICE_INVESTIGATION' ||
    room.phase === 'GUESS_RESULT' ||
    room.phase === 'FINAL_RESULT';

  const myRole = isRoleVisibleToSelf ? room.playerRoles.get(viewerId) ?? null : null;
  const myPlayer = room.players.find((p) => p.id === viewerId);
  const mySlot = room.slots.find((s) => s.claimedByPlayerId === viewerId);

  const playerNameById = new Map(room.players.map((p) => [p.id, p.name]));

  return {
    roomCode: room.code,
    phase: room.phase,
    currentRound: room.currentRound,
    settings: room.settings,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      color: p.color,
      isHost: p.isHost,
      connected: p.connected,
      hasPickedSlot: room.slots.some((s) => s.claimedByPlayerId === p.id),
      hasConfirmedRole: room.confirmedRolePlayers.has(p.id),
      score: isScoreVisible ? p.score : null,
    })),
    slots: room.slots.map((s) => ({
      index: s.index,
      claimedByPlayerId: s.claimedByPlayerId,
      claimedByPlayerName: s.claimedByPlayerId ? playerNameById.get(s.claimedByPlayerId) ?? null : null,
    })),
    myPlayerId: viewerId,
    myRole,
    myRolePoints: myRole ? room.settings.roleValues[myRole] : null,
    mySlotIndex: mySlot ? mySlot.index : null,
    myTotalScore: myPlayer ? myPlayer.score : 0,
    isPolice: myRole === 'Police',
    guessResult: room.guessResult,
    roundSummary: isScoreVisible ? room.roundSummary : null,
    finalLeaderboard: room.phase === 'FINAL_RESULT' ? buildFinalLeaderboard(room) : null,
  };
}

function broadcastState(room: RoomState) {
  room.lastActivityAt = Date.now();
  for (const player of room.players) {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      sendToSocket(player.ws, {
        type: 'state',
        state: buildClientState(room, player.id),
      });
    }
  }
}

function broadcastNotice(room: RoomState, message: string) {
  for (const player of room.players) {
    sendToSocket(player.ws, { type: 'notice', message });
  }
}

function startNewRound(room: RoomState, roundNumber: number) {
  clearRoomTimer(room);
  room.currentRound = roundNumber;
  room.phase = 'ROUND_INTRO';
  room.playerRoles.clear();
  room.confirmedRolePlayers.clear();
  room.guessResult = null;
  room.roundSummary = null;

  const roles = generateRoundRoles(room.players.length, room.settings);
  room.slots = roles.map((role, index) => ({
    index,
    role,
    claimedByPlayerId: null,
  }));

  broadcastState(room);

  const introDelay = room.settings.animationsEnabled ? 1500 : 500;
  room.phaseTimer = setTimeout(() => {
    if (!rooms.has(room.code) || room.phase !== 'ROUND_INTRO') return;
    room.phase = 'SLOT_SELECTION';
    broadcastState(room);
  }, introDelay);
}

function assignHostIfNeeded(room: RoomState) {
  const currentHost = room.players.find((p) => p.isHost);
  if (currentHost && currentHost.connected) return;

  const connectedCandidate = room.players.find((p) => p.connected);
  if (connectedCandidate && (!currentHost || !currentHost.connected)) {
    room.players.forEach((p) => {
      p.isHost = p.id === connectedCandidate.id;
    });
    broadcastNotice(room, `${connectedCandidate.name} is now the room host.`);
    broadcastState(room);
  }
}

function removePlayerFromRoom(room: RoomState, playerId: string) {
  const idx = room.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return;
  const [removed] = room.players.splice(idx, 1);

  if (removed.ws) {
    socketMeta.delete(removed.ws);
  }

  if (room.players.length === 0) {
    clearRoomTimer(room);
    rooms.delete(room.code);
    return;
  }

  if (removed.isHost) {
    const nextHost = room.players.find((p) => p.connected) || room.players[0];
    nextHost.isHost = true;
    broadcastNotice(room, `${nextHost.name} is now the room host.`);
  }

  if (room.phase !== 'LOBBY' && room.phase !== 'FINAL_RESULT') {
    if (room.players.length < 4) {
      clearRoomTimer(room);
      room.phase = 'LOBBY';
      room.currentRound = 0;
      room.slots = [];
      room.playerRoles.clear();
      room.confirmedRolePlayers.clear();
      room.guessResult = null;
      room.roundSummary = null;
      broadcastNotice(room, `${removed.name} left the table. Returned to lobby because fewer than 4 players remain.`);
    } else {
      // Handle mid-round departure cleanly if >= 4 remain
      room.playerRoles.delete(playerId);
      room.confirmedRolePlayers.delete(playerId);
      // Reset current round cleanly if roles would become inconsistent (e.g. Police/Thief left)
      clearRoomTimer(room);
      broadcastNotice(room, `${removed.name} left the game. Re-shuffling this round for ${room.players.length} players.`);
      startNewRound(room, room.currentRound);
      return;
    }
  }

  broadcastState(room);
}

// Cleanup stale rooms periodically
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    const anyConnected = room.players.some((p) => p.connected);
    const maxIdle = anyConnected ? 60 * 60 * 1000 : 10 * 60 * 1000;
    if (now - room.lastActivityAt > maxIdle) {
      clearRoomTimer(room);
      rooms.delete(code);
    }
  }
}, 60 * 1000);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health and room lookup API
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/rooms/:code', (req, res) => {
    const code = String(req.params.code || '').trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ ok: false, code: 'ROOM_NOT_FOUND' });
      return;
    }
    if (room.phase !== 'LOBBY') {
      res.status(409).json({ ok: false, code: 'GAME_STARTED' });
      return;
    }
    if (room.players.length >= room.settings.maxPlayers) {
      res.status(409).json({ ok: false, code: 'ROOM_FULL' });
      return;
    }
    const host = room.players.find((p) => p.isHost);
    res.json({
      ok: true,
      roomCode: room.code,
      playerCount: room.players.length,
      maxPlayers: room.settings.maxPlayers,
      hostName: host?.name ?? 'Host',
      showAvatars: room.settings.showAvatars,
    });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Keep WebSocket connections alive through reverse proxies (Render, Koyeb, Cloudflare)
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.ping();
      }
    });
  }, 25000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(String(raw)) as ClientMessage;
      } catch {
        sendError(ws, 'INVALID_ACTION');
        return;
      }

      if (!msg || typeof msg.type !== 'string') {
        sendError(ws, 'INVALID_ACTION');
        return;
      }

      if (msg.type === 'create_room') {
        const cleanName = String(msg.playerName || '').trim().slice(0, 20);
        if (!cleanName) {
          sendError(ws, 'INVALID_NAME');
          return;
        }
        const clientId = String(msg.clientId || crypto.randomUUID());
        const code = generateRoomCode();
        const settings = sanitizeSettings(msg.settings);

        const hostPlayer: ServerPlayer = {
          id: clientId,
          name: cleanName,
          avatar: String(msg.avatar || '👑'),
          color: String(msg.color || '#D9A441'),
          isHost: true,
          connected: true,
          score: 0,
          roundsWonAsKing: 0,
          thiefCatches: 0,
          thiefEscapes: 0,
          ws,
        };

        const room: RoomState = {
          code,
          phase: 'LOBBY',
          currentRound: 0,
          settings,
          players: [hostPlayer],
          slots: [],
          playerRoles: new Map(),
          confirmedRolePlayers: new Set(),
          guessResult: null,
          roundSummary: null,
          phaseTimer: null,
          lastActivityAt: Date.now(),
        };

        rooms.set(code, room);
        socketMeta.set(ws, { roomCode: code, playerId: clientId });
        broadcastState(room);
        return;
      }

      if (msg.type === 'join_room') {
        const code = String(msg.roomCode || '').trim().toUpperCase();
        const cleanName = String(msg.playerName || '').trim().slice(0, 20);
        if (!code || code.length < 4) {
          sendError(ws, 'INVALID_CODE');
          return;
        }
        if (!cleanName) {
          sendError(ws, 'INVALID_NAME');
          return;
        }
        const room = rooms.get(code);
        if (!room) {
          sendError(ws, 'ROOM_NOT_FOUND');
          return;
        }

        const clientId = String(msg.clientId || crypto.randomUUID());
        const existingById = room.players.find((p) => p.id === clientId);
        if (existingById) {
          existingById.ws = ws;
          existingById.connected = true;
          socketMeta.set(ws, { roomCode: code, playerId: existingById.id });
          broadcastState(room);
          return;
        }

        if (room.phase !== 'LOBBY') {
          sendError(ws, 'GAME_STARTED');
          return;
        }
        if (room.players.length >= room.settings.maxPlayers) {
          sendError(ws, 'ROOM_FULL');
          return;
        }
        const duplicateName = room.players.some(
          (p) => p.name.toLowerCase() === cleanName.toLowerCase()
        );
        if (duplicateName) {
          sendError(ws, 'NAME_TAKEN');
          return;
        }

        const newPlayer: ServerPlayer = {
          id: clientId,
          name: cleanName,
          avatar: String(msg.avatar || '🙂'),
          color: String(msg.color || '#4B728F'),
          isHost: false,
          connected: true,
          score: 0,
          roundsWonAsKing: 0,
          thiefCatches: 0,
          thiefEscapes: 0,
          ws,
        };

        room.players.push(newPlayer);
        socketMeta.set(ws, { roomCode: code, playerId: clientId });
        broadcastState(room);
        return;
      }

      if (msg.type === 'reconnect') {
        const code = String(msg.roomCode || '').trim().toUpperCase();
        const clientId = String(msg.clientId || '');
        const room = rooms.get(code);
        if (!room) {
          sendError(ws, 'ROOM_NOT_FOUND');
          return;
        }
        const player = room.players.find((p) => p.id === clientId);
        if (!player) {
          sendError(ws, 'ROOM_NOT_FOUND');
          return;
        }
        player.ws = ws;
        player.connected = true;
        socketMeta.set(ws, { roomCode: code, playerId: player.id });
        sendToSocket(ws, { type: 'reconnected' });
        broadcastState(room);
        return;
      }

      // Authenticated room actions
      const meta = socketMeta.get(ws);
      if (!meta) {
        sendError(ws, 'ROOM_NOT_FOUND');
        return;
      }
      const room = rooms.get(meta.roomCode);
      if (!room) {
        sendError(ws, 'ROOM_NOT_FOUND');
        return;
      }
      const player = room.players.find((p) => p.id === meta.playerId);
      if (!player) {
        sendError(ws, 'INVALID_ACTION');
        return;
      }

      switch (msg.type) {
        case 'leave_room': {
          removePlayerFromRoom(room, player.id);
          sendToSocket(ws, { type: 'left_room' });
          break;
        }

        case 'update_settings': {
          if (!player.isHost) {
            sendError(ws, 'NOT_HOST');
            return;
          }
          if (room.phase !== 'LOBBY') {
            sendError(ws, 'INVALID_ACTION');
            return;
          }
          const next = sanitizeSettings(msg.settings);
          if (next.maxPlayers < room.players.length) {
            next.maxPlayers = room.players.length;
          }
          room.settings = next;
          broadcastState(room);
          break;
        }

        case 'start_game': {
          if (!player.isHost) {
            sendError(ws, 'NOT_HOST');
            return;
          }
          if (room.phase !== 'LOBBY') {
            sendError(ws, 'INVALID_ACTION');
            return;
          }
          const requiredMin = room.settings.allowEarlyStart
            ? Math.max(4, room.settings.minPlayers)
            : room.settings.maxPlayers;

          if (room.players.length < 4 || room.players.length < requiredMin) {
            sendError(
              ws,
              'TOO_FEW_PLAYERS',
              `Need at least ${Math.max(4, requiredMin)} players to begin.`
            );
            return;
          }

          room.players.forEach((p) => {
            p.score = 0;
            p.roundsWonAsKing = 0;
            p.thiefCatches = 0;
            p.thiefEscapes = 0;
          });
          startNewRound(room, 1);
          break;
        }

        case 'select_slot': {
          if (room.phase !== 'SLOT_SELECTION') {
            sendError(ws, 'INVALID_ACTION');
            return;
          }
          const alreadyPicked = room.slots.some((s) => s.claimedByPlayerId === player.id);
          if (alreadyPicked) {
            sendError(ws, 'ALREADY_PICKED');
            return;
          }
          const slot = room.slots.find((s) => s.index === msg.slotIndex);
          if (!slot) {
            sendError(ws, 'INVALID_ACTION');
            return;
          }
          if (slot.claimedByPlayerId !== null) {
            sendError(ws, 'SLOT_TAKEN');
            return;
          }

          slot.claimedByPlayerId = player.id;
          room.playerRoles.set(player.id, slot.role);
          broadcastState(room);

          const allPicked = room.slots.every((s) => s.claimedByPlayerId !== null);
          if (allPicked) {
            clearRoomTimer(room);
            room.phaseTimer = setTimeout(() => {
              if (!rooms.has(room.code) || room.phase !== 'SLOT_SELECTION') return;
              room.phase = 'ROLE_REVEAL';
              broadcastState(room);
            }, 320);
          }
          break;
        }

        case 'confirm_role': {
          if (room.phase !== 'ROLE_REVEAL') {
            sendError(ws, 'INVALID_ACTION');
            return;
          }
          room.confirmedRolePlayers.add(player.id);
          broadcastState(room);

          const allReady = room.players.every(
            (p) => !p.connected || room.confirmedRolePlayers.has(p.id)
          );
          if (allReady) {
            clearRoomTimer(room);
            room.phaseTimer = setTimeout(() => {
              if (!rooms.has(room.code) || room.phase !== 'ROLE_REVEAL') return;
              room.phase = 'POLICE_INVESTIGATION';
              broadcastState(room);
            }, 250);
          }
          break;
        }

        case 'force_proceed_to_hunt': {
          if (!player.isHost || room.phase !== 'ROLE_REVEAL') {
            sendError(ws, 'INVALID_ACTION');
            return;
          }
          clearRoomTimer(room);
          room.phase = 'POLICE_INVESTIGATION';
          broadcastState(room);
          break;
        }

        case 'submit_guess': {
          if (room.phase !== 'POLICE_INVESTIGATION') {
            sendError(ws, 'INVALID_ACTION');
            return;
          }
          const myRole = room.playerRoles.get(player.id);
          if (myRole !== 'Police') {
            sendError(ws, 'NOT_POLICE');
            return;
          }
          const target = room.players.find((p) => p.id === msg.targetPlayerId);
          if (!target || target.id === player.id) {
            sendError(ws, 'INVALID_ACTION');
            return;
          }

          const thiefEntry = Array.from(room.playerRoles.entries()).find(([, r]) => r === 'Thief');
          const thiefPlayer = thiefEntry
            ? room.players.find((p) => p.id === thiefEntry[0])
            : undefined;
          if (!thiefPlayer) {
            sendError(ws, 'INVALID_ACTION');
            return;
          }

          const caught = target.id === thiefPlayer.id;
          const policeReward = room.settings.roleValues.Police;
          const thiefBase = room.settings.roleValues.Thief;

          const roundEntries: RoundScoreEntry[] = room.players.map((p) => {
            const role = room.playerRoles.get(p.id) || 'Cross';
            let roundPoints = room.settings.roleValues[role] ?? 0;

            if (role === 'Police') {
              roundPoints = caught ? policeReward : 0;
              if (caught) p.thiefCatches += 1;
            } else if (role === 'Thief') {
              roundPoints = caught ? thiefBase : policeReward;
              if (!caught) p.thiefEscapes += 1;
            } else if (role === 'King') {
              p.roundsWonAsKing += 1;
            }

            p.score += roundPoints;

            return {
              playerId: p.id,
              name: p.name,
              avatar: p.avatar,
              color: p.color,
              role,
              roundPoints,
              totalScore: p.score,
              rank: 0,
              wasGuessed: p.id === target.id,
            };
          });

          roundEntries.sort((a, b) => b.totalScore - a.totalScore);
          roundEntries.forEach((entry, idx) => {
            entry.rank = idx + 1;
          });

          room.guessResult = {
            caught,
            policePlayerId: player.id,
            policePlayerName: player.name,
            policePlayerAvatar: player.avatar,
            thiefPlayerId: thiefPlayer.id,
            thiefPlayerName: thiefPlayer.name,
            thiefPlayerAvatar: thiefPlayer.avatar,
            guessedPlayerId: target.id,
            guessedPlayerName: target.name,
            guessedPlayerAvatar: target.avatar,
            policeReward,
          };
          room.roundSummary = roundEntries;
          room.phase = 'GUESS_RESULT';
          broadcastState(room);

          clearRoomTimer(room);
          const resultDelay = room.settings.animationsEnabled ? 3200 : 1200;
          room.phaseTimer = setTimeout(() => {
            if (!rooms.has(room.code) || room.phase !== 'GUESS_RESULT') return;
            if (room.currentRound >= room.settings.totalRounds) {
              room.phase = 'FINAL_RESULT';
              broadcastState(room);
            } else {
              startNewRound(room, room.currentRound + 1);
            }
          }, resultDelay);
          break;
        }

        case 'next_phase': {
          // Automatic round progression handles GUESS_RESULT -> next round / FINAL_RESULT
          break;
        }

        case 'play_again': {
          if (!player.isHost || room.phase !== 'FINAL_RESULT') {
            sendError(ws, 'NOT_HOST');
            return;
          }
          room.players.forEach((p) => {
            p.score = 0;
            p.roundsWonAsKing = 0;
            p.thiefCatches = 0;
            p.thiefEscapes = 0;
          });
          startNewRound(room, 1);
          break;
        }
      }
    });

    ws.on('close', () => {
      const meta = socketMeta.get(ws);
      if (!meta) return;
      socketMeta.delete(ws);

      const room = rooms.get(meta.roomCode);
      if (!room) return;
      const player = room.players.find((p) => p.id === meta.playerId);
      if (!player) return;

      // Only mark disconnected if this socket is still the active one
      if (player.ws === ws) {
        player.connected = false;
        player.ws = null;
        broadcastState(room);

        // If host disconnected, transfer host after 12s grace period if still offline
        if (player.isHost) {
          setTimeout(() => {
            const currentRoom = rooms.get(meta.roomCode);
            if (!currentRoom) return;
            assignHostIfNeeded(currentRoom);
          }, 12000);
        }
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`POLICE&THEIF server listening on http://localhost:${PORT}`);
  });
}

startServer();
