// Unit test cho cac ham thuan trong sepayService.ts
// Chi test logic doi tien / tao QR, KHONG goi Supabase.
// Mock module supabase vi no keo theo react-native-url-polyfill + AsyncStorage
// (chi dung trong 2 ham async checkBookingPaymentStatus / simulateConfirmPayment).
import { describe, it, expect, jest } from '@jest/globals';
jest.mock('../../lib/supabase', () => ({ supabase: {} }));

import {
  buildSepayQrUrl,
  convertUsdToVnd,
  formatVnd,
  getDemoPaymentAmountVnd,
} from '../sepayService';

describe('convertUsdToVnd', () => {
  it('doi $30 demo cua thay ra 750.000 VND (ty gia 25.000)', () => {
    expect(convertUsdToVnd(30)).toBe(750000);
  });
  it('doi $110 (5 dem) ra 2.750.000 VND', () => {
    expect(convertUsdToVnd(110)).toBe(2750000);
  });
  it('doi $20 mot dem ra 500.000 VND', () => {
    expect(convertUsdToVnd(20)).toBe(500000);
  });
  it('doi $0 ra 0', () => {
    expect(convertUsdToVnd(0)).toBe(0);
  });
});

describe('getDemoPaymentAmountVnd', () => {
  it('750.000 VND demo con 1.000 VND (toi thieu 1.000)', () => {
    expect(getDemoPaymentAmountVnd(750000)).toBe(1000);
  });
  it('2.750.000 VND demo con 2.750 VND', () => {
    expect(getDemoPaymentAmountVnd(2750000)).toBe(2750);
  });
  it('1.500.000 VND demo con 1.500 VND', () => {
    expect(getDemoPaymentAmountVnd(1500000)).toBe(1500);
  });
  it('so tien nho van khong duoi 1.000 VND', () => {
    expect(getDemoPaymentAmountVnd(500)).toBe(1000);
  });
});

describe('formatVnd', () => {
  it('dinh dang 750.000 VND dung kieu vi-VN', () => {
    expect(formatVnd(750000)).toBe('750.000 VNĐ');
  });
  it('dinh dang 1.000 VND', () => {
    expect(formatVnd(1000)).toBe('1.000 VNĐ');
  });
});

describe('buildSepayQrUrl', () => {
  it('tao URL QR SePay dung dinh dang, bo dau # khoi noi dung', () => {
    const url = buildSepayQrUrl(750000, '#WS-51088');
    expect(url.startsWith('https://qr.sepay.vn/img?')).toBe(true);
    expect(url).toContain('bank=BIDV');
    expect(url).toContain('amount=750000');
    expect(url).toContain('des=WS51088');
    expect(url).not.toContain('#');
  });
});
