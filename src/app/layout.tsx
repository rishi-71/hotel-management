import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { isAdmin, registerUserEmail, getCachedHotelsList } from "@/utils/admin";

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
    // Register user email in the background without blocking render
    registerUserEmail(user.email).catch(console.error);
  }

  // Parallelize authentication role checking and cache-retrieval for instant load times (0ms queries)
  const [userIsAdmin, dropdownHotels] = await Promise.all([
    user ? isAdmin(user.email) : Promise.resolve(false),
    getCachedHotelsList()
  ]);

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
        {/* Sticky Header with responsive Client-side rendering */}
        <Header 
          user={user} 
          userIsAdmin={userIsAdmin} 
          dropdownHotels={dropdownHotels || []} 
          signOutAction={handleSignOut} 
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">{children}</div>

        {/* Premium Footer */}
        <footer className="border-t border-border bg-secondary text-secondary-foreground mt-auto py-12">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4 md:col-span-2">
              <span className="text-xl font-bold tracking-wider">
                <span className="text-primary font-serif">L</span>UXE<span className="text-primary font-serif">S</span>TAY
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
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
