import AsyncStorage from '@react-native-async-storage/async-storage';
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
  legalName: '',
  preferredName: '',
  gender: 'Prefer not to say',
  dob: '',
  email: '',
  phone: '',
  emergencyContactName: '',
  emergencyContactRelation: '',
  emergencyContactPhone: '',
  address: '',
  nationality: 'Vietnam',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
  isVerified: false,
  idApprovalDate: 'Chưa xác minh',
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
    throw new Error('Could not load profile stats.');
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
    .select('name, phone, email, avatar_url')
    .eq('id', userId)
    .single();

  let localAvatar = '';
  try {
    localAvatar = (await AsyncStorage.getItem(`@user_avatar_${userId}`)) || '';
  } catch {}

  const finalAvatar = data?.avatar_url || localAvatar || '';

  if (error || !data) {
    return {
      data: {
        name: '',
        phone: '',
        email: '',
        avatar_url: finalAvatar,
      },
      error: null,
    };
  }

  return {
    data: {
      ...data,
      avatar_url: finalAvatar,
    },
    error: null,
  };
}

export async function saveProfile(
  userId: string,
  email: string,
  name: string,
  phone: string,
  avatarUrl?: string
) {
  const payload: any = { id: userId, email, name: name.trim(), phone: phone.trim() || null };
  if (avatarUrl) {
    payload.avatar_url = avatarUrl;
    try {
      await AsyncStorage.setItem(`@user_avatar_${userId}`, avatarUrl);
    } catch {}
  }
  const { error } = await supabase
    .from('users')
    .upsert(payload);
  if (error) throw error;
}

export async function getUserPersonalInfo(userId: string): Promise<UserPersonalInfo> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  let localAvatar = '';
  try {
    localAvatar = (await AsyncStorage.getItem(`@user_avatar_${userId}`)) || '';
  } catch {}

  if (error || !data) {
    return {
      legalName: '',
      preferredName: '',
      gender: 'Prefer not to say',
      dob: '',
      email: '',
      phone: '',
      emergencyContactName: '',
      emergencyContactRelation: '',
      emergencyContactPhone: '',
      address: '',
      nationality: 'Vietnam',
      avatar: localAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      isVerified: false,
      idApprovalDate: 'April 12, 2024',
    };
  }

  const isVerified = data.gov_id_status === 'approved' || data.gov_id_status === 'active';
  const approvalDate = data.created_at
    ? new Date(data.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'April 12, 2024';

  return {
    legalName: data.name || '',
    preferredName: data.preferred_name || (data.name ? data.name.split(' ')[0] : ''),
    gender: data.gender || 'Prefer not to say',
    dob: data.date_of_birth || '',
    email: data.email || '',
    phone: data.phone || '',
    emergencyContactName: data.emergency_contact_name || '',
    emergencyContactRelation: data.emergency_contact_relation || 'Family',
    emergencyContactPhone: data.emergency_contact_phone || '',
    address: data.address || '',
    nationality: data.nationality || 'Vietnam',
    avatar:
      data.avatar_url ||
      localAvatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    isVerified,
    idApprovalDate: approvalDate,
  };
}

export async function updateUserPersonalInfo(
  userId: string,
  info: Partial<UserPersonalInfo>
): Promise<void> {
  const updatePayload: Record<string, any> = { id: userId };

  if (info.legalName !== undefined) updatePayload.name = info.legalName.trim();
  if (info.preferredName !== undefined) updatePayload.preferred_name = info.preferredName.trim();
  if (info.gender !== undefined) updatePayload.gender = info.gender.trim();
  if (info.dob !== undefined) updatePayload.date_of_birth = info.dob.trim();
  if (info.email !== undefined) updatePayload.email = info.email.trim();
  if (info.phone !== undefined) updatePayload.phone = info.phone.trim();
  if (info.emergencyContactName !== undefined)
    updatePayload.emergency_contact_name = info.emergencyContactName.trim();
  if (info.emergencyContactRelation !== undefined)
    updatePayload.emergency_contact_relation = info.emergencyContactRelation.trim();
  if (info.emergencyContactPhone !== undefined)
    updatePayload.emergency_contact_phone = info.emergencyContactPhone.trim();
  if (info.address !== undefined) updatePayload.address = info.address.trim();
  if (info.nationality !== undefined) updatePayload.nationality = info.nationality.trim();
  if (info.avatar !== undefined) {
    updatePayload.avatar_url = info.avatar.trim();
    try {
      await AsyncStorage.setItem(`@user_avatar_${userId}`, info.avatar.trim());
    } catch {}
  }

  // Use upsert to create or update user record
  const { error } = await supabase.from('users').upsert(updatePayload);
  if (error) {
    await supabase.from('users').update(updatePayload).eq('id', userId);
  }
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

export interface SecurityDevice {
  id: string;
  name: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  deviceType: 'phone' | 'laptop' | 'tablet';
}

export interface SecurityHealthData {
  score: number;
  status: string;
  level: string;
  safeguardsConfigured: number;
  totalSafeguards: number;
  masterPasswordLastUpdated: string;
  googleConnectedEmail: string;
  appleConnected: boolean;
  twoFactorEnabled: boolean;
  smsPhone: string;
  authenticatorApp: string;
  backupCodesRemaining: number;
  devices: SecurityDevice[];
}

export const DEFAULT_SECURITY_DATA: SecurityHealthData = {
  score: 92,
  status: 'Strong',
  level: 'Optimal',
  safeguardsConfigured: 4,
  totalSafeguards: 4,
  masterPasswordLastUpdated: '3 months ago',
  googleConnectedEmail: 'alex.morgan@gmail.com',
  appleConnected: true,
  twoFactorEnabled: true,
  smsPhone: '+1 (555) •••-5678',
  authenticatorApp: 'Google Authenticator',
  backupCodesRemaining: 8,
  devices: [
    {
      id: 'dev-1',
      name: 'iPhone 15 Pro',
      location: 'Bali, Indonesia',
      lastActive: 'Active now',
      isCurrent: true,
      deviceType: 'phone',
    },
    {
      id: 'dev-2',
      name: 'MacBook Pro 16"',
      location: 'Denpasar, Bali',
      lastActive: 'Active 2 hours ago',
      isCurrent: false,
      deviceType: 'laptop',
    },
    {
      id: 'dev-3',
      name: 'iPad Air',
      location: 'Oregon, USA',
      lastActive: 'May 10, 2024',
      isCurrent: false,
      deviceType: 'tablet',
    },
  ],
};
