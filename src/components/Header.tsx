"use client";

import React, { useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  user: { email?: string } | null;
  userIsAdmin: boolean;
  dropdownHotels: { id: string; name: string }[];
  signOutAction: () => void;
}

export default function Header({ user, userIsAdmin, dropdownHotels, signOutAction }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex flex-col hover:opacity-90 transition-opacity select-none">
          <span className="text-2xl font-bold tracking-wider text-foreground leading-none">
            <span className="text-primary font-serif">L</span>UXE<span className="text-primary font-serif">S</span>TAY
          </span>
          <span className="text-[9px] font-medium tracking-[0.14em] text-primary uppercase mt-1 leading-none">
            Luxury Stays in Indore
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-4">
          <div className="flex flex-wrap items-center gap-3.5 border-r border-border/60 pr-3.5">
            {dropdownHotels?.map((hotel) => (
              <Link
                key={hotel.id}
                href={`/hotel/${hotel.id}`}
                className="text-[11px] font-bold tracking-wide text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                {hotel.name.replace(" Hotel", "").replace(" Indore", "")}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/bookings" className="text-[11px] font-bold tracking-wide text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
              My Bookings
            </Link>
            {userIsAdmin && (
              <Link href="/admin" className="text-[11px] font-bold tracking-wide text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                Admin
              </Link>
            )}
            <a href="#" className="text-[11px] font-bold tracking-wide text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
              Contact Us
            </a>
          </div>
        </nav>

        {/* Right Section (Theme Toggle + Auth + Hamburger) */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">
                  {user.email}
                </span>
                <button
                  onClick={signOutAction}
                  className="text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground border border-border px-4 py-2 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-xs font-semibold bg-primary text-primary-foreground hover:opacity-95 px-5 py-2.5 rounded-lg cursor-pointer transition-all shadow-sm hover:shadow-primary/25">
                Sign In
              </Link>
            )}
          </div>
 
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border md:hidden flex items-center justify-center cursor-pointer transition-all h-9.5 w-9.5"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card w-full py-6 px-6 space-y-6 shadow-xl animate-slide-up">
          <div className="flex flex-col gap-4">
            {/* Mobile Hotels List */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Our Hotels
              </span>
              <div className="grid grid-cols-1 gap-2.5 pl-2 max-h-40 overflow-y-auto border-l border-border/70 py-1">
                {dropdownHotels.map(hotel => (
                  <Link
                    key={hotel.id}
                    href={`/hotel/${hotel.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs hover:text-primary transition-colors py-1 capitalize font-medium text-foreground"
                  >
                    {hotel.name}
                  </Link>
                ))}
              </div>
            </div>

            <Link 
              href="/bookings" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold hover:text-primary py-1.5 transition-colors border-b border-border/40 pb-2 text-foreground"
            >
              My Bookings
            </Link>

            {userIsAdmin && (
              <Link 
                href="/admin" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold hover:text-primary py-1.5 transition-colors border-b border-border/40 pb-2 text-foreground"
              >
                Admin Dashboard
              </Link>
            )}

            <a 
              href="#" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold hover:text-primary py-1.5 transition-colors border-b border-border/40 pb-2 text-foreground"
            >
              Contact Us
            </a>
          </div>

          {/* Mobile Auth Button Section */}
          <div className="border-t border-border/60 pt-6">
            {user ? (
              <div className="space-y-4">
                <div className="text-xs text-muted-foreground bg-muted px-4 py-2.5 rounded-xl border border-border text-center truncate font-mono">
                  {user.email}
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOutAction();
                  }}
                  className="w-full text-center text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground border border-border py-3 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center text-xs font-semibold bg-primary text-primary-foreground hover:opacity-95 py-3 rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-primary/25"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
