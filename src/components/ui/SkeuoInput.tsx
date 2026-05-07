import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from './SkeuoButton';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export const SkeuoInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, showPasswordToggle, type, disabled, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const hasPasswordToggle = showPasswordToggle && type === 'password';
    const inputType = hasPasswordToggle && isPasswordVisible ? 'text' : type;

    return (
      <div className="flex flex-col gap-2 w-full">
        {label && <label className="text-sm font-semibold opacity-80 pl-1">{label}</label>}
        <div className="relative w-full">
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={cn(
              "skeuo-inset px-4 py-3 rounded-lg w-full outline-none",
              "focus:ring-2 focus:ring-blue-500/50 transition-shadow",
              "text-[var(--text-color)] placeholder:opacity-50",
              hasPasswordToggle && "pr-12",
              error && "border-red-500/50 focus:ring-red-500/50",
              className
            )}
            {...props}
          />
          {hasPasswordToggle && (
            <button
              type="button"
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              aria-pressed={isPasswordVisible}
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              className="absolute inset-y-0 right-1 flex w-10 items-center justify-center text-[var(--text-color)] opacity-60 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        {error && <span className="text-red-500 text-xs pl-1">{error}</span>}
      </div>
    );
  }
);
SkeuoInput.displayName = 'SkeuoInput';
