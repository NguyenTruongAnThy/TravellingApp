import { supabase } from '../lib/supabase';

/**
 * Lấy danh sách địa điểm lưu trú (places)
 * @param {Object} options
 * @param {string} [options.category] - Lọc theo danh mục (Nature, Beach, Countryside,...)
 * @param {number} [options.limit] - Số lượng địa điểm muốn lấy
 * @returns {Promise<{data: any[], error: any}>}
 */
export async function getPlaces({ category = null, limit = 50 } = {}) {
  try {
    let query = supabase
      .from('places')
      .select('*')
      .eq('is_visible', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Lấy chi tiết 1 địa điểm theo ID
 * @param {string} id - UUID của địa điểm
 */
export async function getPlaceById(id) {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Kiểm tra kết nối Supabase
 * @returns {Promise<{success: boolean, message: string, count?: number}>}
 */
export async function testConnection() {
  try {
    const { data, error, count } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: 'Kết nối Supabase thành công!',
      count: count ?? 0,
    };
  } catch (err) {
    return {
      success: false,
      message: err?.message || 'Không thể kết nối đến Supabase',
    };
  }
}

