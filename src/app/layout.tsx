import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { isAdmin, registerUserEmail } from "@/utils/admin";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LuxeStay | Premium Hotel Booking Platform",
  description: "Experience luxury redefined. Book premium rooms in top-tier hotels and resorts around the world.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  
  // Get active session
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await registerUserEmail(user.email);
  }
  const userIsAdmin = user ? await isAdmin(user.email) : false;

  async function handleSignOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && systemDark)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Sticky Header with Glassmorphism */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-wider text-foreground hover:opacity-90 transition-opacity">
              <span className="text-primary font-serif">L</span>UXE<span className="text-primary font-serif">S</span>TAY
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                Home
              </Link>
              {user && (
                <Link href="/bookings" className="text-sm font-medium hover:text-primary transition-colors">
                  My Bookings
                </Link>
              )}
              {userIsAdmin && (
                <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">
                  Admin Dashboard
                </Link>
              )}
            </nav>

            {/* Auth section */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="hidden sm:inline text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">
                    {user.email}
                  </span>
                  <form action={handleSignOut}>
                    <button
                      type="submit"
                      className="text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground border border-border px-4 py-2 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md"
                    >
                      Sign Out
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="text-xs font-semibold text-foreground hover:text-primary transition-colors px-4 py-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="text-xs font-semibold bg-primary text-primary-foreground hover:opacity-95 px-4 py-2 rounded-lg cursor-pointer transition-all shadow-sm hover:shadow-primary/25"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">{children}</div>

        {/* Premium Footer */}
        <footer className="border-t border-border bg-secondary text-secondary-foreground mt-auto py-12">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <span className="text-xl font-bold tracking-wider">
                <span className="text-primary font-serif">L</span>UXE<span className="text-primary font-serif">S</span>TAY
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Curating the finest stays and luxury escapes for the discerning traveler. Elevate your journey with LuxeStay.
              </p>
            </div>
            
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Quick Links</h4>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
                <li><Link href="/admin" className="hover:text-primary transition-colors">Admin Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Support</h4>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Newsletter</h4>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Subscribe to get exclusive luxury deals and guides.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="bg-background text-foreground text-xs px-3 py-2 rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary w-full"
                />
                <button className="bg-primary text-primary-foreground text-xs px-3 py-2 rounded font-medium hover:opacity-90 transition-opacity cursor-pointer">
                  Join
                </button>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 border-t border-muted mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-muted-foreground">
              © {new Date().getFullYear()} LuxeStay. All rights reserved. Built for luxury.
            </p>
            <div className="flex gap-4 text-[10px] text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Cookies Policy</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
