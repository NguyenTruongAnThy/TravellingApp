import { supabase } from '../lib/supabase';

export type ProfileCounts = {
  trips: number;
  reviews: number;
  wishlists: number;
};

export interface UserPersonalInfo {
  legalName: string;
  preferredName: string;
  gender: string;
  dob: string;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  address: string;
  nationality: string;
  avatar: string;
  isVerified: boolean;
  idApprovalDate: string;
}

export const DEFAULT_PERSONAL_INFO: UserPersonalInfo = {
  legalName: 'Alex Morgan',
  preferredName: 'Alex',
  gender: 'Prefer not to say',
  dob: 'May 14, 1992',
  email: 'alex.morgan@example.com',
  phone: '+1 (555) 234-5678',
  emergencyContactName: 'Sarah Morgan',
  emergencyContactRelation: 'Sister',
  emergencyContactPhone: '+1 (555) 876-5432',
  address: '742 Evergreen Terrace, Springfield, OR 97477, United States',
  nationality: 'United States',
  avatar:
    'https://api.builder.io/api/v1/image/assets/TEMP/3dee90d991ac09d4bdf61b1c226089b93db99a99?width=192',
  isVerified: true,
  idApprovalDate: 'April 12, 2024',
};

export async function getProfileCounts(userId: string): Promise<ProfileCounts> {
  const [bookings, reviews, favorites] = await Promise.all([
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'cancelled'),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  if (bookings.error || reviews.error || favorites.error) {
    throw new Error('Failed to load profile counts.');
  }

  return {
    trips: bookings.count || 0,
    reviews: reviews.count || 0,
    wishlists: favorites.count || 0,
  };
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('name, phone, email')
    .eq('id', userId)
    .single();
  if (error) return { data: null, error };
  return { data, error: null };
}

export async function saveProfile(
  userId: string,
  email: string,
  name: string,
  phone: string
) {
  const { error } = await supabase
    .from('users')
    .upsert({ id: userId, email, name: name.trim(), phone: phone.trim() || null });
  if (error) throw error;
}

export interface PaymentCardItem {
  id: string;
  type: 'visa' | 'mastercard' | 'apple_pay' | 'paypal';
  title: string;
  subtitle: string;
  expiry?: string;
  isDefault?: boolean;
  badge?: string;
  secondaryText?: string;
  actionText?: string;
}

export interface PayoutAccountItem {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  status: string;
}

export interface WalletTransactionItem {
  id: string;
  title: string;
  dateText: string;
  amount: number;
  badge: string;
  isCredit: boolean;
  receiptBookingId?: string;
}

export interface WalletData {
  balance: number;
  currency: string;
  autoApply: boolean;
  cards: PaymentCardItem[];
  payouts: PayoutAccountItem[];
  transactions: WalletTransactionItem[];
}

export const DEFAULT_WALLET_DATA: WalletData = {
  balance: 120.0,
  currency: 'USD',
  autoApply: true,
  cards: [
    {
      id: 'card-1',
      type: 'visa',
      title: 'Visa ending in 4242',
      subtitle: 'Expires 08/27',
      isDefault: true,
      badge: 'Default payment method',
      secondaryText: 'Physical Card',
    },
    {
      id: 'card-2',
      type: 'mastercard',
      title: 'Mastercard ending in 8831',
      subtitle: 'Expires 11/26',
      isDefault: false,
      secondaryText: 'Backup for automatic renewals',
      actionText: 'Make default',
    },
    {
      id: 'wallet-1',
      type: 'apple_pay',
      title: 'Apple Pay',
      subtitle: 'Ready for 1-tap checkout',
      isDefault: false,
    },
    {
      id: 'wallet-2',
      type: 'paypal',
      title: 'PayPal',
      subtitle: 'alex.morgan@example.com',
      isDefault: false,
    },
  ],
  payouts: [
    {
      id: 'payout-1',
      bankName: 'Chase Bank',
      accountNumber: '...9012',
      accountType: 'Direct Deposit (ACH)',
      status: 'Active & Verified',
    },
  ],
  transactions: [
    {
      id: 'tx-1',
      title: 'Balian Treehouse Stay',
      dateText: 'May 12, 2024 • Paid',
      amount: -450.0,
      badge: 'Receipt',
      isCredit: false,
    },
    {
      id: 'tx-2',
      title: 'Travel Credit Promo',
      dateText: 'Apr 20, 2024 • Bonus',
      amount: 50.0,
      badge: 'Applied',
      isCredit: true,
    },
  ],
};
