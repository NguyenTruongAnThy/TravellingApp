// Unit test cho ham thuan isSmartKeyActive trong smartKeyService.ts
// Quy tac BR03: Smart Key chi kich hoat tu 14:00 ngay check-in den 12:00 ngay check-out.
import { describe, it, expect } from '@jest/globals';
import { isSmartKeyActive } from '../smartKeyService';

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

describe('isSmartKeyActive', () => {
  it('dang o trong ky nghi (check-in hom qua, check-out ngay mai) thi kich hoat', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isSmartKeyActive(isoDate(yesterday), isoDate(tomorrow))).toBe(true);
  });

  it('chua toi ngay check-in (check-in ngay mai) thi chua kich hoat', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    expect(isSmartKeyActive(isoDate(tomorrow), isoDate(dayAfter))).toBe(false);
  });

  it('da qua ngay check-out (check-out hom qua) thi het kich hoat', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isSmartKeyActive(isoDate(twoDaysAgo), isoDate(yesterday))).toBe(false);
  });

  it('ngay khong hop le thi tra ve false', () => {
    expect(isSmartKeyActive('khong-phai-ngay', 'cung-khong-phai-ngay')).toBe(false);
  });
});
