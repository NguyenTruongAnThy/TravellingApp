/**
 * WanderStay Pricing Service (BR01 & BR06)
 * Strict transparent pricing - zero hidden fees.
 */

export interface PricingBreakdown {
  pricePerNight: number;
  nights: number;
  accommodationTotal: number;
  kayakFee: number;
  parkingFee: number;
  total: number;
  depositAmount: number; // 50% deposit for pay_a_part_now
  remainingAmount: number; // total - depositAmount
}

export function calculatePricing(
  pricePerNight: number,
  nights: number,
  kayakFee: number = 0,
  parkingFee: number = 0
): PricingBreakdown {
  const safeNights = Math.max(1, nights);
  const safePrice = Math.max(0, pricePerNight);
  const safeKayak = Math.max(0, kayakFee);
  const safeParking = Math.max(0, parkingFee);

  const accommodationTotal = safePrice * safeNights;
  const total = accommodationTotal + safeKayak + safeParking;
  const depositAmount = Math.round(total * 0.5 * 100) / 100;
  const remainingAmount = Math.round((total - depositAmount) * 100) / 100;

  return {
    pricePerNight: safePrice,
    nights: safeNights,
    accommodationTotal,
    kayakFee: safeKayak,
    parkingFee: safeParking,
    total,
    depositAmount,
    remainingAmount,
  };
}

export function generateRefCode(): string {
  const random5Digits = Math.floor(10000 + Math.random() * 90000);
  return `#WS-${random5Digits}`;
}
