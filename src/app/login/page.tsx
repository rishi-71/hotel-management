"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRedirect = searchParams.get("next") || "/";

  useEffect(() => {
    // If user is already logged in, redirect them
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push(nextRedirect);
        router.refresh();
      }
    };
    checkUser();
  }, [router, supabase, nextRedirect]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ type: "success", text: "Logged in successfully! Redirecting..." });
        setTimeout(() => {
          router.push(nextRedirect);
          router.refresh();
        }, 1000);
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
          <h2 className="text-xl font-semibold mt-4 text-foreground">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage your luxury experience</p>
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

        <form onSubmit={handleLogin} className="space-y-5">
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
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Password
              </label>
            </div>
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
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground border-t border-border pt-6">
          New to LuxeStay?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline transition-all">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
