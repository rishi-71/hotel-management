import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function UserBookingsPage() {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/bookings");
  }

  // Fetch bookings for the logged-in user using their email address
  const { data: bookings } = await supabase
    .from("booking_records")
    .select("*, rooms(*, hotels(*))")
    .eq("guest_email", user.email);

  // Cancel booking action
  async function cancelUserBooking(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const bookingId = formData.get("bookingId") as string;

    const { error } = await supabase
      .from("booking_records")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (error) {
      console.error("Failed to cancel booking:", error);
      return;
    }
    revalidatePath("/bookings");
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 flex-1 w-full animate-fade-in">
      <div className="border-b border-border pb-6 mb-10">
        <span className="text-xs uppercase tracking-widest text-primary font-bold">Your Account</span>
        <h1 className="text-3xl md:text-4xl font-serif text-foreground mt-1">My Reservations</h1>
        <p className="text-xs text-muted-foreground mt-1.5">View and manage your upcoming stays and history at LuxeStay.</p>
      </div>

      {bookings?.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/20">
          <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-foreground">No reservations yet</h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            You haven&apos;t booked any stays on LuxeStay. Explore our luxury destinations to make your first booking!
          </p>
          <div className="mt-6">
            <Link href="/" className="text-xs font-semibold bg-primary text-primary-foreground px-5 py-3 rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-primary/20">
              Browse Hotels
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings?.map((booking) => {
            const room = booking.rooms as { type: string; hotels: { name: string; location: string } | null } | null;
            const hotel = room?.hotels;
            
            // Calculate nights
            const checkInDate = new Date(booking.check_in);
            const checkOutDate = new Date(booking.check_out);
            const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

            return (
              <div 
                key={booking.id} 
                className="border border-border bg-card rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
              >
                {/* Status indicator bar */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    booking.status === "confirmed" 
                      ? "bg-success" 
                      : booking.status === "pending" 
                        ? "bg-primary" 
                        : "bg-destructive/70"
                  }`} 
                />

                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span 
                      className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        booking.status === "confirmed" 
                          ? "bg-success/15 border-success/30 text-success" 
                          : booking.status === "pending" 
                            ? "bg-primary/15 border-primary/30 text-primary" 
                            : "bg-destructive/15 border-destructive/30 text-destructive"
                      }`}
                    >
                      {booking.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Ref: #{booking.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground capitalize">{hotel?.name || "Premium Retreat"}</h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {hotel?.location || "India"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/60">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Room Selected</span>
                      <span className="text-xs font-semibold text-foreground capitalize">{room?.type || "Suite"}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Check-in</span>
                      <span className="text-xs font-semibold text-foreground">{checkInDate.toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Check-out</span>
                      <span className="text-xs font-semibold text-foreground">{checkOutDate.toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Length of Stay</span>
                      <span className="text-xs font-semibold text-foreground">{nights} {nights === 1 ? "Night" : "Nights"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between items-start md:items-end border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 gap-4 min-w-[150px]">
                  <div className="md:text-right">
                    <span className="block text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Total Bill</span>
                    <span className="text-2xl font-bold text-primary font-serif">₹{booking.total_price.toLocaleString()}</span>
                    <span className="block text-[9px] text-muted-foreground mt-0.5">Includes taxes & service fees</span>
                  </div>

                  {(booking.status === "pending" || booking.status === "confirmed") && (
                    <form action={cancelUserBooking} className="w-full">
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <button
                        type="submit"
                        className="w-full text-center bg-secondary text-secondary-foreground hover:bg-destructive hover:text-primary-foreground hover:border-destructive border border-border py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
                      >
                        Cancel Stay
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
