import React from 'react';
import { cn } from './SkeuoButton';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const SkeuoInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && <label className="text-sm font-semibold opacity-80 pl-1">{label}</label>}
        <input
          ref={ref}
          className={cn(
            "skeuo-inset px-4 py-3 rounded-lg w-full outline-none",
            "focus:ring-2 focus:ring-blue-500/50 transition-shadow",
            "text-[var(--text-color)] placeholder:opacity-50",
            error && "border-red-500/50 focus:ring-red-500/50",
            className
          )}
          {...props}
        />
        {error && <span className="text-red-500 text-xs pl-1">{error}</span>}
      </div>
    );
  }
);
SkeuoInput.displayName = 'SkeuoInput';
