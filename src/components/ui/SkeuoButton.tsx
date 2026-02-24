import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'icon';
}

export function SkeuoButton({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "transition-all duration-150 active:scale-[0.98] outline-none select-none",
        variant === 'primary' && "skeuo-btn px-4 py-2 rounded-lg font-medium text-[var(--text-color)]",
        variant === 'ghost' && "hover:bg-black/5 dark:hover:bg-white/5 px-4 py-2 rounded-lg",
        variant === 'icon' && "skeuo-btn p-2 rounded-full flex items-center justify-center",
        className
      )}
      {...props}
    />
  );
}
