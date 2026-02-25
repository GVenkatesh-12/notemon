import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { SkeuoButton } from './ui/SkeuoButton';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check initial preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <SkeuoButton variant="icon" onClick={toggleTheme} className="w-8 h-8 md:w-10 md:h-10" aria-label="Toggle Theme">
      {theme === 'light' ? <Moon size={16} className="md:hidden" /> : <Sun size={16} className="md:hidden" />}
      {theme === 'light' ? <Moon size={20} className="hidden md:block" /> : <Sun size={20} className="hidden md:block" />}
    </SkeuoButton>
  );
}
