import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manually parse .env.local to avoid any package dependencies
let supabaseUrl = "";
let supabaseAnonKey = "";

try {
  const envPath = path.resolve(".env.local");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf8");
    envFile.split(/\r?\n/).forEach((line) => {
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
        if (key === "NEXT_PUBLIC_SUPABASE_URL") supabaseUrl = val;
        if (key === "NEXT_PUBLIC_SUPABASE_ANON_KEY") supabaseAnonKey = val;
      }
    });
  }
} catch (err) {
  console.error("Error reading .env.local:", err);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing credentials in .env.local. Found URL:", supabaseUrl, "Key length:", supabaseAnonKey?.length);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const BUCKET_NAME = "hotel-images";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

async function migrateImages() {
  console.log("Starting image migration to Supabase Storage bucket:", BUCKET_NAME);

  // 1. Fetch hotels
  console.log("\nFetching hotels...");
  const { data: hotels, error: hotelsError } = await supabase
    .from("hotels")
    .select("id, name, image_url")
    .neq("name", "__SYSTEM_CONFIG__");

  if (hotelsError) {
    console.error("Failed to fetch hotels:", hotelsError);
    return;
  }

  for (const hotel of hotels) {
    if (!hotel.image_url) continue;

    // Skip if already in Supabase storage
    if (hotel.image_url.includes(supabaseUrl) && hotel.image_url.includes("/storage/v1/object/public/")) {
      console.log(`- Hotel "${hotel.name}" already uses Supabase storage: ${hotel.image_url}`);
      continue;
    }

    console.log(`- Migrating image for hotel: "${hotel.name}" (${hotel.image_url})`);

    try {
      // Download image
      const response = await fetch(hotel.image_url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const contentType = response.headers.get("content-type") || "image/jpeg";
      const ext = contentType.split("/")[1] || "jpg";
      const slug = slugify(hotel.name);
      const fileName = `hotels/${slug}-${Date.now()}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer, {
          contentType,
          cacheControl: "3600",
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

      // Update database record
      const { error: updateError } = await supabase
        .from("hotels")
        .update({ image_url: publicUrl })
        .eq("id", hotel.id);

      if (updateError) throw updateError;

      console.log(`  ✓ Successfully migrated to: ${publicUrl}`);
    } catch (err) {
      console.error(`  ✗ Failed to migrate hotel "${hotel.name}":`, err.message || err);
    }
  }

  // 2. Fetch rooms
  console.log("\nFetching rooms...");
  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("id, type, image_url, hotels(name)");

  if (roomsError) {
    console.error("Failed to fetch rooms:", roomsError);
    return;
  }

  for (const room of rooms) {
    if (!room.image_url) continue;

    // Skip if already in Supabase storage
    if (room.image_url.includes(supabaseUrl) && room.image_url.includes("/storage/v1/object/public/")) {
      console.log(`- Room "${room.type}" already uses Supabase storage: ${room.image_url}`);
      continue;
    }

    const hotelName = room.hotels?.name || "unknown-hotel";
    console.log(`- Migrating image for room: "${hotelName} - ${room.type}" (${room.image_url})`);

    try {
      // Download image
      const response = await fetch(room.image_url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const contentType = response.headers.get("content-type") || "image/jpeg";
      const ext = contentType.split("/")[1] || "jpg";
      const hotelSlug = slugify(hotelName);
      const roomSlug = slugify(room.type);
      const fileName = `rooms/${hotelSlug}-${roomSlug}-${Date.now()}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer, {
          contentType,
          cacheControl: "3600",
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

      // Update database record
      const { error: updateError } = await supabase
        .from("rooms")
        .update({ image_url: publicUrl })
        .eq("id", room.id);

      if (updateError) throw updateError;

      console.log(`  ✓ Successfully migrated to: ${publicUrl}`);
    } catch (err) {
      console.error(`  ✗ Failed to migrate room "${room.type}":`, err.message || err);
    }
  }

  console.log("\nMigration completed!");
}

migrateImages();
