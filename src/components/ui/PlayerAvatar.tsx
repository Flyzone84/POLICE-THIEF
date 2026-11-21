import React from 'react';

interface PlayerAvatarProps {
  name: string;
  avatar: string;
  color: string;
  showAvatar?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name,
  avatar,
  color,
  showAvatar = true,
  size = 'md',
}) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const sizeMap = {
    sm: 'w-9 h-9 text-base',
    md: 'w-11 h-11 text-xl',
    lg: 'w-14 h-14 text-2xl',
  };

  const textInitialSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center shrink-0 font-bold select-none border border-white/15 shadow-sm`}
      style={{ backgroundColor: `${color}28`, borderColor: `${color}80`, color: '#F6EFE0' }}
      aria-hidden="true"
    >
      {showAvatar && avatar ? (
        <span>{avatar}</span>
      ) : (
        <span className={textInitialSize[size]}>{initials || '?'}</span>
      )}
    </div>
  );
};
