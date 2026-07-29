"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface Hotel {
  id: string;
  name: string;
  location: string;
  description: string | null;
  image_url: string | null;
}

interface HeroCarouselProps {
  hotels: Hotel[];
  initialLocation?: string;
  initialGuests?: string;
}

const fallbackImages = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1920&q=80"
];

export default function HeroCarousel({ hotels, initialLocation = "", initialGuests = "" }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter out system config record if passed
  const activeHotels = hotels.filter(h => h.name !== "__SYSTEM_CONFIG__");

  // Fallback to static slides if no hotels exist
  const displaySlides = activeHotels.length > 0 ? activeHotels : [
    {
      id: "fallback-1",
      name: "Experience Comfort, Redefined",
      location: "LuxeStay Resorts",
      description: "Discover handpicked luxury hotels and premium rooms tailored for your ultimate relaxation.",
      image_url: fallbackImages[0]
    }
  ];

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % displaySlides.length);
    }, 6000); // Change slide every 6 seconds
  }, [displaySlides.length, stopTimer]);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [startTimer, stopTimer]);

  const handlePrev = () => {
    stopTimer();
    setActiveIndex((prev) => (prev - 1 + displaySlides.length) % displaySlides.length);
    startTimer();
  };

  const handleNext = () => {
    stopTimer();
    setActiveIndex((prev) => (prev + 1) % displaySlides.length);
    startTimer();
  };

  const handleDotClick = (index: number) => {
    stopTimer();
    setActiveIndex(index);
    startTimer();
  };

  return (
    <section className="relative h-[85vh] flex items-center justify-center overflow-hidden w-full bg-neutral-950">
      {/* Slides */}
      {displaySlides.map((slide, index) => {
        const imageUrl = slide.image_url || fallbackImages[index % fallbackImages.length];
        const isActive = index === activeIndex;

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {/* Background Image with Ken Burns zoom effect when active */}
            <div
              className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[8000ms] ease-out ${
                isActive ? "scale-105" : "scale-100"
              }`}
              style={{ backgroundImage: `url('${imageUrl}')` }}
            />
            {/* Dark glassmorphic overlay for copy contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/75 backdrop-blur-[1px]" />

            {/* Slide Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="max-w-4xl mx-auto px-6 text-center text-white space-y-6">
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary font-semibold bg-primary/10 border border-primary/25 px-4 py-1.5 rounded-full backdrop-blur-md animate-fade-in">
                  <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {slide.location}
                </span>

                <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif tracking-tight leading-tight uppercase">
                  {slide.name}
                </h1>

                {slide.description && (
                  <p className="text-xs sm:text-sm md:text-base text-white/80 font-light max-w-xl mx-auto leading-relaxed line-clamp-2">
                    {slide.description}
                  </p>
                )}

                {slide.id !== "fallback-1" && (
                  <div className="pt-2">
                    <Link
                      href={`/hotel/${slide.id}`}
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:opacity-95 transition-all duration-300 shadow-lg hover:shadow-primary/30 text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Book Your Stay
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrows */}
      {displaySlides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 border border-white/10 hover:bg-primary hover:border-primary text-white transition-all cursor-pointer shadow hover:scale-105 duration-200"
            aria-label="Previous Slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 border border-white/10 hover:bg-primary hover:border-primary text-white transition-all cursor-pointer shadow hover:scale-105 duration-200"
            aria-label="Next Slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {displaySlides.length > 1 && (
        <div className="absolute bottom-36 z-20 flex gap-2.5">
          {displaySlides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                index === activeIndex ? "w-8 bg-primary" : "w-1.5 bg-white/40 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Fixed Search Card Overlay at the very bottom center of the hero */}
      <div className="absolute bottom-6 left-0 right-0 z-20 max-w-4xl mx-auto px-6">
        <form
          action="/"
          method="GET"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-background/95 backdrop-blur-md rounded-xl shadow-2xl border border-border/20 text-foreground max-w-3xl mx-auto"
        >
          <div className="text-left px-3 py-2 border-b sm:border-b-0 sm:border-r border-border">
            <label htmlFor="location-input" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
              Destination
            </label>
            <input
              type="text"
              name="location"
              id="location-input"
              placeholder="Where are you going?"
              defaultValue={initialLocation}
              className="w-full bg-transparent border-none text-sm p-0 focus:outline-none text-foreground font-medium placeholder:text-muted-foreground/45"
            />
          </div>

          <div className="text-left px-3 py-2 border-b sm:border-b-0 sm:border-r border-border">
            <label htmlFor="guests-input" className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
              Guests
            </label>
            <input
              type="number"
              name="guests"
              id="guests-input"
              placeholder="Number of guests"
              defaultValue={initialGuests}
              min={1}
              className="w-full bg-transparent border-none text-sm p-0 focus:outline-none text-foreground font-medium placeholder:text-muted-foreground/45"
            />
          </div>

          <div className="flex items-center justify-center p-1.5">
            <button
              type="submit"
              className="w-full h-full bg-primary text-primary-foreground hover:opacity-90 font-semibold text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              Search Stays
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
