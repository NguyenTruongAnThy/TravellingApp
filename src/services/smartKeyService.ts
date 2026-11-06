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
 * Returns Smart Key details for booking dynamically from database records (BR03, UC013)
 */
export function getSmartKeyDetails(booking?: any): SmartKeyInfo {
  const checkInDate = booking?.check_in || '2024-05-24';
  const checkOutDate = booking?.check_out || '2024-05-29';
  const active = isSmartKeyActive(checkInDate, checkOutDate);
  const place = booking?.places;

  const pinCode = booking?.pin_code || place?.smart_lock_pin || '4821#';
  const wifiSSID = place?.wifi_ssid || 'WanderStay_Guest_5G';
  const wifiPassword = place?.wifi_password || 'jungleparadise';
  const hostName = place?.host_name || 'Wayan Sutama';
  const hostPhone = place?.host_phone || '+62 812 3456 7890';
  const address = place?.address || place?.location || 'Jl. Pantai Balian, Lalanglinggah, Tabanan, Bali 82162';

  return {
    bookingId: booking?.id || '',
    refCode: booking?.ref_code || '#WS-84920',
    placeTitle: place?.title || 'Balian Treehouse Escape',
    placeLocation: place?.location || 'Bali, Indonesia',
    category: place?.category || place?.place_type || 'ECO SANCTUARY',
    image:
      place?.images?.[0] ||
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    checkInDate,
    checkInTime: '2:00 PM onwards',
    checkOutDate,
    checkOutTime: 'Until 12:00 PM',
    pinCode,
    isPinActive: active,
    activeStatusMessage: active
      ? 'Smart Key is active. Welcome to your stay!'
      : `PIN activates automatically at 2:00 PM on ${checkInDate}.`,
    bluetoothSyncReady: true,
    wifiSSID,
    wifiPassword,
    hostName,
    hostAvatar:
      'https://api.builder.io/api/v1/image/assets/TEMP/66ed4209be3963958431159f49510a846430e5bd?width=96',
    hostReplyTime: 'Typically replies in 5m',
    hostPhone,
    address,
    mapCoordinates: {
      latitude: -8.5028,
      longitude: 115.0275,
    },
    checkInSteps: [
      {
        step: 1,
        title: 'Arrive at destination driveway',
        description: `Follow local stone markers towards ${address}. Covered guest parking is available.`,
      },
      {
        step: 2,
        title: 'Main Door & Keypad Entry',
        description: `Enter PIN ${pinCode} on the keypad handle or use the Bluetooth unlock trigger above.`,
        pinHighlight: pinCode,
      },
      {
        step: 3,
        title: 'Welcome Hospitality & Refreshments',
        description:
          'Leave footwear on the entrance deck. Chilled coconut water and fresh tropical fruit are waiting in the mini-bar.',
      },
    ],
    etiquetteRules: [
      {
        id: '1',
        text: 'Quiet hours begin after 10:00 PM (Acoustic respect)',
        icon: 'volume-mute-outline',
      },
      {
        id: '2',
        text: 'Strictly smoke-free interiors & wooden living decks',
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
