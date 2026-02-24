import { useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/client';
import { SkeuoButton } from './SkeuoButton';
import { SkeuoInput } from './SkeuoInput';

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordDialog({ isOpen, onClose }: ChangePasswordDialogProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setOldPassword('');
    setNewPassword('');
    setError('');
    setIsLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (oldPassword === newPassword) {
      setError('New password must be different from the old one.');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/change-password', { oldPassword, newPassword });
      toast.success('Password changed successfully!');
      handleClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to change password.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      <div className="relative skeuo-panel rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold mb-4 text-[var(--text-color)]">Change Password</h3>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm mb-4 text-center font-medium border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <SkeuoInput
            label="Current Password"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoFocus
          />

          <SkeuoInput
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <div className="flex items-center justify-end gap-3 mt-2">
            <SkeuoButton
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="text-sm font-medium"
            >
              Cancel
            </SkeuoButton>
            <SkeuoButton
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 text-white hover:bg-blue-600 border-blue-600/50 shadow-[inset_2px_2px_5px_rgba(255,255,255,0.2),inset_-2px_-2px_5px_rgba(0,0,0,0.2),2px_2px_5px_rgba(0,0,0,0.1)] text-sm font-medium px-5 py-2"
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </SkeuoButton>
          </div>
        </form>
      </div>
    </div>
  );
}
