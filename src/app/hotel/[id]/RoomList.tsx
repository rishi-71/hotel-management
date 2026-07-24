"use client";

import React, { useState } from "react";
import { bookRoom } from "./actions";
import Link from "next/link";

interface Room {
  id: string;
  hotel_id: string;
  type: string;
  capacity: number;
  price_per_night: number;
  image_url?: string;
}

interface RoomListProps {
  rooms: Room[];
  isLoggedIn: boolean;
  hotelId: string;
}

export default function RoomList({ rooms, isLoggedIn, hotelId }: RoomListProps) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculate booking details
  const getBookingDetails = () => {
    if (!checkIn || !checkOut || !selectedRoom) return { nights: 0, total: 0 };
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) return { nights: 0, total: 0 };
    
    return {
      nights,
      total: nights * selectedRoom.price_per_night
    };
  };

  const { nights, total } = getBookingDetails();

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !isLoggedIn) return;

    if (nights <= 0) {
      setError("Check-out date must be after check-in date.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await bookRoom({
        roomId: selectedRoom.id,
        checkIn,
        checkOut,
        totalPrice: total
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setCheckIn("");
        setCheckOut("");
        setTimeout(() => {
          setSelectedRoom(null);
          setSuccess(false);
        }, 3000);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fallbackRoomImages = [
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80"
  ];

  return (
    <div>
      <h2 className="text-2xl font-serif text-foreground mb-8">Available Rooms & Suites</h2>

      {rooms.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/20">
          <p className="text-muted-foreground">No rooms are currently listed for this hotel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {rooms.map((room, index) => {
            const image = room.image_url || fallbackRoomImages[index % fallbackRoomImages.length];
            return (
              <div 
                key={room.id} 
                className="group border border-border bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  <img 
                    src={image} 
                    alt={room.type} 
                    className="object-cover w-full h-full group-hover:scale-103 transition-transform duration-500"
                  />
                  <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-border/30 text-xs font-bold text-primary">
                    ₹{room.price_per_night.toLocaleString()}/night
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-foreground capitalize">{room.type}</h3>
                  
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 mb-6">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Accommodates up to {room.capacity} guests
                  </div>

                  {isLoggedIn ? (
                    <button
                      onClick={() => {
                        setSelectedRoom(room);
                        setError(null);
                        setSuccess(false);
                      }}
                      className="mt-auto w-full bg-secondary text-secondary-foreground text-xs font-semibold py-3 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer shadow-sm"
                    >
                      Book Now
                    </button>
                  ) : (
                    <Link
                      href={`/login?next=/hotel/${hotelId}`}
                      className="mt-auto w-full bg-muted text-muted-foreground text-center text-xs font-semibold py-3 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-md transition-all"
                    >
                      Sign in to Book
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Form Overlay / Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-lg p-8 rounded-2xl border border-border shadow-2xl animate-slide-up relative">
            <button 
              onClick={() => setSelectedRoom(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">Reservation details</span>
              <h3 className="text-xl font-serif text-foreground mt-1 capitalize">Book {selectedRoom.type}</h3>
              <p className="text-xs text-muted-foreground mt-1">₹{selectedRoom.price_per_night.toLocaleString()} per night • Max capacity {selectedRoom.capacity}</p>
            </div>

            {success ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto border border-success/30">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-foreground">Booking Confirmed!</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Your luxury stay reservation has been successfully registered. You can manage your bookings under the dashboard.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-destructive/15 text-destructive border border-destructive/30 rounded-lg text-xs">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="check-in" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      id="check-in"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="check-out" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      id="check-out"
                      required
                      min={checkIn || new Date().toISOString().split("T")[0]}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {nights > 0 && (
                  <div className="p-4 bg-muted rounded-xl border border-border/50 text-xs space-y-2.5">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Rate per night</span>
                      <span>₹{selectedRoom.price_per_night.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total length of stay</span>
                      <span>{nights} {nights === 1 ? "night" : "nights"}</span>
                    </div>
                    <div className="border-t border-border/80 pt-2.5 flex justify-between font-bold text-foreground text-sm">
                      <span>Estimated Total</span>
                      <span className="text-primary">₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRoom(null)}
                    className="flex-1 bg-secondary text-secondary-foreground border border-border py-3 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || nights <= 0}
                    className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg text-xs font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-primary/20"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      "Confirm Reservation"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
