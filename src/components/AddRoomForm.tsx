"use client";

import React, { useState } from "react";
import ImageUploader from "./ImageUploader";

interface Hotel {
  id: string;
  name: string;
}

interface AddRoomFormProps {
  hotels: Hotel[];
  addRoomAction: (formData: FormData) => Promise<void>;
}

export default function AddRoomForm({ hotels, addRoomAction }: AddRoomFormProps) {
  const [hotelId, setHotelId] = useState("");
  const [roomType, setRoomType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedHotelName = hotels.find((h) => h.id === hotelId)?.name || "hotel";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !roomType.trim() || !capacity || !price) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("hotel_id", hotelId);
      formData.append("type", roomType);
      formData.append("capacity", capacity);
      formData.append("price_per_night", price);
      formData.append("image_url", imageUrl);

      await addRoomAction(formData);

      // Reset form
      setHotelId("");
      setRoomType("");
      setCapacity("");
      setPrice("");
      setImageUrl("");
    } catch (err) {
      console.error("Failed to add room:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="hotel_id" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
          Link to Hotel
        </label>
        <select
          id="hotel_id"
          required
          value={hotelId}
          onChange={(e) => setHotelId(e.target.value)}
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
        <label htmlFor="type" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
          Room Type
        </label>
        <input
          type="text"
          id="type"
          required
          placeholder="e.g., Luxury King Suite"
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="capacity" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
            Capacity (Guests)
          </label>
          <input
            type="number"
            id="capacity"
            required
            min={1}
            placeholder="e.g., 2"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
          />
        </div>

        <div>
          <label htmlFor="price_per_night" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
            Price/Night (₹)
          </label>
          <input
            type="number"
            id="price_per_night"
            required
            min={0}
            placeholder="e.g., 5500"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Room Image</label>
        <input
          type="text"
          placeholder="Paste image URL directly or upload below..."
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
        />
        
        <ImageUploader
          folder="rooms"
          entityName={`${selectedHotelName}-${roomType || "room"}`}
          onUploadComplete={(url) => setImageUrl(url)}
        />
      </div>

      <button
        type="submit"
        disabled={hotels?.length === 0 || isSubmitting}
        className="w-full bg-primary text-primary-foreground py-3 rounded-lg text-xs font-semibold hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-primary/20 flex items-center justify-center gap-1.5"
      >
        {isSubmitting ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-primary-foreground/35 border-t-primary-foreground rounded-full animate-spin" />
            Saving Room...
          </>
        ) : (
          "Save Room"
        )}
      </button>
    </form>
  );
}
