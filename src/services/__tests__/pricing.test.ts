import { describe, it, expect } from '@jest/globals';
import { calculatePricing, generateRefCode } from '../pricing';

describe('calculatePricing', () => {
  it('tính đúng giá demo của thầy: $20 x 1 đêm + Kayak $5 + Parking $5 = $30', () => {
    const r = calculatePricing(20, 1, 5, 5);
    expect(r.accommodationTotal).toBe(20);
    expect(r.total).toBe(30);
    expect(r.depositAmount).toBe(15);
    expect(r.remainingAmount).toBe(15);
  });

  it('tính đúng 5 đêm: $20 x 5 + $5 + $5 = $110', () => {
    const r = calculatePricing(20, 5, 5, 5);
    expect(r.accommodationTotal).toBe(100);
    expect(r.total).toBe(110);
    expect(r.depositAmount).toBe(55);
    expect(r.remainingAmount).toBe(55);
  });

  it('không phụ phí thì tổng bằng giá phòng', () => {
    const r = calculatePricing(20, 1);
    expect(r.total).toBe(20);
    expect(r.depositAmount).toBe(10);
    expect(r.remainingAmount).toBe(10);
  });

  it('đặt cọc luôn bằng đúng 50% tổng', () => {
    const r = calculatePricing(33, 3, 7, 2);
    expect(r.total).toBe(108);
    expect(r.depositAmount).toBe(54);
    expect(r.depositAmount + r.remainingAmount).toBe(r.total);
  });

  it('số đêm nhỏ hơn 1 thì tính là 1 đêm, giá âm thì tính là 0', () => {
    const r = calculatePricing(-10, 0, -5, -5);
    expect(r.nights).toBe(1);
    expect(r.pricePerNight).toBe(0);
    expect(r.total).toBe(0);
  });
});

describe('generateRefCode', () => {
  it('trả về mã dạng #WS-xxxxx (5 chữ số)', () => {
    const code = generateRefCode();
    expect(code).toMatch(/^#WS-\d{5}$/);
  });

  it('hai lần gọi cho hai mã khác nhau', () => {
    expect(generateRefCode()).not.toBe(generateRefCode());
  });
});
