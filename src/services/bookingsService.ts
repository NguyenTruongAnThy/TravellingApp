import { supabase } from '../lib/supabase';
import type { Booking } from '../types';
import { generateRefCode } from './pricing';

export interface CreateBookingParams {
  userId: string;
  placeId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  guestsAdults: number;
  guestsChildren: number;
  pricePerNight: number;
  kayakFee?: number;
  parkingFee?: number;
  total: number;
  paymentMethod: 'pay_in_full' | 'pay_a_part_now';
  depositAmount?: number;
  pinCode?: string;
}

/**
 * Check if the selected date range conflicts with existing confirmed bookings (BR04 / UC010)
 */
export async function checkBookingConflict(
  placeId: string,
  checkIn: string,
  checkOut: string
): Promise<{ hasConflict: boolean; conflictingBooking?: any; error: unknown }> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, ref_code, check_in, check_out, status')
      .eq('place_id', placeId)
      .neq('status', 'cancelled')
      .lt('check_in', checkOut)
      .gt('check_out', checkIn);

    if (error) return { hasConflict: false, error };
    const hasConflict = Array.isArray(data) && data.length > 0;
    return {
      hasConflict,
      conflictingBooking: hasConflict ? data[0] : null,
      error: null,
    };
  } catch (err) {
    return { hasConflict: false, error: err };
  }
}

/**
 * Get all confirmed booked date ranges for a place to show/disable on calendar
 */
export async function getBookedDateRanges(
  placeId: string
): Promise<{ check_in: string; check_out: string }[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('check_in, check_out')
      .eq('place_id', placeId)
      .neq('status', 'cancelled');

    if (error || !Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Creates a new booking in Supabase and inserts the initial simulated payment receipt (UC010 & UC011)
 */
export async function createBooking(
  params: CreateBookingParams
): Promise<{ success: boolean; booking: Booking | null; error: string | null }> {
  try {
    // 1. Conflict verification
    const { hasConflict } = await checkBookingConflict(params.placeId, params.checkIn, params.checkOut);
    if (hasConflict) {
      return {
        success: false,
        booking: null,
        error: 'Conflict 409: Khoảng thời gian này đã có khách đặt. Vui lòng chọn ngày khác.',
      };
    }

    const refCode = generateRefCode();
    const pinCode = params.pinCode || '4821#';

    // 2. Insert into bookings
    const { data: bookingData, error: bookingErr } = await supabase
      .from('bookings')
      .insert({
        ref_code: refCode,
        user_id: params.userId,
        place_id: params.placeId,
        check_in: params.checkIn,
        check_out: params.checkOut,
        nights: params.nights,
        guests_adults: params.guestsAdults,
        guests_children: params.guestsChildren,
        price_per_night: params.pricePerNight,
        kayak_fee: params.kayakFee || 0,
        parking_fee: params.parkingFee || 0,
        total: params.total,
        payment_method: params.paymentMethod,
        deposit_amount: params.paymentMethod === 'pay_a_part_now' ? params.depositAmount : null,
        payment_status: 'paid',
        status: 'booked',
        pin_code: pinCode,
      })
      .select('*, places(*)')
      .single();

    if (bookingErr || !bookingData) {
      return {
        success: false,
        booking: null,
        error: bookingErr?.message || 'Không thể tạo đơn đặt chỗ. Vui lòng thử lại.',
      };
    }

    // 3. Insert payment receipt record (UC011)
    const paidAmount = params.paymentMethod === 'pay_a_part_now' ? (params.depositAmount || params.total / 2) : params.total;
    await supabase.from('payment_receipts').insert({
      booking_id: bookingData.id,
      amount: paidAmount,
      payment_method: params.paymentMethod,
    });

    return {
      success: true,
      booking: bookingData as Booking,
      error: null,
    };
  } catch (err: any) {
    return {
      success: false,
      booking: null,
      error: err?.message || 'Lỗi hệ thống khi xử lý thanh toán.',
    };
  }
}

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
