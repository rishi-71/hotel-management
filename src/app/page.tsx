import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";

interface HomeProps {
  searchParams: Promise<{
    location?: string;
    guests?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { location, guests } = await searchParams;
  const supabase = await createClient();

  // Build Supabase query, excluding system config record
  let query = supabase.from("hotels").select("*").neq("name", "__SYSTEM_CONFIG__");

  if (location) {
    query = query.ilike("location", `%${location}%`);
  }

  const { data: hotels } = await query.order("created_at", { ascending: false });

  // Filter hotels by room capacity if guest count is specified
  let filteredHotels = hotels || [];
  if (guests && !isNaN(Number(guests)) && filteredHotels.length > 0) {
    const guestCount = Number(guests);
    // Fetch rooms that can accommodate the guests
    const { data: rooms } = await supabase
      .from("rooms")
      .select("hotel_id, capacity")
      .gte("capacity", guestCount);
      
    if (rooms) {
      const hotelIdsWithCapacity = new Set(rooms.map(r => r.hotel_id));
      filteredHotels = filteredHotels.filter(hotel => hotelIdsWithCapacity.has(hotel.id));
    }
  }

  // Premium Unsplash images for hotels if they don't have one
  const fallbackImages = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", // Premium Palace
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80", // Modern Luxury
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80", // Resort Pool
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80"  // Beach Villa
  ];

  return (
    <main className="flex-1">
      {/* Hero Carousel Section */}
      <HeroCarousel hotels={hotels || []} />

      {/* Featured Hotels Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-bold">Curated escapes</span>
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mt-2">Featured Destinations</h2>
          </div>
          {(location || guests) && (
            <Link href="/" className="text-sm font-semibold text-primary hover:underline mt-4 md:mt-0 flex items-center gap-1">
              Clear filters
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          )}
        </div>

        {filteredHotels.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/20">
            <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-foreground">No hotels found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              We couldn&apos;t find any stays matching your criteria. Try adjusting your search filters or check back later.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link href="/admin" className="text-xs font-semibold bg-primary text-primary-foreground px-4 py-2.5 rounded-lg hover:opacity-90 shadow">
                Add a Hotel (Admin)
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHotels.map((hotel, index) => {
              const image = hotel.image_url || fallbackImages[index % fallbackImages.length];
              return (
                <Link 
                  key={hotel.id} 
                  href={`/hotel/${hotel.id}`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:translate-y-[-4px]"
                >
                  {/* Image wrapper */}
                  <div className="relative h-64 w-full overflow-hidden bg-muted">
                    <img 
                      src={image} 
                      alt={hotel.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full border border-border/30 text-xs font-bold text-primary flex items-center gap-1">
                      <svg className="w-3 h-3 fill-current text-primary" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      4.8
                    </div>
                  </div>
 
                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{hotel.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {hotel.location}
                      </div>
                    </div>
 
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-6">
                      {hotel.description || "Indulge in a premium stay characterized by elegant design, world-class amenities, and top-tier guest services."}
                    </p>
 
                    <div 
                      className="mt-auto w-full bg-secondary text-secondary-foreground text-center py-3 rounded-lg font-semibold text-xs border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all shadow-sm flex items-center justify-center gap-1"
                    >
                      View Rooms
                      <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Brand Highlights Section */}
      <section className="bg-secondary text-secondary-foreground py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-primary/10 border border-primary/25 rounded-full flex items-center justify-center mx-auto text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-serif">Curated Stays Only</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Every hotel and resort on our platform passes rigorous checks for quality, service, and design.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-primary/10 border border-primary/25 rounded-full flex items-center justify-center mx-auto text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16V5" />
              </svg>
            </div>
            <h3 className="text-lg font-serif">Best Price Guarantee</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Enjoy luxury without the premium markups. We guarantee the best available rates for all bookings.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-primary/10 border border-primary/25 rounded-full flex items-center justify-center mx-auto text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-serif">24/7 Dedicated Concierge</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              From room upgrade queries to local tour planning, our expert team is on-call to help you anytime.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}