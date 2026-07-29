"use client";

import React, { useState } from "react";
import { bookRoom } from "./actions";

interface Room {
  id: string;
  hotel_id: string;
  type: string;
  capacity: number;
  price_per_night: number;
  image_url?: string;
  features?: unknown;
}

interface RoomListProps {
  rooms: Room[];
  userEmail?: string;
  userName?: string;
}

// Configure a redirect URL after successful stay reservation submission (e.g. "https://example.com/payment" or "/bookings").
// Leave empty string ("") to keep displaying the success message in the modal.
const REDIRECT_URL_AFTER_BOOKING = "";

export default function RoomList({ rooms, userEmail = "", userName = "" }: RoomListProps) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [guestName, setGuestName] = useState(userName);
  const [guestEmail, setGuestEmail] = useState(userEmail);
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
    if (!selectedRoom) return;

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
        guestName,
        guestEmail,
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
        
        if (REDIRECT_URL_AFTER_BOOKING) {
          setTimeout(() => {
            window.location.href = REDIRECT_URL_AFTER_BOOKING;
          }, 1500);
        } else {
          setTimeout(() => {
            setSelectedRoom(null);
            setSuccess(false);
          }, 3000);
        }
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

interface RoomCardProps {
  room: Room;
  fallbackRoomImages: string[];
  onBookNow: (room: Room) => void;
}

function RoomCard({ room, fallbackRoomImages, onBookNow }: RoomCardProps) {
  const [imageIndex, setImageIndex] = useState(0);

  // Parse features safely
  const parseFeatures = (featuresVal: unknown): string[] => {
    if (!featuresVal) return ["Air Conditioning", "High-speed Wi-Fi", "Flat-screen TV", "24/7 Room Service"];
    if (Array.isArray(featuresVal)) return featuresVal;
    if (typeof featuresVal === "string") {
      try {
        const parsed = JSON.parse(featuresVal);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return featuresVal.split(",").map((f: string) => f.trim()).filter(Boolean);
    }
    return ["Air Conditioning", "High-speed Wi-Fi", "Flat-screen TV", "24/7 Room Service"];
  };

  const features = parseFeatures(room.features);

  // Combine room main image with fallback images for the carousel
  const slideImages = [room.image_url, ...fallbackRoomImages].filter(Boolean) as string[];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndex((prev) => (prev - 1 + slideImages.length) % slideImages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndex((prev) => (prev + 1) % slideImages.length);
  };

  return (
    <div className="group border border-border bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row h-auto md:h-72 w-full gap-0">
      {/* Left side: Clickable Image Carousel */}
      <div className="w-full md:w-[42%] h-56 md:h-full relative overflow-hidden bg-muted select-none group/carousel shrink-0">
        <img
          src={slideImages[imageIndex]}
          alt={room.type}
          onClick={() => setImageIndex((prev) => (prev + 1) % slideImages.length)}
          className="object-cover w-full h-full cursor-pointer transition-all duration-500 hover:scale-[1.02]"
        />
        
        {/* Navigation arrows (shown on hover on desktop) */}
        {slideImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/85 border border-border text-foreground hover:bg-primary hover:text-primary-foreground transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer shadow-md z-10"
              aria-label="Previous image"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/85 border border-border text-foreground hover:bg-primary hover:text-primary-foreground transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer shadow-md z-10"
              aria-label="Next image"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Pricing tag */}
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-border/30 text-xs font-bold text-primary shadow-sm">
          ₹{room.price_per_night.toLocaleString()}/night
        </div>

        {/* Carousel indicators (dots) */}
        {slideImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {slideImages.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setImageIndex(i);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${i === imageIndex ? "bg-primary w-3.5" : "bg-white/50"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right side: Room details and Features */}
      <div className="p-6 md:p-8 flex flex-col justify-between flex-1 bg-card">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-foreground capitalize leading-none">{room.type}</h3>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Accommodates up to {room.capacity} {room.capacity === 1 ? "guest" : "guests"}
          </div>

          {/* Features list */}
          <div className="pt-2">
            <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Room Features</span>
            <div className="flex flex-wrap gap-1.5">
              {features.map((feature, i) => (
                <span 
                  key={i} 
                  className="text-[10px] bg-primary/5 text-primary border border-primary/10 px-2.5 py-1 rounded-lg font-medium capitalize"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 md:pt-0">
          <button
            onClick={() => onBookNow(room)}
            className="w-full bg-secondary text-secondary-foreground text-xs font-semibold py-3 rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer shadow-sm active:scale-[0.98] duration-200"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

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
        <div className="grid grid-cols-1 gap-8">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              fallbackRoomImages={fallbackRoomImages}
              onBookNow={(r) => {
                setSelectedRoom(r);
                setError(null);
                setSuccess(false);
                // Pre-fill name and email on click
                if (!guestName && userName) setGuestName(userName);
                if (!guestEmail && userEmail) setGuestEmail(userEmail);
              }}
            />
          ))}
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

                {/* Guest Contact Details */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="guest-name" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="guest-name"
                      required
                      placeholder="e.g. John Doe"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="guest-email" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="guest-email"
                      required
                      placeholder="e.g. john@example.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Stay Dates */}
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
