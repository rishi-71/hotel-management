"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "Registration successful! Please check your email for the confirmation link to complete your sign-up.",
        });
        setEmail("");
        setPassword("");
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-xl animate-slide-up">
        {/* Brand Logo & Name */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center hover:opacity-90 transition-opacity select-none">
            <span className="text-2xl font-bold tracking-wider text-foreground leading-none">
              <span className="text-primary font-serif">L</span>UXE<span className="text-primary font-serif">S</span>TAY
            </span>
            <span className="text-[9px] font-medium tracking-[0.14em] text-primary uppercase mt-1 leading-none">
              Luxury Stays in Indore
            </span>
          </Link>
          <h2 className="text-xl font-semibold mt-4 text-foreground">Create your account</h2>
          <p className="text-sm text-muted-foreground mt-1">Begin your luxury stay experience</p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg mb-6 text-sm ${
              message.type === "success"
                ? "bg-success/15 text-success border border-success/30"
                : "bg-destructive/15 text-destructive border border-destructive/30"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/50"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-55 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-primary/20"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground border-t border-border pt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline transition-all">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
