import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, promoteToAdmin, demoteFromAdmin, getSystemConfig } from "@/utils/admin";

interface AdminDashboardProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function AdminDashboard({ searchParams }: AdminDashboardProps) {
  const { tab = "hotels" } = await searchParams;
  const supabase = await createClient();

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/admin");
  }

  // Authorize Admin role
  const userIsAdmin = await isAdmin(user.email);
  if (!userIsAdmin) {
    redirect("/");
  }

  const isSuperAdmin = user.email === "admin@gmail.com";

  // Server actions
  async function addHotel(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const name = formData.get("name") as string;
    const location = formData.get("location") as string;
    const description = formData.get("description") as string;
    const image_url = formData.get("image_url") as string;

    const { error } = await supabase.from("hotels").insert([
      { name, location, description, image_url }
    ]);

    if (error) {
      console.error("Error adding hotel: ", error);
      return;
    }
    revalidatePath("/admin");
  }

  async function deleteHotel(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const hotelId = formData.get("hotelId") as string;

    // Get rooms of this hotel
    const { data: roomsToDelete } = await supabase.from("rooms").select("id").eq("hotel_id", hotelId);
    if (roomsToDelete && roomsToDelete.length > 0) {
      const roomIds = roomsToDelete.map(r => r.id);
      // Delete bookings of these rooms first to satisfy foreign key constraint
      await supabase.from("bookings").delete().in("room_id", roomIds);
      // Delete rooms of this hotel
      await supabase.from("rooms").delete().in("id", roomIds);
    }

    const { error } = await supabase.from("hotels").delete().eq("id", hotelId);
    if (error) {
      console.error("Error deleting hotel: ", error);
      return;
    }
    revalidatePath("/admin");
  }

  async function addRoom(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const hotel_id = formData.get("hotel_id") as string;
    const type = formData.get("type") as string;
    const capacity = Number(formData.get("capacity"));
    const price_per_night = Number(formData.get("price_per_night"));
    const image_url = formData.get("image_url") as string;

    const { error } = await supabase.from("rooms").insert([
      { hotel_id, type, title: type, capacity, price_per_night, image_url }
    ]);

    if (error) {
      console.error("Error adding room: ", error);
      return;
    }
    revalidatePath("/admin");
  }

  async function deleteRoom(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const roomId = formData.get("roomId") as string;

    // Delete bookings of this room first to satisfy foreign key constraint
    await supabase.from("bookings").delete().eq("room_id", roomId);

    const { error } = await supabase.from("rooms").delete().eq("id", roomId);
    if (error) {
      console.error("Error deleting room: ", error);
      return;
    }
    revalidatePath("/admin");
  }

  async function cancelBooking(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const bookingId = formData.get("bookingId") as string;

    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (error) {
      console.error("Error cancelling booking: ", error);
      return;
    }
    revalidatePath("/admin");
  }

  async function deleteBooking(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const bookingId = formData.get("bookingId") as string;

    const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
    if (error) {
      console.error("Error deleting booking: ", error);
      return;
    }
    revalidatePath("/admin");
  }

  async function approveBooking(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const bookingId = formData.get("bookingId") as string;

    const { error } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    if (error) {
      console.error("Error approving booking: ", error);
      return;
    }
    revalidatePath("/admin");
  }

  async function rejectBooking(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const bookingId = formData.get("bookingId") as string;

    const { error } = await supabase
      .from("bookings")
      .update({ status: "rejected" })
      .eq("id", bookingId);

    if (error) {
      console.error("Error rejecting booking: ", error);
      return;
    }
    revalidatePath("/admin");
  }

  async function promoteAction(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    if (email) {
      await promoteToAdmin(email);
    }
    revalidatePath("/admin");
  }

  async function demoteAction(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    if (email) {
      await demoteFromAdmin(email);
    }
    revalidatePath("/admin");
  }

  // Fetch data, excluding system config record
  const { data: hotels } = await supabase
    .from("hotels")
    .select("*")
    .neq("name", "__SYSTEM_CONFIG__")
    .order("created_at", { ascending: false });
  
  const { data: rooms } = await supabase
    .from("rooms")
    .select("*, hotels(name)");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, rooms(type, hotels(name))");

  // Fetch system config data if super admin to manage roles
  const configData = isSuperAdmin ? await getSystemConfig() : { admins: [], users: [] };
  // Ensure default admin is always listed, and create a unique user email list
  const allUsersList = isSuperAdmin 
    ? Array.from(new Set(["admin@gmail.com", ...configData.users])) 
    : [];
  const adminSet = new Set(["admin@gmail.com", ...configData.admins]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-6 mb-8 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-primary font-bold">Workspace dashboard</span>
          <h1 className="text-3xl font-serif text-foreground mt-1">Admin Control Center</h1>
        </div>
        <div className="text-xs text-muted-foreground bg-muted px-4 py-2 rounded-lg border border-border">
          Active Operator: <span className="font-semibold text-foreground">{user.email}</span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border mb-8 gap-1.5 overflow-x-auto pb-1">
        <Link
          href="/admin?tab=hotels"
          className={`px-5 py-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
            tab === "hotels"
              ? "bg-primary text-primary-foreground shadow"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Manage Hotels ({hotels?.length || 0})
        </Link>
        <Link
          href="/admin?tab=rooms"
          className={`px-5 py-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
            tab === "rooms"
              ? "bg-primary text-primary-foreground shadow"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Manage Rooms ({rooms?.length || 0})
        </Link>
        <Link
          href="/admin?tab=bookings"
          className={`px-5 py-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
            tab === "bookings"
              ? "bg-primary text-primary-foreground shadow"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Manage Bookings ({bookings?.length || 0})
        </Link>
        {isSuperAdmin && (
          <Link
            href="/admin?tab=users"
            className={`px-5 py-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
              tab === "users"
                ? "bg-primary text-primary-foreground shadow"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Manage Users ({allUsersList.length})
          </Link>
        )}
      </div>

      {/* TAB 1: MANAGE HOTELS */}
      {tab === "hotels" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Add Hotel Form */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm h-fit">
            <h2 className="text-lg font-serif text-foreground mb-6">Register Luxury Hotel</h2>
            <form action={addHotel} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Hotel Name</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  placeholder="e.g., Grand Plaza Resort"
                  className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  required
                  placeholder="e.g., Indore, Madhya Pradesh"
                  className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Description</label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  placeholder="Tell us about this luxury stay..."
                  className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
                />
              </div>

              <div>
                <label htmlFor="image_url" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Image URL (Optional)</label>
                <input
                  type="url"
                  name="image_url"
                  id="image_url"
                  placeholder="https://example.com/photo.jpg"
                  className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg text-xs font-semibold hover:opacity-95 transition-opacity cursor-pointer shadow-sm hover:shadow-primary/20"
              >
                Save Hotel
              </button>
            </form>
          </div>

          {/* Hotels List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-serif text-foreground mb-6 font-semibold">Registered Estates</h2>
            {hotels?.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-muted/20">
                <p className="text-muted-foreground text-xs">No hotels registered yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {hotels?.map((hotel) => (
                  <div
                    key={hotel.id}
                    className="p-5 border border-border rounded-xl bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all duration-300"
                  >
                    <div>
                      <h3 className="font-bold text-foreground capitalize">{hotel.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-primary inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {hotel.location}
                      </p>
                      {hotel.description && (
                        <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2 italic max-w-lg">
                          &ldquo;{hotel.description}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2.5 self-end sm:self-auto">
                      <Link
                        href={`/hotel/${hotel.id}`}
                        className="text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary px-3.5 py-2 rounded-lg transition-all"
                      >
                        View Public
                      </Link>
                      <form action={deleteHotel}>
                        <input type="hidden" name="hotelId" value={hotel.id} />
                        <button
                          type="submit"
                          className="text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-primary-foreground hover:border-destructive px-3.5 py-2 rounded-lg transition-all cursor-pointer"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE ROOMS */}
      {tab === "rooms" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Add Room Form */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm h-fit">
            <h2 className="text-lg font-serif text-foreground mb-6">List New Suite / Room</h2>
            <form action={addRoom} className="space-y-4">
              <div>
                <label htmlFor="hotel_id" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Link to Hotel</label>
                <select
                  name="hotel_id"
                  id="hotel_id"
                  required
                  className="w-full border border-border rounded-lg px-3.5 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">Select an estate...</option>
                  {hotels?.map((hotel) => (
                    <option key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="type" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Room Type</label>
                <input
                  type="text"
                  name="type"
                  id="type"
                  required
                  placeholder="e.g., Luxury King Suite"
                  className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="capacity" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Capacity (Guests)</label>
                  <input
                    type="number"
                    name="capacity"
                    id="capacity"
                    required
                    min={1}
                    placeholder="e.g., 2"
                    className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
                  />
                </div>

                <div>
                  <label htmlFor="price_per_night" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Price/Night (₹)</label>
                  <input
                    type="number"
                    name="price_per_night"
                    id="price_per_night"
                    required
                    min={0}
                    placeholder="e.g., 5500"
                    className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="room_image_url" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Image URL (Optional)</label>
                <input
                  type="url"
                  name="image_url"
                  id="room_image_url"
                  placeholder="https://example.com/room.jpg"
                  className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
                />
              </div>

              <button
                type="submit"
                disabled={hotels?.length === 0}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg text-xs font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-primary/20"
              >
                Save Room
              </button>
            </form>
          </div>

          {/* Rooms List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-serif text-foreground mb-6 font-semibold">Listed Suites & Rooms</h2>
            {rooms?.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-muted/20">
                <p className="text-muted-foreground text-xs">No rooms listed yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rooms?.map((room) => (
                  <div
                    key={room.id}
                    className="p-5 border border-border rounded-xl bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground capitalize">{room.type}</h3>
                        <span className="text-[9px] uppercase tracking-wide text-primary font-bold bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                          {(room.hotels as { name: string } | null)?.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Capacity: {room.capacity} guests
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Rate: ₹{room.price_per_night.toLocaleString()}/night
                        </span>
                      </p>
                    </div>

                    <form action={deleteRoom} className="self-end sm:self-auto">
                      <input type="hidden" name="roomId" value={room.id} />
                      <button
                        type="submit"
                        className="text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-primary-foreground hover:border-destructive px-3.5 py-2 rounded-lg transition-all cursor-pointer"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE BOOKINGS */}
      {tab === "bookings" && (
        <div>
          <h2 className="text-lg font-serif text-foreground mb-6 font-semibold">All Guest Reservations</h2>
          {bookings?.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-muted/20">
              <p className="text-muted-foreground text-xs">No reservations have been placed yet.</p>
            </div>
          ) : (
            <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-muted border-b border-border uppercase font-semibold text-muted-foreground tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Guest Reference</th>
                      <th className="px-6 py-4">Hotel / Room</th>
                      <th className="px-6 py-4">Stay Dates</th>
                      <th className="px-6 py-4">Bill Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground">
                    {bookings?.map((booking) => (
                      <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-[10px] text-muted-foreground">
                          {booking.user_id ? `${booking.user_id.slice(0, 8)}...` : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold capitalize">
                            {(booking.rooms as { hotels: { name: string } | null } | null)?.hotels?.name || "Unknown"}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                            {(booking.rooms as { type: string } | null)?.type || "Unknown Room"}
                          </div>
                        </td>
                        <td className="px-6 py-4 space-y-0.5">
                          <div className="font-medium">{new Date(booking.check_in).toLocaleDateString()}</div>
                          <div className="text-[10px] text-muted-foreground">to {new Date(booking.check_out).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-primary">
                          ₹{booking.total_price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase border tracking-wider ${
                              booking.status === "confirmed"
                                ? "bg-success/15 border-success/30 text-success"
                                : booking.status === "pending"
                                ? "bg-primary/15 border-primary/30 text-primary"
                                : "bg-destructive/15 border-destructive/30 text-destructive"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {booking.status === "pending" && (
                              <>
                                <form action={approveBooking} className="inline-block">
                                  <input type="hidden" name="bookingId" value={booking.id} />
                                  <button
                                    type="submit"
                                    className="text-[10px] font-semibold bg-success/10 text-success border border-success/20 hover:bg-success hover:text-primary-foreground hover:border-success px-3.5 py-1.5 rounded-lg cursor-pointer transition-all"
                                  >
                                    Approve
                                  </button>
                                </form>
                                <form action={rejectBooking} className="inline-block">
                                  <input type="hidden" name="bookingId" value={booking.id} />
                                  <button
                                    type="submit"
                                    className="text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-primary-foreground hover:border-destructive px-3.5 py-1.5 rounded-lg cursor-pointer transition-all"
                                  >
                                    Reject
                                  </button>
                                </form>
                              </>
                            )}
                            {booking.status === "confirmed" && (
                              <form action={cancelBooking} className="inline-block">
                                <input type="hidden" name="bookingId" value={booking.id} />
                                <button
                                  type="submit"
                                  className="text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-primary-foreground hover:border-destructive px-3.5 py-1.5 rounded-lg cursor-pointer transition-all"
                                >
                                  Cancel
                                </button>
                              </form>
                            )}
                            <form action={deleteBooking} className="inline-block">
                              <input type="hidden" name="bookingId" value={booking.id} />
                              <button
                                type="submit"
                                className="text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border hover:bg-destructive hover:text-primary-foreground hover:border-destructive px-3.5 py-1.5 rounded-lg cursor-pointer transition-all"
                              >
                                Delete
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MANAGE USERS */}
      {tab === "users" && isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Promote Admin Form */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm h-fit">
            <h2 className="text-lg font-serif text-foreground mb-6">Promote User to Admin</h2>
            <p className="text-[11px] text-muted-foreground mb-4">
              Enter any registered user&apos;s email address to immediately grant them administrative access.
            </p>
            <form action={promoteAction} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">User Email Address</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  placeholder="e.g., guest@example.com"
                  className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg text-xs font-semibold hover:opacity-95 transition-opacity cursor-pointer shadow-sm hover:shadow-primary/20"
              >
                Promote to Admin
              </button>
            </form>
          </div>

          {/* Users List with Role Toggle Buttons */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-serif text-foreground mb-6 font-semibold">User Role Directory</h2>
            
            <div className="space-y-4">
              {allUsersList.map((userEmail) => {
                const isUserAdmin = adminSet.has(userEmail);
                const isDefaultAdmin = userEmail === "admin@gmail.com";

                return (
                  <div
                    key={userEmail}
                    className="p-5 border border-border rounded-xl bg-card flex justify-between items-center hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h3 className="font-bold text-foreground">{userEmail}</h3>
                      <span 
                        className={`text-[8px] uppercase tracking-wider font-bold border px-2.5 py-0.5 rounded-full mt-1.5 inline-block ${
                          isDefaultAdmin
                            ? "bg-primary/25 border-primary/45 text-primary"
                            : isUserAdmin
                              ? "bg-success/15 border-success/35 text-success"
                              : "bg-muted border-border text-muted-foreground"
                        }`}
                      >
                        {isDefaultAdmin ? "Default Super Admin" : isUserAdmin ? "Administrator" : "Guest User"}
                      </span>
                    </div>

                    {!isDefaultAdmin ? (
                      <form action={isUserAdmin ? demoteAction : promoteAction}>
                        <input type="hidden" name="email" value={userEmail} />
                        <button
                          type="submit"
                          className={`text-[10px] font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer border ${
                            isUserAdmin
                              ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive hover:text-primary-foreground hover:border-destructive"
                              : "bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                          }`}
                        >
                          {isUserAdmin ? "Revoke Admin Status" : "Promote to Admin"}
                        </button>
                      </form>
                    ) : (
                      <span className="text-[10px] font-semibold text-muted-foreground italic mr-2">Protected</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}