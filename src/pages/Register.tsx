import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../api/client';
import { SkeuoInput } from '../components/ui/SkeuoInput';
import { SkeuoButton } from '../components/ui/SkeuoButton';
import { ThemeToggle } from '../components/ThemeToggle';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await apiClient.post('/register', { email, password });
      const msg = 'Registration successful! Redirecting to login...';
      setSuccess(msg);
      toast.success(msg);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="skeuo-panel p-8 md:p-10 rounded-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Create Account</h1>
        <p className="text-center opacity-70 mb-8 font-medium">Join us to safely store your notes in the cloud.</p>
        
        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm mb-6 text-center font-medium border border-red-500/20">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-500/10 text-green-500 p-3 rounded-lg text-sm mb-6 text-center font-medium border border-green-500/20">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-6">
          <SkeuoInput
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          
          <SkeuoInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            required
            minLength={6}
          />

          <SkeuoButton type="submit" disabled={isLoading || !!success} className="mt-2 text-lg py-3">
            {isLoading ? 'Creating Account...' : 'Register'}
          </SkeuoButton>
        </form>
        
        <div className="mt-8 text-center text-sm font-medium">
          <span className="opacity-70">Already have an account? </span>
          <Link to="/login" className="text-blue-500 hover:text-blue-600 ml-1">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
