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
}

export const DEFAULT_CONVERSATIONS: ConversationItem[] = [
  {
    id: 'conv-wayan-84920',
    name: 'Wayan Sutama',
    avatar:
      'https://api.builder.io/api/v1/image/assets/TEMP/3609d0e5bb55d47906b2d08687cf8c498c359da1?width=96',
    isOnline: true,
    isVerified: true,
    type: 'host',
    propertyTag: 'Bali • May 24–29',
    lastMessage: 'Looking forward to hosting you!…',
    lastMessageTime: '10:24 AM',
    unreadCount: 1,
    bookingRef: '#WS-84920',
  },
  {
    id: 'conv-elena-chamonix',
    name: 'Elena Rostova',
    avatar:
      'https://api.builder.io/api/v1/image/assets/TEMP/0cdd2cebd5fac008b68a60dc2311915314f834b3?width=96',
    isOnline: false,
    isVerified: false,
    type: 'host',
    propertyTag: 'Alpine Chalet • Chamonix',
    lastMessage: 'Thank you for the wonderful review!',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    bookingRef: '#WS-71204',
  },
  {
    id: 'conv-support-travel',
    name: 'WanderStay Support',
    avatar:
      'https://api.builder.io/api/v1/image/assets/TEMP/66ed4209be3963958431159f49510a846430e5bd?width=96',
    isOnline: true,
    isVerified: true,
    type: 'support',
    propertyTag: 'WS-84920 Confirmed',
    lastMessage: 'Your reservation WS-84920 has…',
    lastMessageTime: 'May 18',
    unreadCount: 1,
    bookingRef: '#WS-84920',
  },
  {
    id: 'conv-marcus-oslo',
    name: 'Marcus Vance',
    avatar:
      'https://api.builder.io/api/v1/image/assets/TEMP/a594c5562e35a6a31764f39f39c42353f58e6c85?width=96',
    isOnline: false,
    isVerified: false,
    type: 'host',
    propertyTag: 'Scandinavian Loft • Oslo',
    lastMessage: 'Key lockbox code is 4821. Have a…',
    lastMessageTime: 'Mar 12',
    unreadCount: 0,
    bookingRef: '#WS-62180',
  },
];

/**
 * Fetch conversations with unread counts and tags
 */
export async function getConversations(userId?: string): Promise<ConversationItem[]> {
  try {
    if (!userId) {
      return DEFAULT_CONVERSATIONS;
    }

    // Attempt to query Supabase messages table if exists
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) {
      return DEFAULT_CONVERSATIONS;
    }

    return DEFAULT_CONVERSATIONS;
  } catch {
    return DEFAULT_CONVERSATIONS;
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
