import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SmartKeyInfo } from './smartKeyService';

/**
 * Generates and shares a professional PDF Trip Receipt (UC011)
 */
export async function exportTripReceiptPDF(
  booking: any,
  isVi: boolean = true
): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    const place = booking?.places || booking?.place;
    const refCode = booking?.ref_code || '#WS-84920';
    const receiptNumber = booking?.ref_code
      ? `#REC-${booking.ref_code.replace('#', '')}`
      : '#REC-2026-84920';

    const placeTitle = place?.title || booking?.place_title || 'WanderStay Resort';
    const placeLocation = place?.location || booking?.place_location || 'Việt Nam';
    const placeType = place?.category || place?.place_type || 'HOMESTAY / RESORT';

    const checkIn = booking?.check_in || '2026-11-10';
    const checkOut = booking?.check_out || '2026-11-15';
    const nights = Number(booking?.nights || 1);
    const adults = Number(booking?.guests_adults || 1);
    const children = Number(booking?.guests_children || 0);
    const totalGuests = adults + children;

    const pricePerNight = Number(booking?.price_per_night || 20);
    const accommodationTotal = pricePerNight * nights;
    const kayakFee = booking?.kayak_fee != null ? Number(booking.kayak_fee) : 5;
    const parkingFee = booking?.parking_fee != null ? Number(booking.parking_fee) : 5;
    const promoCode = booking?.promo_code || null;
    const discountAmount = booking?.discount_amount != null ? Number(booking.discount_amount) : 0;
    const total =
      booking?.total != null
        ? Number(booking.total)
        : Math.max(0, accommodationTotal + kayakFee + parkingFee - discountAmount);

    const isCancelled = booking?.status === 'cancelled';
    const cancelReason = booking?.cancel_reason || (isVi ? 'Khách hàng hủy' : 'Cancelled by guest');
    const paymentMethod =
      booking?.payment_method === 'pay_a_part_now'
        ? (isVi ? 'Đặt cọc 50% (Pay a part now)' : '50% Deposit (Pay a part now)')
        : (isVi ? 'Thanh toán 100% (Pay in full / VietQR)' : 'Pay in full (VietQR / SePay)');

    const issuedDate = booking?.created_at
      ? new Date(booking.created_at).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : new Date().toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

    const statusBadge = isCancelled
      ? `<span style="background-color: #FEE2E2; color: #DC2626; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 13px; border: 1px solid #FECACA;">${
          isVi ? 'ĐÃ HỦY ĐẶT PHÒNG' : 'CANCELLED RESERVATION'
        }</span>`
      : `<span style="background-color: #EEF2FF; color: #4F46E5; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 13px; border: 1px solid #C7D2FE;">${
          isVi ? 'ĐÃ THANH TOÁN THÀNH CÔNG' : 'PAID & CONFIRMED'
        }</span>`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>WanderStay Trip Receipt - ${receiptNumber}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #131B2E;
            background: #FFFFFF;
            margin: 0;
            padding: 32px 36px;
            font-size: 14px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #E6E3F5;
            padding-bottom: 24px;
            margin-bottom: 24px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .brand-logo {
            width: 44px;
            height: 44px;
            background: #4F46E5;
            border-radius: 12px;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            font-weight: 900;
          }
          .brand-name {
            font-size: 24px;
            font-weight: 800;
            color: #4F46E5;
            letter-spacing: -0.5px;
          }
          .brand-sub {
            font-size: 12px;
            color: #5A6478;
          }
          .receipt-meta {
            text-align: right;
          }
          .receipt-title {
            font-size: 20px;
            font-weight: 800;
            color: #131B2E;
            margin-bottom: 4px;
          }
          .receipt-id {
            font-size: 13px;
            font-weight: 700;
            color: #4F46E5;
          }
          .banner {
            background: #F8F7FF;
            border: 1px solid #E6E3F5;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .banner-total-label {
            font-size: 12px;
            font-weight: 600;
            color: #5A6478;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .banner-total-amount {
            font-size: 32px;
            font-weight: 900;
            color: #131B2E;
            line-height: 1.1;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #5A6478;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }
          .card {
            background: #F8F7FF;
            border: 1px solid #E6E3F5;
            border-radius: 12px;
            padding: 16px;
          }
          .card-label {
            font-size: 11px;
            font-weight: 700;
            color: #5A6478;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .card-value {
            font-size: 14px;
            font-weight: 700;
            color: #131B2E;
          }
          .card-sub {
            font-size: 12px;
            color: #5A6478;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background: #F8F7FF;
            text-align: left;
            padding: 12px 16px;
            font-size: 12px;
            font-weight: 700;
            color: #5A6478;
            border-bottom: 1px solid #E6E3F5;
            text-transform: uppercase;
          }
          td {
            padding: 12px 16px;
            border-bottom: 1px solid #F1F0FA;
            font-size: 13px;
          }
          .total-row td {
            background: #EEF2FF;
            font-weight: 800;
            font-size: 15px;
            color: #4F46E5;
            border-top: 2px solid #C7D2FE;
            border-bottom: none;
          }
          .policy-box {
            background: #FFFBEB;
            border: 1px solid #FDE68A;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
            font-size: 12px;
            color: #92400E;
            line-height: 1.6;
          }
          .cancel-box {
            background: #FEF2F2;
            border: 1px solid #FECACA;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
            font-size: 12px;
            color: #991B1B;
            line-height: 1.6;
          }
          .footer {
            border-top: 1px solid #E6E3F5;
            padding-top: 20px;
            text-align: center;
            font-size: 11px;
            color: #8A90A6;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <div class="brand-logo">W</div>
            <div>
              <div class="brand-name">WanderStay</div>
              <div class="brand-sub">${isVi ? 'Nền tảng đặt phòng nghỉ dưỡng tự túc' : 'Keyless Vacation Rental Platform'}</div>
            </div>
          </div>
          <div class="receipt-meta">
            <div class="receipt-title">${isVi ? 'BIÊN NHẬN THANH TOÁN' : 'TRIP RECEIPT'}</div>
            <div class="receipt-id">${receiptNumber}</div>
            <div style="font-size: 12px; color: #5A6478; margin-top: 2px;">${isVi ? 'Ngày phát hành:' : 'Issued:'} ${issuedDate}</div>
          </div>
        </div>

        <div class="banner">
          <div>
            <div class="banner-total-label">${isCancelled ? (isVi ? 'Tổng tiền ban đầu' : 'Original Amount') : (isVi ? 'Tổng tiền đã thanh toán' : 'Total Amount Paid')}</div>
            <div class="banner-total-amount">$${total.toFixed(2)} USD</div>
            <div style="font-size: 12px; color: #5A6478; margin-top: 4px;">
              ${paymentMethod} • Ref: <strong>${refCode}</strong>
            </div>
          </div>
          <div>
            ${statusBadge}
          </div>
        </div>

        ${
          isCancelled
            ? `
          <div class="cancel-box">
            <strong>${isVi ? 'Thông tin hủy phòng & Hoàn tiền (Chính sách BR05):' : 'Cancellation & Refund Notice (BR05 Policy):'}</strong><br/>
            ${isVi ? 'Lý do hủy:' : 'Reason:'} <strong>${cancelReason}</strong><br/>
            ${
              isVi
                ? 'Đơn phòng đã được hoàn tiền 100% về phương thức thanh toán ban đầu theo quy định hoàn tiền minh bạch khi hủy trước giờ check-in từ 48 giờ.'
                : '100% full refund was processed to your original payment method under transparent BR05 policy (cancelled at least 48 hours prior to check-in).'
            }
          </div>
        `
            : ''
        }

        <div class="section-title">${isVi ? 'Thông tin kỳ nghỉ' : 'Stay Details'}</div>
        <div class="grid">
          <div class="card">
            <div class="card-label">${isVi ? 'Chỗ nghỉ' : 'Property'}</div>
            <div class="card-value">${placeTitle}</div>
            <div class="card-sub">${placeType} • ${placeLocation}</div>
          </div>
          <div class="card">
            <div class="card-label">${isVi ? 'Thời gian lưu trú' : 'Stay Dates'}</div>
            <div class="card-value">${checkIn} → ${checkOut}</div>
            <div class="card-sub">${nights} ${isVi ? 'đêm' : 'nights'} • ${totalGuests} ${isVi ? 'khách' : 'guests'}</div>
          </div>
        </div>

        <div class="section-title">${isVi ? 'Bảng kê chi phí minh bạch (BR01 & BR02)' : 'Itemized Price Breakdown'}</div>
        <table>
          <thead>
            <tr>
              <th>${isVi ? 'Mô tả dịch vụ' : 'Description'}</th>
              <th style="text-align: center;">${isVi ? 'Số lượng' : 'Qty'}</th>
              <th style="text-align: right;">${isVi ? 'Đơn giá' : 'Rate'}</th>
              <th style="text-align: right;">${isVi ? 'Thành tiền (USD)' : 'Amount (USD)'}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${isVi ? 'Giá phòng lưu trú' : 'Accommodation Stay'}</strong></td>
              <td style="text-align: center;">${nights} ${isVi ? 'đêm' : 'nights'}</td>
              <td style="text-align: right;">$${pricePerNight.toFixed(2)}</td>
              <td style="text-align: right;">$${accommodationTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>${isVi ? 'Phí thuê thuyền Kayak' : 'Kayak Rental Fee'}</td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">$${kayakFee.toFixed(2)}</td>
              <td style="text-align: right;">$${kayakFee.toFixed(2)}</td>
            </tr>
            <tr>
              <td>${isVi ? 'Phí đỗ xe khu vực' : 'Street Parking Fee'}</td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">$${parkingFee.toFixed(2)}</td>
              <td style="text-align: right;">$${parkingFee.toFixed(2)}</td>
            </tr>
            ${
              discountAmount > 0
                ? `
            <tr style="color: #FF6B00; font-weight: 600;">
              <td>${isVi ? 'Mã ưu đãi giảm giá' : 'Promotional Discount'} (${promoCode || 'PROMO'})</td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">-$${discountAmount.toFixed(2)}</td>
              <td style="text-align: right;">-$${discountAmount.toFixed(2)}</td>
            </tr>
            `
                : ''
            }
            <tr class="total-row">
              <td colspan="3"><strong>${isVi ? 'TỔNG CỘNG THANH TOÁN (USD)' : 'TOTAL CHARGED (USD)'}</strong></td>
              <td style="text-align: right;"><strong>$${total.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="policy-box">
          <strong>${isVi ? 'Chính sách minh bạch tuyệt đối của WanderStay:' : 'WanderStay Transparency Guarantee:'}</strong><br/>
          ${
            isVi
              ? 'Chi phí hiển thị khớp 100% với giá đặt phòng ban đầu, không phát sinh bất kỳ khoản phí dọn dẹp hoặc phí dịch vụ ẩn nào. Miễn phí hủy phòng 100% trước giờ check-in từ 48 giờ theo chuẩn BR05.'
              : 'The amount shown matches your booking search 100% without hidden cleaning fees or service charges. Free 100% cancellation is available up to 48 hours prior to check-in per BR05.'
          }
        </div>

        <div class="footer">
          <strong>WanderStay Travel Technologies Co., Ltd.</strong><br/>
          Website: www.wanderstay.app • Email: support@wanderstay.app • Hotline: 1900-8492 (24/7 Support)<br/>
          ${isVi ? 'Biên nhận điện tử được tạo tự động và có giá trị xác thực giao dịch trên toàn hệ thống WanderStay.' : 'This electronic receipt is computer-generated and verified across the WanderStay network.'}
        </div>
      </body>
      </html>
    `;

    // 1. Generate real PDF file
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // 2. Open native sharing/saving dialog
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: isVi ? 'Lưu hoặc chia sẻ biên nhận WanderStay' : 'Save or Share WanderStay Receipt',
      });
    }

    return { success: true, uri };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to export PDF' };
  }
}

/**
 * Generates and shares an Offline Check-in & Smart Key Guide PDF (UC013)
 */
export async function exportSmartKeyGuidePDF(
  data: SmartKeyInfo,
  isVi: boolean = true
): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>WanderStay Smart Key Offline Guide - ${data.placeTitle}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #131B2E;
            background: #FFFFFF;
            margin: 0;
            padding: 32px;
            font-size: 14px;
            line-height: 1.5;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #E6E3F5;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .brand {
            font-size: 24px;
            font-weight: 800;
            color: #4F46E5;
          }
          .guide-title {
            font-size: 18px;
            font-weight: 800;
            color: #131B2E;
            margin-top: 4px;
          }
          .key-banner {
            background: #EEF2FF;
            border: 2px dashed #4F46E5;
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            margin-bottom: 24px;
          }
          .pin-title {
            font-size: 12px;
            font-weight: 800;
            color: #5A6478;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .pin-code {
            font-size: 42px;
            font-weight: 900;
            color: #4F46E5;
            letter-spacing: 6px;
            margin: 8px 0;
            font-family: monospace;
          }
          .wifi-box {
            display: flex;
            justify-content: space-around;
            background: #FFFFFF;
            border: 1px solid #C7D2FE;
            border-radius: 12px;
            padding: 12px 16px;
            margin-top: 14px;
          }
          .step-list {
            margin-bottom: 24px;
          }
          .step-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 16px;
            background: #F8F7FF;
            border: 1px solid #E6E3F5;
            border-radius: 12px;
            padding: 14px;
          }
          .step-num {
            width: 28px;
            height: 28px;
            background: #4F46E5;
            color: #FFFFFF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            flex-shrink: 0;
          }
          .host-card {
            background: #F8F7FF;
            border: 1px solid #E6E3F5;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
          }
          .footer {
            border-top: 1px solid #E6E3F5;
            padding-top: 16px;
            text-align: center;
            font-size: 11px;
            color: #8A90A6;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">WanderStay</div>
          <div class="guide-title">${isVi ? 'CẨM NANG NHẬN PHÒNG & CHÌA KHÓA SỐ NGOẠI TUYẾN' : 'OFFLINE CHECK-IN & SMART KEY GUIDE'}</div>
          <div style="font-size: 12px; color: #5A6478; margin-top: 4px;">
            ${data.placeTitle} • Ref: <strong>${data.refCode}</strong>
          </div>
        </div>

        <div class="key-banner">
          <div class="pin-title">${isVi ? 'MÃ PIN MỞ CỬA CHÍNH (KEYLESS SMART PIN)' : 'MAIN DOOR SMART KEY PIN'}</div>
          <div class="pin-code">${data.pinCode || '4821#'}</div>
          <div style="font-size: 12px; color: #4F46E5; font-weight: 600;">
            ${isVi ? 'Tự động kích hoạt từ 14:00 ngày nhận phòng (BR03)' : 'Automatically active from 14:00 on check-in day'}
          </div>

          <div class="wifi-box">
            <div>
              <div style="font-size: 11px; color: #5A6478; font-weight: 700;">WIFI NETWORK</div>
              <div style="font-size: 13px; font-weight: 800; color: #131B2E;">${data.wifiSSID}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #5A6478; font-weight: 700;">PASSWORD</div>
              <div style="font-size: 13px; font-weight: 800; color: #4F46E5; font-family: monospace;">${data.wifiPassword}</div>
            </div>
          </div>
        </div>

        <div style="font-size: 14px; font-weight: 700; color: #5A6478; text-transform: uppercase; margin-bottom: 12px;">
          ${isVi ? '3 Bước nhận phòng nhanh' : '3 Quick Check-in Steps'}
        </div>
        <div class="step-list">
          <div class="step-item">
            <div class="step-num">1</div>
            <div>
              <div style="font-weight: 700; color: #131B2E;">${isVi ? 'Đến đúng địa chỉ và xác nhận khóa cửa' : 'Locate the entrance keypad'}</div>
              <div style="font-size: 12px; color: #5A6478; margin-top: 2px;">
                ${data.address}
              </div>
            </div>
          </div>
          <div class="step-item">
            <div class="step-num">2</div>
            <div>
              <div style="font-weight: 700; color: #131B2E;">${isVi ? 'Nhập mã PIN hoặc mở qua Bluetooth' : 'Enter PIN or unlock via Bluetooth'}</div>
              <div style="font-size: 12px; color: #5A6478; margin-top: 2px;">
                ${isVi ? 'Nhập chính xác dãy số kèm dấu # (hoặc bật Bluetooth và bấm Mở khóa trong app). Đèn xanh sẽ sáng và khóa mở chốt trong 5 giây.' : 'Type digits ending with #. Green LED blinks and lock disengages for 5 seconds.'}
              </div>
            </div>
          </div>
          <div class="step-item">
            <div class="step-num">3</div>
            <div>
              <div style="font-weight: 700; color: #131B2E;">${isVi ? 'Lấy thẻ từ phụ và tận hưởng kỳ nghỉ' : 'Collect spare RFID card inside'}</div>
              <div style="font-size: 12px; color: #5A6478; margin-top: 2px;">
                ${isVi ? 'Thẻ từ vật lý dự phòng được đặt tại bàn đón tiếp trong phòng khách để bạn tiện mang theo khi ra ngoài.' : 'A physical backup card key is waiting on the main living room counter.'}
              </div>
            </div>
          </div>
        </div>

        <div class="host-card">
          <div style="font-size: 11px; font-weight: 700; color: #5A6478; text-transform: uppercase; margin-bottom: 6px;">
            ${isVi ? 'LIÊN HỆ CHỦ NHÀ & KHẨN CẤP' : 'HOST & EMERGENCY CONTACT'}
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #131B2E;">${data.hostName}</div>
          <div style="font-size: 12px; color: #5A6478; margin-top: 2px;">
            Hotline: <strong>${data.hostPhone || '+62 812 3456 7890'}</strong> • ${isVi ? 'Phản hồi trong 5 phút' : 'Typically replies in 5m'}
          </div>
        </div>

        <div class="footer">
          WanderStay Keyless Access Guide • Lưu trữ trên máy để tra cứu khi không có sóng mạng 4G/Wifi.
        </div>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: isVi ? 'Lưu cẩm nang nhận phòng ngoại tuyến' : 'Save Offline Smart Key Guide',
      });
    }

    return { success: true, uri };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to export Smart Key Guide' };
  }
}

/**
 * Generates and shares an official VAT / E-Invoice PDF (UC016)
 */
export async function exportVatInvoicePDF(
  booking: any,
  isVi: boolean = true
): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    const refCode = booking?.ref_code || '#WS-84920';
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const place = booking?.places || booking?.place;
    const placeTitle = place?.title || 'WanderStay Resort Stay';
    const total = Number(booking?.total || 110);
    const nights = Number(booking?.nights || 1);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Hóa đơn điện tử VAT - ${invoiceNumber}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #131B2E;
            background: #FFFFFF;
            padding: 36px;
            font-size: 13px;
            line-height: 1.5;
          }
          .title {
            text-align: center;
            font-size: 20px;
            font-weight: 900;
            color: #4F46E5;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .sub-title {
            text-align: center;
            font-size: 12px;
            color: #5A6478;
            margin-bottom: 24px;
          }
          .info-table {
            width: 100%;
            margin-bottom: 20px;
            border-bottom: 1px solid #E6E3F5;
            padding-bottom: 16px;
          }
          table.items {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          table.items th, table.items td {
            border: 1px solid #E6E3F5;
            padding: 10px 12px;
          }
          table.items th {
            background: #F8F7FF;
            font-weight: 700;
          }
          .signature-box {
            margin-top: 36px;
            display: flex;
            justify-content: flex-end;
          }
          .stamp {
            border: 2px solid #059669;
            color: #059669;
            padding: 12px 18px;
            border-radius: 8px;
            font-weight: 800;
            text-align: center;
            font-size: 11px;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="title">HÓA ĐƠN GIÁ TRỊ GIA TĂNG (E-INVOICE)</div>
        <div class="sub-title">Ký hiệu: <strong>WS-26/01</strong> • Số: <strong>${invoiceNumber}</strong> • Ngày: <strong>${new Date().toLocaleDateString('vi-VN')}</strong></div>

        <div class="info-table">
          <strong>Đơn vị bán hàng:</strong> CÔNG TY CỔ PHẦN CÔNG NGHỆ DU LỊCH WANDERSTAY<br/>
          <strong>Mã số thuế:</strong> 0316888999<br/>
          <strong>Địa chỉ:</strong> Tòa nhà Landmark, TP. Hồ Chí Minh, Việt Nam<br/>
          <strong>Tài khoản ngân hàng:</strong> 5811676579 (BIDV - CN TP.HCM)
        </div>

        <div class="info-table">
          <strong>Khách hàng / Đơn vị mua:</strong> Thành viên WanderStay (Booking ${refCode})<br/>
          <strong>Hình thức thanh toán:</strong> Chuyển khoản VietQR / SePay tự động<br/>
          <strong>Dịch vụ:</strong> Dịch vụ lưu trú du lịch & Nghỉ dưỡng tự túc
        </div>

        <table class="items">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên hàng hóa, dịch vụ</th>
              <th>ĐVT</th>
              <th>Số lượng</th>
              <th>Đơn giá (USD)</th>
              <th>Thành tiền (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;">1</td>
              <td>Dịch vụ lưu trú tại chỗ ở: <strong>${placeTitle}</strong> (Mã đặt phòng: ${refCode})</td>
              <td style="text-align: center;">Đêm</td>
              <td style="text-align: center;">${nights}</td>
              <td style="text-align: right;">$${(total / nights).toFixed(2)}</td>
              <td style="text-align: right;">$${total.toFixed(2)}</td>
            </tr>
            <tr style="font-weight: 700; background: #F8F7FF;">
              <td colspan="5" style="text-align: right;">TỔNG TIỀN THANH TOÁN (USD):</td>
              <td style="text-align: right; color: #4F46E5;">$${total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div style="font-size: 11px; color: #5A6478;">
          * Đã bao gồm thuế GTGT và toàn bộ phí dịch vụ theo tiêu chuẩn minh bạch của WanderStay.
        </div>

        <div class="signature-box">
          <div class="stamp">
            ĐÃ KÝ ĐIỆN TỬ BỞI<br/>
            CÔNG TY CP CÔNG NGHỆ WANDERSTAY<br/>
            NGÀY KÝ: ${new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Lưu Hóa đơn điện tử VAT WanderStay',
      });
    }

    return { success: true, uri };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to export VAT Invoice' };
  }
}
