import { supabase } from '../lib/supabase';
import { Promotion } from '../types';

export interface PromoValidationResult {
  valid: boolean;
  message?: string;
  promotion?: Promotion;
  discountAmount: number;
}

/**
 * Lấy danh sách các mã khuyến mại đang còn hiệu lực
 */
export async function getActivePromotions(): Promise<Promotion[]> {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching promotions:', error.message);
      return [];
    }

    return (data as Promotion[]) || [];
  } catch (err) {
    console.error('getActivePromotions unexpected error:', err);
    return [];
  }
}

/**
 * Kiểm tra tính hợp lệ của mã khuyến mại và tính số tiền được giảm
 * @param inputCode Mã người dùng nhập vào
 * @param subtotal Tổng tiền trước khi giảm (giá phòng + tiện ích)
 */
export async function validatePromoCode(
  inputCode: string,
  subtotal: number
): Promise<PromoValidationResult> {
  const code = inputCode.trim().toUpperCase();
  if (!code) {
    return { valid: false, message: 'Vui lòng nhập mã khuyến mại', discountAmount: 0 };
  }

  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      return { valid: false, message: 'Mã khuyến mại không tồn tại hoặc đã hết hạn', discountAmount: 0 };
    }

    const promo = data as Promotion;

    // Kiểm tra thời hạn hiệu lực nếu có
    if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
      return { valid: false, message: 'Mã khuyến mại đã hết hạn sử dụng', discountAmount: 0 };
    }

    // Kiểm tra số lượt sử dụng nếu có
    if (
      promo.usage_limit !== undefined &&
      promo.usage_limit !== null &&
      promo.used_count !== undefined &&
      promo.used_count !== null &&
      promo.used_count >= promo.usage_limit
    ) {
      return { valid: false, message: 'Mã khuyến mại đã hết số lượt sử dụng', discountAmount: 0 };
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    const minOrder = Number(promo.min_order_amount || 0);
    if (subtotal < minOrder) {
      return {
        valid: false,
        message: `Đơn đặt phòng tối thiểu $${minOrder} để áp dụng mã này`,
        discountAmount: 0,
      };
    }

    // Tính toán số tiền được giảm
    let discount = 0;
    const discountVal = Number(promo.discount_value);
    if (promo.discount_type === 'percentage') {
      discount = (subtotal * discountVal) / 100;
      if (promo.max_discount_amount) {
        discount = Math.min(discount, Number(promo.max_discount_amount));
      }
    } else {
      discount = discountVal;
    }

    // Tiền giảm không thể vượt quá subtotal
    discount = Math.min(discount, subtotal);
    discount = Math.round(discount * 100) / 100;

    return {
      valid: true,
      promotion: promo,
      discountAmount: discount,
      message: `Áp dụng thành công mã ${promo.code}! Giảm $${discount}`,
    };
  } catch (err) {
    console.error('validatePromoCode unexpected error:', err);
    return { valid: false, message: 'Lỗi kiểm tra mã khuyến mại', discountAmount: 0 };
  }
}
