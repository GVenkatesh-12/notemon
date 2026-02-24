import { SkeuoButton } from './SkeuoButton';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />
      
      {/* Modal Dialog */}
      <div className="relative skeuo-panel rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold mb-2 text-[var(--text-color)]">{title}</h3>
        <p className="opacity-80 mb-6 text-sm">{message}</p>
        
        <div className="flex items-center justify-end gap-3 mt-auto">
          <SkeuoButton 
            variant="ghost" 
            onClick={onCancel}
            className="text-sm font-medium"
          >
            Cancel
          </SkeuoButton>
          <SkeuoButton 
            onClick={onConfirm}
            className="bg-red-500 text-white hover:bg-red-600 border-red-600/50 shadow-[inset_2px_2px_5px_rgba(255,255,255,0.2),inset_-2px_-2px_5px_rgba(0,0,0,0.2),2px_2px_5px_rgba(0,0,0,0.1)] text-sm font-medium px-5 py-2"
          >
            Delete
          </SkeuoButton>
        </div>
      </div>
    </div>
  );
}
