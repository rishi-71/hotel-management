"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabasePlain = createSupabaseClient(supabaseUrl, supabaseAnonKey);

export async function bookRoom(formData: {
  roomId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
}) {
  // Query room type and parent hotel name for plain English database representation
  const { data: roomData } = await supabasePlain
    .from("rooms")
    .select("type, hotels(name)")
    .eq("id", formData.roomId)
    .single();

  const roomType = roomData?.type || "Unknown Room";
  const hotelData = roomData?.hotels as unknown;
  const hotelName = (
    Array.isArray(hotelData)
      ? (hotelData[0] as { name: string } | undefined)?.name
      : (hotelData as { name: string } | null | undefined)?.name
  ) || "Unknown Hotel";

  // Insert booking into new booking_records table with descriptive names
  const { error } = await supabasePlain.from("booking_records").insert([
    {
      room_id: formData.roomId,
      guest_name: formData.guestName,
      guest_email: formData.guestEmail,
      guest_phone: formData.guestPhone,
      check_in: formData.checkIn,
      check_out: formData.checkOut,
      total_price: formData.totalPrice,
      status: "confirmed",
      hotel_name: hotelName,
      room_type: roomType
    }
  ]);

  if (error) {
    console.error("Booking record insertion failed:", error);
    // Informative error message to help user create the table in Supabase console SQL Editor
    if (error.code === "PGRST205" || error.message?.includes("relation") || error.message?.includes("does not exist")) {
      return { 
        error: "Table 'booking_records' does not exist in your Supabase database yet. Please run the SQL command provided in docs.md in your Supabase SQL Editor to create it!" 
      };
    }
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}
