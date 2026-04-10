"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  isLoading = false,
  placeholder = "Search for songs, artists...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  const handleSearch = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (value.trim()) {
          onSearch(value.trim());
        }
      }, 500); // 500ms debounce
    },
    [onSearch]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Clear debounce timer and search immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    // Trigger a search with empty to reset
    onSearch("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + K to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="relative flex items-center">
        {/* Search icon */}
        <span className="absolute left-4 material-symbols-outlined text-on-surface-variant">
          search
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-12 pr-24 py-3.5 bg-surface-container-high border border-outline-variant/30 rounded-full text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
        />

        {/* Loading indicator or clear button */}
        {isLoading ? (
          <div className="absolute right-16 w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-16 w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-lg">
              close
            </span>
          </button>
        ) : null}

        {/* Keyboard shortcut hint */}
        <div className="absolute right-4 hidden md:flex items-center gap-1 pointer-events-none">
          <kbd className="px-2 py-1 text-xs bg-surface-variant rounded border border-outline-variant/30 text-on-surface-variant">
            ⌘K
          </kbd>
        </div>
      </div>
    </form>
  );
}
