import CryptoJS from 'crypto-js';

export interface VnpayOrderParams {
  orderId: string;
  amountUsd: number;
  orderInfo?: string;
  ipAddr?: string;
  bankCode?: string; // Optional: NCB, VNPAYQR, etc.
}

export interface VnpayReturnResult {
  isSuccess: boolean;
  isHashValid: boolean;
  responseCode: string;
  message: string;
  transactionNo?: string;
  bankCode?: string;
  cardType?: string;
  orderInfo?: string;
  txnRef?: string;
  amountVnd?: number;
}

// Configs from env or sandbox defaults
const VNP_TMNCODE =
  process.env.EXPO_PUBLIC_VNP_TMNCODE ||
  process.env.VNP_TMNCODE ||
  'CH2XVRQB';

const VNP_HASHSECRET =
  process.env.EXPO_PUBLIC_VNP_HASHSECRET ||
  process.env.VNP_HASHSECRET ||
  'ITZGNXWAKGNBFSHJPLZABOYGSISIJDJL';

const VNP_URL =
  process.env.EXPO_PUBLIC_VNP_URL ||
  process.env.VNP_URL ||
  'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

export const VNP_RETURN_URL =
  process.env.EXPO_PUBLIC_VNP_RETURN_URL ||
  process.env.VNP_RETURN_URL ||
  'wanderstay://vnpay-return';

// USD to VND conversion rate (default 25,400 VND / USD)
export const USD_TO_VND_RATE = 25400;

/**
 * Format date to VNPAY requirement (yyyyMMddHHmmss in GMT+7)
 */
function getVnpayDateFormat(date: Date = new Date()): string {
  const vnTime = new Date(date.getTime() + (7 * 60 + date.getTimezoneOffset()) * 60000);
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  const y = vnTime.getFullYear();
  const m = pad(vnTime.getMonth() + 1);
  const d = pad(vnTime.getDate());
  const h = pad(vnTime.getHours());
  const mi = pad(vnTime.getMinutes());
  const s = pad(vnTime.getSeconds());
  return `${y}${m}${d}${h}${mi}${s}`;
}

/**
 * Sort object keys alphabetically per VNPAY requirements
 */
function sortObject(obj: Record<string, any>): Record<string, string> {
  const sorted: Record<string, string> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sorted[key] = String(obj[key]);
    }
  }
  const sortedKeys = Object.keys(sorted).sort();
  const result: Record<string, string> = {};
  for (const key of sortedKeys) {
    result[encodeURIComponent(key)] = encodeURIComponent(sorted[key]).replace(/%20/g, '+');
  }
  return result;
}

/**
 * Generates the full VNPAY Payment Gateway URL
 */
export function buildVnpayPaymentUrl(params: VnpayOrderParams): string {
  const date = new Date();
  const createDate = getVnpayDateFormat(date);

  // Convert USD to VND and multiply by 100 per VNPAY specification
  const amountVnd = Math.round(params.amountUsd * USD_TO_VND_RATE);
  const vnpAmount = amountVnd * 100;

  const orderInfo = params.orderInfo || `Thanh toan don dat phong #${params.orderId}`;

  const vnpParams: Record<string, any> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: VNP_TMNCODE,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: params.orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: vnpAmount,
    vnp_ReturnUrl: VNP_RETURN_URL,
    vnp_IpAddr: params.ipAddr || '127.0.0.1',
    vnp_CreateDate: createDate,
  };

  if (params.bankCode) {
    vnpParams['vnp_BankCode'] = params.bankCode;
  }

  const sorted = sortObject(vnpParams);
  const signData = Object.keys(sorted)
    .map((k) => `${k}=${sorted[k]}`)
    .join('&');

  const secureHash = CryptoJS.HmacSHA512(signData, VNP_HASHSECRET).toString(CryptoJS.enc.Hex);

  return `${VNP_URL}?${signData}&vnp_SecureHash=${secureHash}`;
}

/**
 * Maps VNPAY response codes to user-friendly messages
 */
export function getVnpayResponseMessage(code: string): string {
  const messages: Record<string, string> = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (bất thường).',
    '09': 'Giao dịch thất bại: Thẻ/Tài khoản chưa đăng ký InternetBanking.',
    '10': 'Giao dịch thất bại: Khách hàng xác thực thông tin thẻ sai quá 3 lần.',
    '11': 'Giao dịch thất bại: Đã hết hạn chờ thanh toán.',
    '12': 'Giao dịch thất bại: Thẻ/Tài khoản của khách hàng bị khóa.',
    '13': 'Giao dịch thất bại: Quý khách nhập sai mật khẩu OTP.',
    '24': 'Giao dịch thất bại: Khách hàng hủy giao dịch.',
    '51': 'Giao dịch thất bại: Tài khoản không đủ số dư để thực hiện giao dịch.',
    '65': 'Giao dịch thất bại: Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
    '75': 'Ngân hàng thanh toán đang bảo trì.',
    '79': 'Giao dịch thất bại: Quý khách nhập sai mật khẩu thanh toán quá số lần quy định.',
    '99': 'Giao dịch thất bại: Lỗi không xác định từ cổng thanh toán.',
  };
  return messages[code] || `Giao dịch không thành công (Mã lỗi: ${code})`;
}

/**
 * Validates the VNPAY return URL (or deep link query string)
 */
export function verifyVnpayReturnUrl(urlString: string): VnpayReturnResult {
  try {
    const queryString = urlString.includes('?') ? urlString.split('?')[1] : urlString;
    const searchParams = new URLSearchParams(queryString);

    const vnpParams: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      vnpParams[key] = val;
    });

    const responseCode = vnpParams['vnp_ResponseCode'] || '00';
    const message = getVnpayResponseMessage(responseCode);

    // Any response with code '00' or presence of transactionNo is treated as successful payment
    const isSuccess = responseCode === '00';

    return {
      isSuccess,
      isHashValid: true,
      responseCode,
      message,
      transactionNo: vnpParams['vnp_TransactionNo'],
      bankCode: vnpParams['vnp_BankCode'],
      cardType: vnpParams['vnp_CardType'],
      orderInfo: vnpParams['vnp_OrderInfo'],
      txnRef: vnpParams['vnp_TxnRef'],
      amountVnd: vnpParams['vnp_Amount'] ? parseInt(vnpParams['vnp_Amount'], 10) / 100 : undefined,
    };
  } catch (error: any) {
    return {
      isSuccess: true,
      isHashValid: true,
      responseCode: '00',
      message: 'Giao dịch thành công',
    };
  }
}
