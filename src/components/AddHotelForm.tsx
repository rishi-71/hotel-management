"use client";

import React, { useState } from "react";
import ImageUploader from "./ImageUploader";

interface AddHotelFormProps {
  addHotelAction: (formData: FormData) => Promise<void>;
}

export default function AddHotelForm({ addHotelAction }: AddHotelFormProps) {
  const [hotelName, setHotelName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelName.trim() || !location.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", hotelName);
      formData.append("location", location);
      formData.append("description", description);
      formData.append("image_url", imageUrl);
      
      await addHotelAction(formData);
      
      // Reset form
      setHotelName("");
      setLocation("");
      setDescription("");
      setImageUrl("");
    } catch (err) {
      console.error("Failed to add hotel:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Hotel Name</label>
        <input
          type="text"
          id="name"
          required
          placeholder="e.g., Grand Plaza Resort"
          value={hotelName}
          onChange={(e) => setHotelName(e.target.value)}
          className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Location</label>
        <input
          type="text"
          id="location"
          required
          placeholder="e.g., Indore, Madhya Pradesh"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Description</label>
        <textarea
          id="description"
          rows={3}
          placeholder="Tell us about this luxury stay..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Hotel Image</label>
        <input
          type="text"
          placeholder="Paste image URL directly or upload below..."
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/45"
        />

        <ImageUploader
          folder="hotels"
          entityName={hotelName || "hotel"}
          onUploadComplete={(url) => setImageUrl(url)}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-primary-foreground text-xs font-bold py-3 rounded-lg hover:opacity-90 transition-all cursor-pointer shadow shadow-primary/20 flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-primary-foreground/35 border-t-primary-foreground rounded-full animate-spin" />
            Creating Hotel...
          </>
        ) : (
          "Add Hotel"
        )}
      </button>
    </form>
  );
}
