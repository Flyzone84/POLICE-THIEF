import React, { useState } from 'react';
import { Award, Crown, Landmark, Shield, Sparkles, UserCheck, X } from 'lucide-react';
import { RoleId } from '../../shared/types';

export const ROLE_ARTWORK: Partial<Record<RoleId, string>> = {
  King: '/src/assets/images/role_king_crest_1795249177796.jpg',
  Queen: '/src/assets/images/role_queen_crest_1795249178164.jpg',
  Police: '/src/assets/images/role_police_crest_1795249177716.jpg',
  Thief: '/src/assets/images/role_thief_crest_1795249177826.jpg',
};

export const ROLE_THEMES: Record<
  RoleId,
  {
    accentText: string;
    borderColor: string;
    sealBg: string;
    sealText: string;
    emoji: string;
  }
> = {
  King: {
    accentText: 'text-[#8C5E14]',
    borderColor: 'border-[#C5902D]',
    sealBg: 'bg-[#D9A441]',
    sealText: 'text-[#1A1510]',
    emoji: '👑',
  },
  Queen: {
    accentText: 'text-[#8F2D3A]',
    borderColor: 'border-[#B84858]',
    sealBg: 'bg-[#B84858]',
    sealText: 'text-[#FFF8F0]',
    emoji: '👸',
  },
  Police: {
    accentText: 'text-[#1F4B6E]',
    borderColor: 'border-[#336B96]',
    sealBg: 'bg-[#254E70]',
    sealText: 'text-[#F6EFE0]',
    emoji: '👮',
  },
  Thief: {
    accentText: 'text-[#9E2A2B]',
    borderColor: 'border-[#9E2A2B]',
    sealBg: 'bg-[#241E1C]',
    sealText: 'text-[#F6EFE0]',
    emoji: '🥷',
  },
  Minister: {
    accentText: 'text-[#2E5E4E]',
    borderColor: 'border-[#3A7D6B]',
    sealBg: 'bg-[#2E5E4E]',
    sealText: 'text-[#F6EFE0]',
    emoji: '📜',
  },
  Crown: {
    accentText: 'text-[#7C5A21]',
    borderColor: 'border-[#B08338]',
    sealBg: 'bg-[#8F6826]',
    sealText: 'text-[#FFF9EC]',
    emoji: '⚜️',
  },
  MLA: {
    accentText: 'text-[#394A6D]',
    borderColor: 'border-[#4D638F]',
    sealBg: 'bg-[#394A6D]',
    sealText: 'text-[#F6EFE0]',
    emoji: '🏛️',
  },
  MP: {
    accentText: 'text-[#4B4469]',
    borderColor: 'border-[#675E8F]',
    sealBg: 'bg-[#4B4469]',
    sealText: 'text-[#F6EFE0]',
    emoji: '⚖️',
  },
  Bandri: {
    accentText: 'text-[#7A4A28]',
    borderColor: 'border-[#9C6136]',
    sealBg: 'bg-[#7A4A28]',
    sealText: 'text-[#F6EFE0]',
    emoji: '🗝️',
  },
  Cross: {
    accentText: 'text-[#524A42]',
    borderColor: 'border-[#7D7267]',
    sealBg: 'bg-[#524A42]',
    sealText: 'text-[#F6EFE0]',
    emoji: '✖️',
  },
};

interface RoleIllustrationProps {
  role: RoleId;
  size?: 'sm' | 'md' | 'lg';
}

export const RoleIllustration: React.FC<RoleIllustrationProps> = ({ role, size = 'lg' }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const artPath = ROLE_ARTWORK[role];
  const theme = ROLE_THEMES[role];

  const sizeClass =
    size === 'sm' ? 'w-12 h-12 rounded-lg' : size === 'md' ? 'w-24 h-24 rounded-xl' : 'w-44 h-44 rounded-xl';

  if (artPath && !imgFailed) {
    return (
      <div className={`${sizeClass} overflow-hidden border ${theme.borderColor}/40 shadow-inner bg-[#EFE4CE] shrink-0`}>
        <img
          src={artPath}
          alt={`${role} emblem`}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const iconSize = size === 'sm' ? 22 : size === 'md' ? 40 : 64;
  const renderIcon = () => {
    switch (role) {
      case 'King':
        return <Crown size={iconSize} strokeWidth={1.75} />;
      case 'Queen':
        return <Sparkles size={iconSize} strokeWidth={1.75} />;
      case 'Police':
        return <Shield size={iconSize} strokeWidth={1.75} />;
      case 'Thief':
        return <UserCheck size={iconSize} strokeWidth={1.75} />;
      case 'Minister':
      case 'MLA':
      case 'MP':
        return <Landmark size={iconSize} strokeWidth={1.75} />;
      case 'Cross':
        return <X size={iconSize} strokeWidth={2} />;
      default:
        return <Award size={iconSize} strokeWidth={1.75} />;
    }
  };

  return (
    <div
      className={`${sizeClass} flex flex-col items-center justify-center border-2 ${theme.borderColor}/45 bg-[#EAE0C8] ${theme.accentText} shrink-0`}
    >
      {renderIcon()}
    </div>
  );
};
