"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface NavbarDropdownProps {
  hotels: { id: string; name: string }[];
}

export default function NavbarDropdown({ hotels }: NavbarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1 cursor-pointer py-2 focus:outline-none text-foreground"
      >
        Indore&apos;s Top Hotels
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : "text-muted-foreground"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-xl z-50 py-2 animate-slide-up">
          {hotels.length === 0 ? (
            <div className="px-4 py-2.5 text-xs text-muted-foreground">No hotels available</div>
          ) : (
            hotels.map((hotel) => (
              <Link
                key={hotel.id}
                href={`/hotel/${hotel.id}`}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2.5 text-xs hover:bg-muted text-foreground hover:text-primary transition-colors font-medium capitalize"
              >
                {hotel.name}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
