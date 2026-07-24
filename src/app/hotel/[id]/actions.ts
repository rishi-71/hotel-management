"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function bookRoom(formData: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
}) {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to book a room." };
  }

  // Insert booking
  const { error } = await supabase.from("bookings").insert([
    {
      room_id: formData.roomId,
      user_id: user.id,
      check_in: formData.checkIn,
      check_out: formData.checkOut,
      total_price: formData.totalPrice,
      status: "pending"
    }
  ]);

  if (error) {
    console.error("Booking failed:", error);
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}
