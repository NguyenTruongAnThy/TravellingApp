import { supabase } from '../lib/supabase';

export const SEPAY_CONFIG = {
  BANK: 'BIDV',
  BANK_NAME: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
  ACCOUNT_NUMBER: '5811676579',
  ACCOUNT_NAME: 'NGUYEN VAN TRONG',
  USD_TO_VND_RATE: 25000,
  WEBHOOK_URL: 'https://cltgqtxjzzfcfgkrtjwg.supabase.co/functions/v1/sepay-webhook',
};

/**
 * Sinh URL mã ảnh VietQR chuẩn của SePay
 * Ví dụ: https://qr.sepay.vn/img?acc=5811676579&bank=BIDV&amount=750000&des=WS51088
 */
export function buildSepayQrUrl(amountVnd: number, transferContent: string): string {
  // Loại bỏ dấu # và ký tự đặc biệt để app ngân hàng không bị lỗi nội dung
  const cleanContent = transferContent.replace(/[^a-zA-Z0-9]/g, '');
  return `https://qr.sepay.vn/img?acc=${SEPAY_CONFIG.ACCOUNT_NUMBER}&bank=${SEPAY_CONFIG.BANK}&amount=${amountVnd}&des=${encodeURIComponent(cleanContent)}`;
}

/**
 * Quy đổi từ USD ($) sang VNĐ theo tỷ giá 1 USD = 25.000 VNĐ
 */
export function convertUsdToVnd(usdAmount: number): number {
  return Math.round(usdAmount * SEPAY_CONFIG.USD_TO_VND_RATE);
}

/**
 * Thuật toán giảm số tiền khi quét mã QR phục vụ mục đích Demo (Test):
 * Giữ nguyên giá hiển thị trên app, nhưng khi quét mã QR giảm 1.000 lần
 * Ví dụ: 1.500.000 VNĐ -> 1.500 VNĐ (1 nghìn rưỡi)
 */
export function getDemoPaymentAmountVnd(fullAmountVnd: number): number {
  const demoAmount = Math.round(fullAmountVnd / 1000);
  return Math.max(1000, demoAmount);
}

/**
 * Định dạng tiền tệ VNĐ (ví dụ: 750.000 VNĐ)
 */
export function formatVnd(amountVnd: number): string {
  return `${amountVnd.toLocaleString('vi-VN')} VNĐ`;
}

/**
 * Kiểm tra trạng thái thanh toán trực tiếp từ database Supabase
 */
export async function checkBookingPaymentStatus(bookingId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('payment_status, status')
      .eq('id', bookingId)
      .single();

    if (error || !data) return false;
    return data.payment_status === 'paid';
  } catch {
    return false;
  }
}

/**
 * Hỗ trợ mô phỏng thanh toán tức thì (dành cho kiểm thử hoặc nút bấm "Tôi đã chuyển tiền")
 */
export async function simulateConfirmPayment(bookingId: string): Promise<{ success: boolean; error?: unknown }> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        status: 'booked',
      })
      .eq('id', bookingId);

    if (error) return { success: false, error };
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}
