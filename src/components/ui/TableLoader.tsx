import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 18, className = '' }) => (
  <Loader2 size={size} className={`animate-spin shrink-0 ${className}`} aria-hidden="true" />
);

interface TableLoaderProps {
  title: string;
  subtitle?: string;
}

export const TableLoader: React.FC<TableLoaderProps> = ({ title, subtitle }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full min-h-[calc(100dvh-72px)] flex flex-col items-center justify-center px-4 text-center"
    >
      <div className="relative w-16 h-20 rounded-xl folded-chit flex items-center justify-center shadow-xl mb-6">
        <Spinner size={28} className="text-[#8C5E14]" />
      </div>
      <h2 className="font-display font-bold text-xl sm:text-2xl text-[#F6EFE0]">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-[#A9B2C7] max-w-xs">{subtitle}</p>}
    </div>
  );
};
