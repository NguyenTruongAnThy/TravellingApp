export interface SmartKeyInfo {
  bookingId: string;
  refCode: string;
  placeTitle: string;
  placeLocation: string;
  category: string;
  image: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  pinCode: string;
  isPinActive: boolean;
  activeStatusMessage: string;
  bluetoothSyncReady: boolean;
  wifiSSID: string;
  wifiPassword: string;
  hostName: string;
  hostAvatar: string;
  hostReplyTime: string;
  hostPhone?: string;
  mapCoordinates?: {
    latitude: number;
    longitude: number;
  };
  address: string;
  checkInSteps: Array<{
    step: number;
    title: string;
    description: string;
    pinHighlight?: string;
  }>;
  etiquetteRules: Array<{
    id: string;
    text: string;
    icon: string;
  }>;
}

/**
 * Checks whether smart key is currently active per BR03:
 * Active from 14:00 on check_in day until 12:00 on check_out day.
 */
export function isSmartKeyActive(checkInDateStr: string, checkOutDateStr: string): boolean {
  try {
    const now = new Date();
    const checkIn = new Date(checkInDateStr);
    checkIn.setHours(14, 0, 0, 0);

    const checkOut = new Date(checkOutDateStr);
    checkOut.setHours(12, 0, 0, 0);

    return now >= checkIn && now <= checkOut;
  } catch {
    return false;
  }
}

/**
 * Returns Smart Key details for booking (defaults to Balian Treehouse #WS-84920 per Figma specs)
 */
export function getSmartKeyDetails(booking?: any): SmartKeyInfo {
  const checkInDate = booking?.check_in || '2024-05-24';
  const checkOutDate = booking?.check_out || '2024-05-29';
  const active = isSmartKeyActive(checkInDate, checkOutDate);

  return {
    bookingId: booking?.id || 'booking-balian-01',
    refCode: booking?.ref_code || '#WS-84920',
    placeTitle: booking?.places?.title || 'Balian Treehouse',
    placeLocation: booking?.places?.location || 'Secluded Haven • Bali, Indonesia',
    category: 'ECO SANCTUARY',
    image:
      booking?.places?.images?.[0] ||
      'https://api.builder.io/api/v1/image/assets/TEMP/18942cce73a03811683b39e20f9be405cf5a4bca?width=192',
    checkInDate: 'Fri, May 24, 2024',
    checkInTime: '2:00 PM onwards',
    checkOutDate: 'Wed, May 29, 2024',
    checkOutTime: 'Until 11:00 AM',
    pinCode: '4821#',
    isPinActive: active,
    activeStatusMessage: active
      ? 'Smart Key is active. Welcome to your stay!'
      : 'PIN activates automatically at 2:00 PM on May 24.',
    bluetoothSyncReady: true,
    wifiSSID: 'BalianTreehouse_Guest_5G',
    wifiPassword: 'paradise_jungle24',
    hostName: 'Wayan',
    hostAvatar:
      'https://api.builder.io/api/v1/image/assets/TEMP/66ed4209be3963958431159f49510a846430e5bd?width=96',
    hostReplyTime: 'Typically replies in 5m',
    hostPhone: '+62 812 3456 7890',
    address: 'Jl. Pantai Balian, Lalanglinggah, Tabanan, Bali 82162',
    mapCoordinates: {
      latitude: -8.5028,
      longitude: 115.0275,
    },
    checkInSteps: [
      {
        step: 1,
        title: 'Arrive at Balian Beach Driveway',
        description:
          'Follow the carved stone markers along Balian Beach Road. Private covered parking is marked Bay #2.',
      },
      {
        step: 2,
        title: 'Main Bamboo Gate Entry',
        description:
          'Enter PIN on the keypad handle or use the Bluetooth unlock trigger above.',
        pinHighlight: '4821#',
      },
      {
        step: 3,
        title: 'Welcome Hospitality Refreshments',
        description:
          'Leave footwear on the teak deck entry. Chilled coconut water and fresh tropical fruit are waiting in the mini-bar.',
      },
    ],
    etiquetteRules: [
      {
        id: '1',
        text: 'Quiet hours begin after 10:00 PM (Jungle acoustics)',
        icon: 'volume-mute-outline',
      },
      {
        id: '2',
        text: 'Strictly smoke-free interiors & bamboo living decks',
        icon: 'ban-outline',
      },
      {
        id: '3',
        text: 'Pets welcome on the lower viewing terrace',
        icon: 'paw-outline',
      },
    ],
  };
}
