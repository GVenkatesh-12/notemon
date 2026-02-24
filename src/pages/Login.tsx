import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';
import { SkeuoInput } from '../components/ui/SkeuoInput';
import { SkeuoButton } from '../components/ui/SkeuoButton';
import { ThemeToggle } from '../components/ThemeToggle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const setToken = useAuthStore(state => state.setToken);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/login', { email, password });
      if (response.data && response.data.token) {
        setToken(response.data.token);
        toast.success('Successfully logged in!');
        navigate('/');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.';
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
        <h1 className="text-3xl font-bold mb-6 text-center">Notes App</h1>
        <p className="text-center opacity-70 mb-8 font-medium">Welcome back! Sign in to access your notes.</p>
        
        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm mb-6 text-center font-medium border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
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
            placeholder="••••••••"
            required
          />

          <SkeuoButton type="submit" disabled={isLoading} className="mt-2 text-lg py-3">
            {isLoading ? 'Signing In...' : 'Sign In'}
          </SkeuoButton>
        </form>
        
        <div className="mt-8 text-center text-sm font-medium">
          <span className="opacity-70">Don't have an account? </span>
          <Link to="/register" className="text-blue-500 hover:text-blue-600 ml-1">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
