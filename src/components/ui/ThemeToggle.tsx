import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-10 h-6 rounded-full transition-all duration-300 border border-border bg-secondary hover:bg-secondary/80"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {/* Toggle indicator */}
      <div
        className={`absolute w-4 h-4 rounded-full transition-all duration-300 ease-out ${
          theme === 'dark' 
            ? 'translate-x-2 bg-gradient-to-r from-[hsl(175,100%,37%)] to-[hsl(180,80%,45%)]' 
            : '-translate-x-2 bg-gradient-to-r from-[hsl(156,100%,50%)] to-[hsl(160,100%,45%)]'
        }`}
      />
      
      {/* Icons */}
      <Sun className={`absolute left-1 w-3 h-3 transition-opacity duration-300 ${
        theme === 'light' ? 'opacity-100 text-background' : 'opacity-40 text-muted-foreground'
      }`} />
      <Moon className={`absolute right-1 w-3 h-3 transition-opacity duration-300 ${
        theme === 'dark' ? 'opacity-100 text-background' : 'opacity-40 text-muted-foreground'
      }`} />
    </button>
  );
}
