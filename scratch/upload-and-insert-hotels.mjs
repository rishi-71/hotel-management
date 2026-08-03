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
  console.error("Missing credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const BUCKET_NAME = "hotel-images";

const localImages = [
  {
    hotelName: "The Shreemaya",
    fileName: "shreemaya_rnt_marg_hotel.jpg",
    slug: "the-shreemaya"
  },
  {
    hotelName: "Radisson Blu Hotel Indore",
    fileName: "radsson_blu_hotel.jpg",
    slug: "radisson-blu-hotel-indore"
  },
  {
    hotelName: "Sayaji Hotel Indore",
    fileName: "sayaji_hotel.jpg",
    slug: "sayaji-hotel-indore"
  },
  {
    hotelName: "Wow Hotel Indore",
    fileName: "wow_hotel.jpg",
    slug: "wow-hotel-indore"
  },
  {
    hotelName: "Indore Marriott Hotel",
    fileName: "Indore_Marriott_hotel.jpg",
    slug: "indore-marriott-hotel",
    isNew: true,
    location: "Scheme No 54, Indore, Madhya Pradesh",
    description: "Experience premium comfort, world-class luxury dining, and elegant suites in the heart of Indore's business hub."
  },
  {
    hotelName: "Essentia Luxury Hotel",
    fileName: "Essentia_Luxury_hotel.jpg",
    slug: "essentia-luxury-hotel",
    isNew: true,
    location: "Bypass Road, Indore, Madhya Pradesh",
    description: "Enjoy premium corporate convenience, luxury wellness spas, and warm traditional hospitality at Essentia."
  }
];

async function run() {
  console.log("Starting local image upload and DB insert/update...");

  for (const item of localImages) {
    const localFilePath = path.join("public", "assets", item.fileName);
    if (!fs.existsSync(localFilePath)) {
      console.warn(`✗ File not found: ${localFilePath}. Skipping...`);
      continue;
    }

    console.log(`\nProcessing: "${item.hotelName}"`);
    try {
      // 1. Read file buffer
      const buffer = fs.readFileSync(localFilePath);
      const ext = item.fileName.split(".").pop() || "jpg";
      const contentType = ext === "png" ? "image/png" : "image/jpeg";
      const bucketFilePath = `hotels/${item.slug}-${Date.now()}.${ext}`;

      // 2. Upload file to Supabase Storage
      console.log(`- Uploading ${item.fileName} to bucket path ${bucketFilePath}...`);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(bucketFilePath, buffer, {
          contentType,
          cacheControl: "3600",
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(bucketFilePath);
      console.log(`  ✓ Public URL: ${publicUrl}`);

      // 4. Retrieve or insert hotel
      const { data: existingHotels } = await supabase
        .from("hotels")
        .select("id")
        .eq("name", item.hotelName);

      let hotelId = "";

      if (existingHotels && existingHotels.length > 0) {
        hotelId = existingHotels[0].id;
        console.log(`- Hotel "${item.hotelName}" already exists (ID: ${hotelId}). Updating details...`);
        const updatePayload = { image_url: publicUrl };
        if (item.isNew) {
          updatePayload.location = item.location;
          updatePayload.description = item.description;
        }
        const { error: updateError } = await supabase
          .from("hotels")
          .update(updatePayload)
          .eq("id", hotelId);
        if (updateError) throw updateError;
      } else {
        // Insert new hotel
        console.log(`- Creating new hotel: "${item.hotelName}"`);
        const { data: newHotel, error: insertError } = await supabase
          .from("hotels")
          .insert([
            {
              name: item.hotelName,
              location: item.location,
              description: item.description,
              image_url: publicUrl
            }
          ])
          .select("id")
          .single();

        if (insertError) throw insertError;
        hotelId = newHotel.id;
        console.log(`  ✓ Created hotel ID: ${hotelId}`);
      }

      // 5. Insert default rooms for new hotels
      if (item.isNew) {
        // Check if rooms already exist for this hotel
        const { data: existingRooms } = await supabase
          .from("rooms")
          .select("id")
          .eq("hotel_id", hotelId);

        if (!existingRooms || existingRooms.length === 0) {
          console.log(`- Adding default rooms for "${item.hotelName}"...`);
          const defaultRooms = [
            {
              hotel_id: hotelId,
              type: "Deluxe King Room",
              title: "Deluxe King Room",
              capacity: 2,
              price_per_night: 8500,
              image_url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80"
            },
            {
              hotel_id: hotelId,
              type: "Executive Suite",
              title: "Executive Suite",
              capacity: 3,
              price_per_night: 14500,
              image_url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
            }
          ];

          const { error: roomsError } = await supabase.from("rooms").insert(defaultRooms);
          if (roomsError) throw roomsError;
          console.log(`  ✓ Successfully added Deluxe and Executive rooms!`);
        } else {
          console.log(`- Rooms already exist for "${item.hotelName}". Skipping rooms creation.`);
        }
      }
    } catch (err) {
      console.error(`  ✗ Error processing "${item.hotelName}":`, err.message || err);
    }
  }

  console.log("\nFinished uploading and updating database!");
}

run();
