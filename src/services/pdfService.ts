import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { SmartKeyInfo } from './smartKeyService';
import { generateBarcodeSvg, generateQRCodeDataUrl } from '../utils/barcode';

/**
 * Safely shares or prints a PDF file across Android / iOS / Expo Go environments.
 * If Sharing.shareAsync fails due to Android Scoped Storage / Expo Go sandbox permissions,
 * it seamlessly falls back to Print.printAsync (Android Print Spooler with "Save as PDF" option).
 */
async function shareOrPrintPdf(
  html: string,
  tempUri: string,
  fileName: string,
  dialogTitle: string
): Promise<string> {
  let targetUri = tempUri;

  // 1. Attempt to copy to standard documentDirectory for better sandbox permissions
  if (FileSystem.documentDirectory) {
    try {
      const dest = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.copyAsync({
        from: tempUri,
        to: dest,
      });
      targetUri = dest;
    } catch {
      targetUri = tempUri;
    }
  }

  // 2. Try Sharing.shareAsync; fallback to Print.printAsync if system blocks file access
  if (await Sharing.isAvailableAsync()) {
    try {
      await Sharing.shareAsync(targetUri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle,
      });
      return targetUri;
    } catch (shareErr) {
      console.warn('ExpoSharing rejected, falling back to Print.printAsync:', shareErr);
      await Print.printAsync({ html });
      return targetUri;
    }
  } else {
    await Print.printAsync({ html });
    return targetUri;
  }
}

/**
 * Generates and shares a professional PDF Trip Receipt with QR Verification & Barcode (UC011)
 */
export async function exportTripReceiptPDF(
  booking: any,
  isVi: boolean = true
): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    const place = booking?.places || booking?.place;
    const refCode = booking?.ref_code || '#WS-84920';
    const cleanRef = refCode.replace('#', '');
    const receiptNumber = booking?.ref_code
      ? `#REC-${cleanRef}`
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

    // 1. Generate offline Verification QR Code
    const qrData = `WANDERSTAY VERIFIED STAY\nBooking Ref: ${refCode}\nReceipt No: ${receiptNumber}\nProperty: ${placeTitle}\nDates: ${checkIn} -> ${checkOut}\nGuests: ${totalGuests}\nAmount: $${total.toFixed(2)} USD\nStatus: ${isCancelled ? 'CANCELLED' : 'PAID & CONFIRMED'}\nIssued: ${issuedDate}`;
    const qrCodeDataUrl = await generateQRCodeDataUrl(qrData, 140);

    // 2. Generate vector Barcode Code-128
    const barcodeSvg = generateBarcodeSvg(cleanRef, 36);

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
            padding: 28px 32px;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #E6E3F5;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .brand-logo {
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #4F46E5 0%, #7C5CFC 100%);
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
            font-size: 11px;
            color: #5A6478;
          }
          .receipt-meta {
            text-align: right;
          }
          .receipt-title {
            font-size: 18px;
            font-weight: 800;
            color: #131B2E;
            margin-bottom: 2px;
          }
          .receipt-id {
            font-size: 13px;
            font-weight: 700;
            color: #4F46E5;
          }
          .banner {
            background: #F8F7FF;
            border: 1px solid #E6E3F5;
            border-radius: 14px;
            padding: 16px 20px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .banner-total-label {
            font-size: 11px;
            font-weight: 600;
            color: #5A6478;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .banner-total-amount {
            font-size: 28px;
            font-weight: 900;
            color: #131B2E;
            line-height: 1.1;
          }
          .verify-card {
            background: #F8F7FF;
            border: 1px dashed #4F46E5;
            border-radius: 14px;
            padding: 14px 20px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .verify-qr-box {
            background: #FFFFFF;
            border: 1px solid #C7D2FE;
            border-radius: 10px;
            padding: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(79, 70, 229, 0.08);
          }
          .section-title {
            font-size: 13px;
            font-weight: 700;
            color: #5A6478;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
            margin-bottom: 20px;
          }
          .card {
            background: #F8F7FF;
            border: 1px solid #E6E3F5;
            border-radius: 12px;
            padding: 14px;
          }
          .card-label {
            font-size: 10px;
            font-weight: 700;
            color: #5A6478;
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          .card-value {
            font-size: 13px;
            font-weight: 700;
            color: #131B2E;
          }
          .card-sub {
            font-size: 11px;
            color: #5A6478;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background: #F8F7FF;
            text-align: left;
            padding: 10px 14px;
            font-size: 11px;
            font-weight: 700;
            color: #5A6478;
            border-bottom: 1px solid #E6E3F5;
            text-transform: uppercase;
          }
          td {
            padding: 10px 14px;
            border-bottom: 1px solid #F1F0FA;
            font-size: 12px;
          }
          .total-row td {
            background: #EEF2FF;
            font-weight: 800;
            font-size: 14px;
            color: #4F46E5;
            border-top: 2px solid #C7D2FE;
            border-bottom: none;
          }
          .policy-box {
            background: #FFFBEB;
            border: 1px solid #FDE68A;
            border-radius: 10px;
            padding: 12px 16px;
            margin-bottom: 18px;
            font-size: 11px;
            color: #92400E;
            line-height: 1.5;
          }
          .cancel-box {
            background: #FEF2F2;
            border: 1px solid #FECACA;
            border-radius: 10px;
            padding: 12px 16px;
            margin-bottom: 18px;
            font-size: 11px;
            color: #991B1B;
            line-height: 1.5;
          }
          .footer {
            border-top: 1px solid #E6E3F5;
            padding-top: 16px;
            text-align: center;
            font-size: 10px;
            color: #8A90A6;
            line-height: 1.5;
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
            <div style="font-size: 11px; color: #5A6478; margin-top: 2px;">${isVi ? 'Ngày phát hành:' : 'Issued:'} ${issuedDate}</div>
          </div>
        </div>

        <div class="banner">
          <div>
            <div class="banner-total-label">${isCancelled ? (isVi ? 'Tổng tiền ban đầu' : 'Original Amount') : (isVi ? 'Tổng tiền đã thanh toán' : 'Total Amount Paid')}</div>
            <div class="banner-total-amount">$${total.toFixed(2)} USD</div>
            <div style="font-size: 11px; color: #5A6478; margin-top: 4px;">
              ${paymentMethod} • Ref: <strong>${refCode}</strong>
            </div>
          </div>
          <div>
            ${statusBadge}
          </div>
        </div>

        <!-- Verification & Barcode Section -->
        <div class="verify-card">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div class="verify-qr-box">
              <img src="${qrCodeDataUrl}" width="84" height="84" style="display: block;" alt="Verification QR" />
            </div>
            <div>
              <div style="font-size: 10px; font-weight: 800; color: #4F46E5; letter-spacing: 0.5px; text-transform: uppercase;">
                ${isVi ? 'XÁC THỰC KỲ NGHỈ CHÍNH THỨC' : 'OFFICIAL STAY VERIFICATION'}
              </div>
              <div style="font-size: 12px; font-weight: 700; color: #131B2E; margin-top: 2px;">
                ${isVi ? 'Quét mã để đối soát & xác minh đơn phòng' : 'Scan QR code to verify reservation'}
              </div>
              <div style="font-size: 11px; color: #5A6478; margin-top: 3px; line-height: 1.4;">
                ${isVi ? 'Dùng Camera điện thoại quét để tra cứu đơn đặt phòng tức thì.' : 'Use any mobile phone camera to instantly inspect stay details.'}
              </div>
            </div>
          </div>
          <div style="text-align: right; margin-left: 14px;">
            ${barcodeSvg}
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
          ${isVi ? 'Biên nhận điện tử có mã QR và mã vạch Barcode bảo chứng, có giá trị xác thực trên toàn hệ thống WanderStay.' : 'This electronic receipt is computer-generated with verification QR and Barcode verified across the WanderStay network.'}
        </div>
      </body>
      </html>
    `;

    // 1. Generate real PDF file
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // 2. Safely share with fallback to native Android Print/Save-as-PDF
    const safeFileName = `WanderStay_${cleanRef}_Receipt.pdf`;
    const finalUri = await shareOrPrintPdf(
      html,
      uri,
      safeFileName,
      isVi ? 'Lưu hoặc chia sẻ biên nhận WanderStay' : 'Save or Share WanderStay Receipt'
    );

    return { success: true, uri: finalUri };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to export PDF' };
  }
}

/**
 * Generates and shares an Offline Check-in & Smart Key Guide PDF with Gate QR Pass & WiFi QR (UC013)
 */
export async function exportSmartKeyGuidePDF(
  data: SmartKeyInfo,
  isVi: boolean = true
): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    const cleanRef = data.refCode.replace('#', '');

    // 1. Generate Gate QR Pass
    const gateQrData = `WANDERSTAY:GATE_PASS:${data.refCode}:${data.pinCode || '4821#'}:${data.placeTitle}`;
    const gateQrCodeUrl = await generateQRCodeDataUrl(gateQrData, 140);

    // 2. Generate WiFi Auto-Connect QR Code (standard WiFi QR format)
    const wifiQrData = `WIFI:S:${data.wifiSSID};T:WPA;P:${data.wifiPassword};;`;
    const wifiQrCodeUrl = await generateQRCodeDataUrl(wifiQrData, 130);

    // 3. Generate vector Barcode Code-128
    const barcodeSvg = generateBarcodeSvg(cleanRef, 34);

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
            padding: 28px 32px;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #E6E3F5;
            padding-bottom: 18px;
            margin-bottom: 20px;
          }
          .brand {
            font-size: 24px;
            font-weight: 800;
            color: #4F46E5;
          }
          .guide-title {
            font-size: 16px;
            font-weight: 800;
            color: #131B2E;
            margin-top: 2px;
          }
          .key-banner {
            background: #EEF2FF;
            border: 2px dashed #4F46E5;
            border-radius: 14px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .pin-title {
            font-size: 11px;
            font-weight: 800;
            color: #5A6478;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .pin-code {
            font-size: 38px;
            font-weight: 900;
            color: #4F46E5;
            letter-spacing: 6px;
            margin: 6px 0;
            font-family: monospace;
          }
          .wifi-box {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #FFFFFF;
            border: 1px solid #C7D2FE;
            border-radius: 12px;
            padding: 14px 18px;
            margin-top: 14px;
          }
          .step-list {
            margin-bottom: 20px;
          }
          .step-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 12px;
            background: #F8F7FF;
            border: 1px solid #E6E3F5;
            border-radius: 12px;
            padding: 12px 14px;
          }
          .step-num {
            width: 26px;
            height: 26px;
            background: #4F46E5;
            color: #FFFFFF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 12px;
            flex-shrink: 0;
          }
          .host-card {
            background: #F8F7FF;
            border: 1px solid #E6E3F5;
            border-radius: 12px;
            padding: 14px 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .footer {
            border-top: 1px solid #E6E3F5;
            padding-top: 14px;
            text-align: center;
            font-size: 10px;
            color: #8A90A6;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">WanderStay</div>
            <div class="guide-title">${isVi ? 'CẨM NANG NHẬN PHÒNG & CHÌA KHÓA SỐ NGOẠI TUYẾN' : 'OFFLINE CHECK-IN & SMART KEY GUIDE'}</div>
            <div style="font-size: 11px; color: #5A6478; margin-top: 2px;">
              ${data.placeTitle} • Ref: <strong>${data.refCode}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            ${barcodeSvg}
          </div>
        </div>

        <!-- Keyless Smart Access & Gate QR Pass -->
        <div class="key-banner">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="text-align: left;">
              <div class="pin-title">${isVi ? 'MÃ PIN MỞ CỬA CHÍNH (KEYLESS SMART PIN)' : 'MAIN DOOR SMART KEY PIN'}</div>
              <div class="pin-code">${data.pinCode || '4821#'}</div>
              <div style="font-size: 11px; color: #4F46E5; font-weight: 600;">
                ${isVi ? '✓ Tự động kích hoạt từ 14:00 ngày nhận phòng (chuẩn BR03)' : '✓ Automatically active from 14:00 on check-in day'}
              </div>
              <div style="font-size: 11px; color: #5A6478; margin-top: 4px;">
                ${isVi ? 'Nhập mã trên bàn phím số khóa cửa thông minh kèm dấu #' : 'Type digits ending with # on digital keypad'}
              </div>
            </div>

            <!-- Gate Pass QR -->
            <div style="background: #FFFFFF; border: 1px solid #C7D2FE; border-radius: 10px; padding: 6px; text-align: center;">
              <img src="${gateQrCodeUrl}" width="80" height="80" style="display: block;" alt="Gate QR Pass" />
              <div style="font-size: 9px; font-weight: 800; color: #4F46E5; margin-top: 2px;">GATE QR PASS</div>
            </div>
          </div>

          <!-- WiFi Auto-Connect Section -->
          <div class="wifi-box">
            <div>
              <div style="font-size: 10px; color: #5A6478; font-weight: 700; text-transform: uppercase;">WIFI NETWORK</div>
              <div style="font-size: 13px; font-weight: 800; color: #131B2E;">${data.wifiSSID}</div>
              <div style="font-size: 10px; color: #5A6478; font-weight: 700; text-transform: uppercase; margin-top: 4px;">PASSWORD</div>
              <div style="font-size: 13px; font-weight: 800; color: #4F46E5; font-family: monospace;">${data.wifiPassword}</div>
            </div>

            <div style="display: flex; align-items: center; gap: 10px; border-left: 1px solid #E6E3F5; padding-left: 14px;">
              <div style="text-align: right;">
                <div style="font-size: 10px; font-weight: 800; color: #059669; text-transform: uppercase;">
                  ${isVi ? 'QUÉT KẾT NỐI WIFI' : 'SCAN TO CONNECT'}
                </div>
                <div style="font-size: 10px; color: #5A6478; max-width: 130px; line-height: 1.3;">
                  ${isVi ? 'Dùng camera quét để vào Wifi ngay không cần nhập pass' : 'Scan with phone camera to join automatically'}
                </div>
              </div>
              <div style="background: #FFFFFF; border: 1px solid #C7D2FE; border-radius: 8px; padding: 4px;">
                <img src="${wifiQrCodeUrl}" width="68" height="68" style="display: block;" alt="WiFi QR" />
              </div>
            </div>
          </div>
        </div>

        <div style="font-size: 12px; font-weight: 700; color: #5A6478; text-transform: uppercase; margin-bottom: 10px;">
          ${isVi ? '3 Bước nhận phòng nhanh' : '3 Quick Check-in Steps'}
        </div>
        <div class="step-list">
          <div class="step-item">
            <div class="step-num">1</div>
            <div>
              <div style="font-weight: 700; color: #131B2E;">${isVi ? 'Đến đúng địa chỉ và xác nhận khóa cửa' : 'Locate the entrance keypad'}</div>
              <div style="font-size: 11px; color: #5A6478; margin-top: 2px;">
                ${data.address}
              </div>
            </div>
          </div>
          <div class="step-item">
            <div class="step-num">2</div>
            <div>
              <div style="font-weight: 700; color: #131B2E;">${isVi ? 'Nhập mã PIN hoặc quét Gate QR Pass' : 'Enter PIN or scan Gate QR Pass'}</div>
              <div style="font-size: 11px; color: #5A6478; margin-top: 2px;">
                ${isVi ? 'Nhập mã PIN 4821# (hoặc đưa mã Gate QR Pass trước camera đầu đọc). Đèn xanh sẽ sáng và khóa mở chốt trong 5 giây.' : 'Enter PIN 4821# or show Gate QR Pass to the reader. Green LED blinks and lock disengages for 5 seconds.'}
              </div>
            </div>
          </div>
          <div class="step-item">
            <div class="step-num">3</div>
            <div>
              <div style="font-weight: 700; color: #131B2E;">${isVi ? 'Lấy thẻ từ phụ và tận hưởng kỳ nghỉ' : 'Collect spare RFID card inside'}</div>
              <div style="font-size: 11px; color: #5A6478; margin-top: 2px;">
                ${isVi ? 'Thẻ từ vật lý dự phòng được đặt tại bàn đón tiếp trong phòng khách để bạn tiện mang theo khi ra ngoài.' : 'A physical backup card key is waiting on the main living room counter.'}
              </div>
            </div>
          </div>
        </div>

        <div class="host-card">
          <div>
            <div style="font-size: 10px; font-weight: 700; color: #5A6478; text-transform: uppercase; margin-bottom: 3px;">
              ${isVi ? 'LIÊN HỆ CHỦ NHÀ & KHẨN CẤP' : 'HOST & EMERGENCY CONTACT'}
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #131B2E;">${data.hostName}</div>
            <div style="font-size: 11px; color: #5A6478; margin-top: 2px;">
              Hotline: <strong>${data.hostPhone || '+62 812 3456 7890'}</strong> • ${isVi ? 'Phản hồi trong 5 phút' : 'Typically replies in 5m'}
            </div>
          </div>
          <div style="background: #EEF2FF; color: #4F46E5; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 9999px;">
            ${isVi ? 'Chủ nhà siêu cấp' : 'Superhost'}
          </div>
        </div>

        <div class="footer">
          WanderStay Keyless Access Guide • Cẩm nang ngoại tuyến có mã Gate Pass QR & Wifi QR để tra cứu khi mất sóng 4G.
        </div>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const safeFileName = `WanderStay_SmartKey_${cleanRef}_Guide.pdf`;
    const finalUri = await shareOrPrintPdf(
      html,
      uri,
      safeFileName,
      isVi ? 'Lưu cẩm nang nhận phòng ngoại tuyến' : 'Save Offline Smart Key Guide'
    );

    return { success: true, uri: finalUri };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to export Smart Key Guide' };
  }
}

/**
 * Generates and shares an official VAT / E-Invoice PDF with Verification QR & Barcode (UC016)
 */
export async function exportVatInvoicePDF(
  booking: any,
  isVi: boolean = true
): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    const refCode = booking?.ref_code || '#WS-84920';
    const cleanRef = refCode.replace('#', '');
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const place = booking?.places || booking?.place;
    const placeTitle = place?.title || 'WanderStay Resort Stay';
    const total = Number(booking?.total || 110);
    const nights = Number(booking?.nights || 1);

    // 1. Generate VAT Verification QR
    const vatQrData = `HOA DON DIEN TU VAT\nSo HD: ${invoiceNumber}\nMa dat phong: ${refCode}\nCo so: ${placeTitle}\nTong thanh toan: $${total.toFixed(2)} USD\nNgay ky: ${new Date().toLocaleDateString('vi-VN')}\nTra cuu tai: https://wanderstay.app/einvoice/${invoiceNumber}`;
    const vatQrUrl = await generateQRCodeDataUrl(vatQrData, 120);

    // 2. Generate vector Barcode Code-128
    const barcodeSvg = generateBarcodeSvg(invoiceNumber, 32);

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
            padding: 32px;
            font-size: 13px;
            line-height: 1.5;
          }
          .header-grid {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #E6E3F5;
            padding-bottom: 18px;
            margin-bottom: 18px;
          }
          .title {
            font-size: 19px;
            font-weight: 900;
            color: #4F46E5;
            text-transform: uppercase;
          }
          .sub-title {
            font-size: 11px;
            color: #5A6478;
            margin-top: 2px;
          }
          .info-table {
            width: 100%;
            margin-bottom: 16px;
            border-bottom: 1px solid #E6E3F5;
            padding-bottom: 14px;
            font-size: 12px;
            line-height: 1.6;
          }
          table.items {
            width: 100%;
            border-collapse: collapse;
            margin: 18px 0;
          }
          table.items th, table.items td {
            border: 1px solid #E6E3F5;
            padding: 9px 12px;
            font-size: 12px;
          }
          table.items th {
            background: #F8F7FF;
            font-weight: 700;
          }
          .bottom-section {
            margin-top: 28px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .stamp {
            border: 2px solid #059669;
            color: #059669;
            padding: 10px 16px;
            border-radius: 8px;
            font-weight: 800;
            text-align: center;
            font-size: 10px;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="header-grid">
          <div>
            <div class="title">HÓA ĐƠN GIÁ TRỊ GIA TĂNG (E-INVOICE)</div>
            <div class="sub-title">Ký hiệu: <strong>WS-26/01</strong> • Số: <strong>${invoiceNumber}</strong> • Ngày: <strong>${new Date().toLocaleDateString('vi-VN')}</strong></div>
          </div>
          <div style="text-align: right;">
            ${barcodeSvg}
          </div>
        </div>

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
              <th style="width: 40px; text-align: center;">STT</th>
              <th>Tên hàng hóa, dịch vụ</th>
              <th style="width: 60px; text-align: center;">ĐVT</th>
              <th style="width: 70px; text-align: center;">Số lượng</th>
              <th style="width: 100px; text-align: right;">Đơn giá (USD)</th>
              <th style="width: 110px; text-align: right;">Thành tiền (USD)</th>
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

        <div class="bottom-section">
          <div style="display: flex; align-items: center; gap: 12px; background: #F8F7FF; border: 1px solid #E6E3F5; border-radius: 10px; padding: 10px 14px;">
            <img src="${vatQrUrl}" width="70" height="70" style="display: block;" alt="VAT QR" />
            <div>
              <div style="font-size: 10px; font-weight: 800; color: #4F46E5;">TRA CỨU HÓA ĐƠN ĐIỆN TỬ</div>
              <div style="font-size: 10px; color: #5A6478; margin-top: 2px;">Quét mã QR bằng Camera để tra cứu tính hợp lệ hóa đơn trên hệ thống WanderStay.</div>
            </div>
          </div>

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

    const safeFileName = `WanderStay_VAT_${invoiceNumber}.pdf`;
    const finalUri = await shareOrPrintPdf(
      html,
      uri,
      safeFileName,
      'Lưu Hóa đơn điện tử VAT WanderStay'
    );

    return { success: true, uri: finalUri };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to export VAT Invoice' };
  }
}
