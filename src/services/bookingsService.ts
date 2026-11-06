import { supabase } from '../lib/supabase';
import type { Booking } from '../types';

export async function getUserBookings(
  userId: string
): Promise<{ data: Booking[] | null; error: unknown }> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, places(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data: (data as any) || [], error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function cancelBooking(
  bookingId: string,
  reason: string = 'User requested cancellation'
): Promise<{ success: boolean; error: unknown }> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason,
      })
      .eq('id', bookingId);

    if (error) return { success: false, error };
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err };
  }
}
