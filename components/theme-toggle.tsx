'use client';

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);

    // Get current theme from document class or localStorage
    const root = document.documentElement;
    const currentTheme = root.classList.contains('light') ? 'light' : 'dark';
    const stored = localStorage.getItem('theme') as 'dark' | 'light' | null;

    // Priority: stored preference > current class > default dark
    const initialTheme = stored || currentTheme || 'dark';

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: 'dark' | 'light') => {
    const root = document.documentElement;

    // Remove both classes first
    root.classList.remove('dark', 'light');

    // Add the new theme class
    root.classList.add(newTheme);

    // Store in localStorage
    try {
      localStorage.setItem('theme', newTheme);
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }

    // Also update the color-scheme for better browser integration
    root.style.colorScheme = newTheme;
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    console.log('Toggling theme from', theme, 'to', newTheme); // Debug log
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Show loading state until mounted
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled
      >
        <div className="h-4 w-4 animate-pulse bg-current rounded opacity-20" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-8 w-8 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
      title={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 transition-transform duration-200" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-200" />
      )}
      <span className="sr-only">
        Cambiar a tema {theme === 'dark' ? 'claro' : 'oscuro'}
      </span>
    </Button>
  );
}
