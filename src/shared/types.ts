export type EssentialRole = 'King' | 'Queen' | 'Police' | 'Thief';
export type ExtraRole = 'Minister' | 'MLA' | 'MP' | 'Bandri' | 'Crown' | 'Cross';
export type RoleId = EssentialRole | ExtraRole;

export type GamePhase =
  | 'LOBBY'
  | 'ROUND_INTRO'
  | 'SLOT_SELECTION'
  | 'ROLE_REVEAL'
  | 'POLICE_INVESTIGATION'
  | 'GUESS_RESULT'
  | 'ROUND_SCOREBOARD'
  | 'FINAL_RESULT';

export const ESSENTIAL_ROLES: EssentialRole[] = ['King', 'Queen', 'Police', 'Thief'];
export const EXTRA_ROLES: ExtraRole[] = ['Minister', 'MLA', 'MP', 'Bandri', 'Crown', 'Cross'];
export const ALL_ROLES: RoleId[] = [...ESSENTIAL_ROLES, ...EXTRA_ROLES];

export const DEFAULT_ROLE_VALUES: Record<RoleId, number> = {
  King: 1000,
  Queen: 750,
  Police: 100,
  Thief: 0,
  Minister: 500,
  Crown: 400,
  MLA: 350,
  MP: 250,
  Bandri: 150,
  Cross: 50,
};

export type Language = 'en' | 'ml';

export interface RoomSettings {
  language: Language;
  maxPlayers: number;
  minPlayers: number;
  totalRounds: number;
  allowEarlyStart: boolean;
  enableExtraRoles: boolean;
  showAvatars: boolean;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  roleValues: Record<RoleId, number>;
  enabledExtraRoles: ExtraRole[];
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  language: 'en',
  maxPlayers: 6,
  minPlayers: 4,
  totalRounds: 5,
  allowEarlyStart: true,
  enableExtraRoles: true,
  showAvatars: true,
  soundEnabled: true,
  animationsEnabled: true,
  roleValues: { ...DEFAULT_ROLE_VALUES },
  enabledExtraRoles: ['Minister', 'MLA', 'MP', 'Bandri', 'Crown', 'Cross'],
};

export interface AvatarOption {
  id: string;
  emoji: string;
  color: string;
  label: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'crown', emoji: '👑', color: '#D9A441', label: 'Royal' },
  { id: 'detective', emoji: '🕵️', color: '#4B728F', label: 'Sleuth' },
  { id: 'cool', emoji: '😎', color: '#3A7D6B', label: 'Sharp' },
  { id: 'cowboy', emoji: '🤠', color: '#B86B3B', label: 'Ranger' },
  { id: 'smile', emoji: '🙂', color: '#7D6A9C', label: 'Classic' },
  { id: 'mask', emoji: '🎭', color: '#B83B3B', label: 'Mystery' },
  { id: 'fox', emoji: '🦊', color: '#C86D3B', label: 'Clever' },
  { id: 'owl', emoji: '🦉', color: '#586F8C', label: 'Watchful' },
  { id: 'lion', emoji: '🦁', color: '#C98A2C', label: 'Bold' },
  { id: 'person', emoji: '👤', color: '#64748B', label: 'Shadow' },
];

export interface PublicPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isHost: boolean;
  connected: boolean;
  hasPickedSlot: boolean;
  hasConfirmedRole: boolean;
  score: number | null;
}

export interface PublicSlot {
  index: number;
  claimedByPlayerId: string | null;
  claimedByPlayerName: string | null;
}

export interface GuessResultPayload {
  caught: boolean;
  policePlayerId: string;
  policePlayerName: string;
  policePlayerAvatar: string;
  thiefPlayerId: string;
  thiefPlayerName: string;
  thiefPlayerAvatar: string;
  guessedPlayerId: string;
  guessedPlayerName: string;
  guessedPlayerAvatar: string;
  policeReward: number;
}

export interface RoundScoreEntry {
  playerId: string;
  name: string;
  avatar: string;
  color: string;
  role: RoleId;
  roundPoints: number;
  totalScore: number;
  rank: number;
  wasGuessed: boolean;
}

export interface FinalLeaderboardEntry {
  playerId: string;
  name: string;
  avatar: string;
  color: string;
  totalScore: number;
  rank: number;
  roundsWonAsKing: number;
  thiefCatches: number;
  thiefEscapes: number;
}

export interface ClientGameState {
  roomCode: string;
  phase: GamePhase;
  currentRound: number;
  settings: RoomSettings;
  players: PublicPlayer[];
  slots: PublicSlot[];
  myPlayerId: string;
  myRole: RoleId | null;
  myRolePoints: number | null;
  mySlotIndex: number | null;
  myTotalScore: number;
  isPolice: boolean;
  guessResult: GuessResultPayload | null;
  roundSummary: RoundScoreEntry[] | null;
  finalLeaderboard: FinalLeaderboardEntry[] | null;
}

export type GameErrorCode =
  | 'INVALID_CODE'
  | 'ROOM_FULL'
  | 'GAME_STARTED'
  | 'NAME_TAKEN'
  | 'INVALID_NAME'
  | 'TOO_FEW_PLAYERS'
  | 'ROOM_NOT_FOUND'
  | 'INVALID_ACTION'
  | 'ALREADY_PICKED'
  | 'SLOT_TAKEN'
  | 'NOT_HOST'
  | 'NOT_POLICE';

export type ClientMessage =
  | {
      type: 'create_room';
      clientId: string;
      playerName: string;
      avatar: string;
      color: string;
      settings: RoomSettings;
    }
  | {
      type: 'join_room';
      clientId: string;
      roomCode: string;
      playerName: string;
      avatar: string;
      color: string;
    }
  | {
      type: 'reconnect';
      clientId: string;
      roomCode: string;
    }
  | {
      type: 'update_settings';
      settings: RoomSettings;
    }
  | {
      type: 'start_game';
    }
  | {
      type: 'select_slot';
      slotIndex: number;
    }
  | {
      type: 'confirm_role';
    }
  | {
      type: 'force_proceed_to_hunt';
    }
  | {
      type: 'submit_guess';
      targetPlayerId: string;
    }
  | {
      type: 'next_phase';
    }
  | {
      type: 'play_again';
    }
  | {
      type: 'leave_room';
    };

export type ServerMessage =
  | {
      type: 'state';
      state: ClientGameState;
    }
  | {
      type: 'error';
      code: GameErrorCode;
      message?: string;
    }
  | {
      type: 'notice';
      message: string;
    }
  | {
      type: 'reconnected';
    }
  | {
      type: 'left_room';
    };
