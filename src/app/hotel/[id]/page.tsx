import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import RoomList from "./RoomList";

interface HotelPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HotelPage({ params }: HotelPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch hotel details
  const { data: hotel, error: hotelErr } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", id)
    .single();

  if (hotelErr || !hotel) {
    return notFound();
  }

  // Fetch rooms for this hotel
  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .eq("hotel_id", id)
    .order("price_per_night", { ascending: true });

  // Check auth session
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const fallbackBanner = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80";

  return (
    <main className="flex-1 pb-24 bg-background text-foreground">
      {/* Hotel Hero Banner */}
      <section className="relative h-[45vh] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${hotel.image_url || fallbackBanner}')` }}
        />
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 h-full flex flex-col justify-end pb-10 text-white">
          <Link 
            href="/" 
            className="mb-auto mt-6 inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors bg-black/35 backdrop-blur-md px-3.5 py-2 rounded-lg border border-white/10 self-start"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Back to destinations
          </Link>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/20 border border-primary/30 px-3 py-1 rounded-full backdrop-blur-sm">
                Luxury Stay
              </span>
              <div className="flex items-center gap-1 bg-black/45 border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold text-yellow-500">
                ★ 4.8 Excellent
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif tracking-tight font-medium">{hotel.name}</h1>
            <div className="flex items-center gap-1.5 text-xs text-white/85">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {hotel.location}
            </div>
          </div>
        </div>
      </section>

      {/* Hotel Content */}
      <section className="max-w-5xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left 2 cols: Rooms List & Description */}
        <div className="lg:col-span-2 space-y-12">
          {/* Description Block */}
          <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
            <h2 className="text-xl font-serif text-foreground mb-4">About this retreat</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {hotel.description || "Welcome to a world of absolute refinement. Immerse yourself in the local heritage and enjoy exquisite services. Our retreat provides the perfect destination for both luxury leisure and business travel, combining classic hospitality with modern conveniences."}
            </p>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs">✓</div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">24/7 Room Service</h4>
                  <p className="text-[10px] text-muted-foreground">Always at your service</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs">✓</div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Free Ultra Wifi</h4>
                  <p className="text-[10px] text-muted-foreground">Stay connected in style</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs">✓</div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Wellness Center</h4>
                  <p className="text-[10px] text-muted-foreground">Pool, Gym & Spa</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs">✓</div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Fine Dining</h4>
                  <p className="text-[10px] text-muted-foreground">Top chefs at request</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rooms List Client component */}
          <RoomList rooms={rooms || []} isLoggedIn={isLoggedIn} hotelId={id} />
        </div>

        {/* Right col: Contact / Booking Summary Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Retreat Location</h3>
            <div className="h-44 w-full bg-muted rounded-xl relative overflow-hidden flex items-center justify-center text-xs text-muted-foreground">
              {/* A representation of map */}
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=400&q=80')" }} />
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10 bg-background/95 border border-border p-3.5 rounded-lg text-center shadow">
                <span className="font-bold text-foreground text-xs">{hotel.name}</span>
                <p className="text-[9px] text-muted-foreground mt-0.5">{hotel.location}</p>
              </div>
            </div>
            
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{hotel.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>concierge@luxestay.com</span>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl text-xs space-y-3">
            <h4 className="font-bold text-primary text-sm">Exclusive Member Rate</h4>
            <p className="text-muted-foreground leading-relaxed">
              Sign up or log in to get access to custom discounts, late check-out privileges, and free breakfast during your stay.
            </p>
            {!isLoggedIn && (
              <Link 
                href="/signup" 
                className="block text-center bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-95 shadow-sm transition-all"
              >
                Join Now
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
