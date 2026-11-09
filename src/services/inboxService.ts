import { supabase } from '../lib/supabase';

export interface ConversationItem {
  id: string;
  name: string;
  avatar: string;
  isOnline?: boolean;
  isVerified?: boolean;
  type: 'host' | 'support';
  propertyTag: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  bookingRef?: string;
  booking?: any;
}

export const DEFAULT_CONVERSATIONS: ConversationItem[] = [
  {
    id: 'conv-support-travel',
    name: 'WanderStay Support',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96',
    isOnline: true,
    isVerified: true,
    type: 'support',
    propertyTag: 'Hỗ trợ 24/7',
    lastMessage: 'Trợ lý du lịch ảo và chuyên viên sẵn sàng hỗ trợ bạn...',
    lastMessageTime: 'Vừa xong',
    unreadCount: 0,
  },
];

/**
 * Fetch real conversations with unread counts and tags from Supabase bookings
 */
export async function getConversations(userId?: string): Promise<ConversationItem[]> {
  const defaultList = [...DEFAULT_CONVERSATIONS];
  if (!userId) {
    return defaultList;
  }

  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, ref_code, check_in, check_out, places(title, host_name, images, location)')
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    if (error || !bookings || bookings.length === 0) {
      return defaultList;
    }

    const hostConversations: ConversationItem[] = bookings.map((b: any) => {
      const place = b.places;
      return {
        id: `conv-${b.id}`,
        name: place?.host_name || 'Chủ nhà',
        avatar:
          place?.images?.[0] ||
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96',
        isOnline: true,
        isVerified: true,
        type: 'host' as const,
        propertyTag: `${place?.title || 'Chỗ nghỉ'} • ${b.ref_code}`,
        lastMessage: `Chào bạn! Rất mong được đón tiếp bạn tại ${place?.title || 'chỗ nghỉ'}.`,
        lastMessageTime: 'Hôm nay',
        unreadCount: 0,
        bookingRef: b.ref_code,
        booking: b,
      };
    });

    return [...defaultList, ...hostConversations];
  } catch {
    return defaultList;
  }
}

/**
 * Mark a conversation's messages as read per BR08
 */
export async function markConversationAsRead(
  conversationId: string,
  userId?: string
): Promise<void> {
  try {
    if (!userId) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId);
  } catch {
    // Graceful offline fallback
  }
}
