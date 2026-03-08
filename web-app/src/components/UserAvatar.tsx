/**
 * UserAvatar — Reusable avatar component
 * Displays user's uploaded image or a fallback (initials/icon)
 */

import { useState } from 'react';
import { UserCircle } from 'lucide-react';

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
  xl: 'text-2xl',
};

const iconSizeMap = {
  sm: 'w-8 h-8',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function UserAvatar({ avatarUrl, name, size = 'md', className = '' }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'User avatar'}
        className={`${sizeMap[size]} rounded-full object-cover border border-slate-200 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  if (name) {
    return (
      <div className={`${sizeMap[size]} rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 ${className}`}>
        <span className={`${textSizeMap[size]} font-bold text-slate-600`}>
          {getInitials(name)}
        </span>
      </div>
    );
  }

  return (
    <UserCircle className={`${iconSizeMap[size]} text-slate-400 ${className}`} />
  );
}
