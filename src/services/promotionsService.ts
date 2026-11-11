import { supabase } from '../lib/supabase';
import { Promotion } from '../types';
import i18n from '../i18n';

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
 * @param placeLocation Vị trí chỗ đang đặt (vd 'Denpasar, Bali') — dùng để
 * kiểm tra phạm vi áp dụng của mã (cột promotions.applicable_location).
 * Mã không set phạm vi (null/rỗng) thì áp cho mọi nơi như trước.
 */
export async function validatePromoCode(
  inputCode: string,
  subtotal: number,
  placeLocation?: string
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

    // Kiểm tra phạm vi áp dụng: mã có applicable_location (vd 'Bali') thì
    // chỉ dùng cho chỗ ở có location chứa chuỗi đó (không phân biệt hoa
    // thường). Mã không set phạm vi (null/rỗng) áp cho mọi nơi như trước.
    // Location chỗ ở có dạng 'Tên, Vùng' (vd 'Denpasar, Bali',
    // 'Bali, Indonesia') nên substring khớp; chỗ ngoài Bali
    // (vd 'Oregon, USA', 'Đà Lạt, Việt Nam') không chứa chuỗi này.
    const scope = (promo.applicable_location || '').trim();
    if (scope) {
      const loc = (placeLocation || '').toLowerCase();
      if (!loc || !loc.includes(scope.toLowerCase())) {
        return {
          valid: false,
          message: i18n.t('checkout.promoScopeMismatch', { location: scope }),
          discountAmount: 0,
        };
      }
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
