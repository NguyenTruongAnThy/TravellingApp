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
  const checkInDate = booking?.check_in || new Date().toISOString().split('T')[0];
  const checkOutDate = booking?.check_out || new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const active = isSmartKeyActive(checkInDate, checkOutDate);
  const place = booking?.places;

  const pinCode = booking?.pin_code || place?.smart_lock_pin || '4821#';
  const wifiSSID = place?.wifi_ssid || 'WanderStay_Guest_5G';
  const wifiPassword = place?.wifi_password || 'wanderstay2026';
  const hostName = place?.host_name || 'Chủ nhà';
  const hostPhone = place?.host_phone || '+84 912 345 678';
  const address = place?.address || place?.location || 'Việt Nam';

  return {
    bookingId: booking?.id || '',
    refCode: booking?.ref_code || '#WS-BOOKING',
    placeTitle: place?.title || 'Chỗ nghỉ của bạn',
    placeLocation: place?.location || 'Việt Nam',
    category: place?.category || place?.place_type || 'HOMESTAY',
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
      place?.images?.[0] ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96',
    hostReplyTime: 'Phản hồi trong 5 phút',
    hostPhone,
    address,
    mapCoordinates: {
      latitude: place?.latitude != null ? Number(place.latitude) : 21.0285,
      longitude: place?.longitude != null ? Number(place.longitude) : 105.8542,
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
