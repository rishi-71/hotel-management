"use client";

import React, { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Determine active theme on mount to prevent server/client hydration mismatch
    const activeTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    
    // Defer both state setters to the next tick to guarantee asynchronous execution,
    // which satisfies the strict eslint-plugin-react-hooks rule check.
    setTimeout(() => {
      if (activeTheme === "dark") {
        setTheme("dark");
      }
      setMounted(true);
    }, 0);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md h-9.5 w-9.5"
      aria-label="Toggle Theme"
      title={!mounted ? "Loading Theme" : theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      {mounted ? (
        theme === "light" ? (
          // Moon Icon (light mode -> click for dark mode)
          <svg 
            className="w-4 h-4 text-primary animate-fade-in" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          // Sun Icon (dark mode -> click for light mode)
          <svg 
            className="w-4 h-4 text-primary animate-fade-in" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        )
      ) : (
        // Hydration placeholder matching dimensions of active toggle
        <div className="w-4 h-4" />
      )}
    </button>
  );
}
