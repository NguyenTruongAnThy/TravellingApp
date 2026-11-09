import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getBookedDateRanges } from '../services/bookingsService';

interface StayDatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  initialCheckIn: string; // 'YYYY-MM-DD'
  initialCheckOut: string; // 'YYYY-MM-DD'
  onApply: (checkIn: string, checkOut: string, nights: number) => void;
  minNights?: number;
  placeId?: string;
}

const MONTH_NAMES = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

const WEEKDAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const EN_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const EN_WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const toDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysToString = (dateStr: string, days: number): string => {
  try {
    const parts = dateStr.split('-');
    const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    dt.setDate(dt.getDate() + days);
    return toDateString(dt);
  } catch {
    const dt = new Date();
    dt.setDate(dt.getDate() + days);
    return toDateString(dt);
  }
};

const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return 'Chọn ngày';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dw = weekdays[dt.getDay()];
    return `${dw}, ${parts[2]}/${parts[1]}/${parts[0]}`;
  } catch {
    return dateStr;
  }
};

export default function StayDatePickerModal({
  visible,
  onClose,
  initialCheckIn,
  initialCheckOut,
  onApply,
  minNights = 1,
  placeId,
}: StayDatePickerModalProps) {
  const { t, i18n } = useTranslation();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayStr = useMemo(() => toDateString(today), [today]);

  const [tempCheckIn, setTempCheckIn] = useState<string>(initialCheckIn);
  const [tempCheckOut, setTempCheckOut] = useState<string>(initialCheckOut);
  const [bookedRanges, setBookedRanges] = useState<{ check_in: string; check_out: string }[]>([]);

  // Fetch booked ranges for this place when modal opens
  useEffect(() => {
    if (visible && placeId) {
      getBookedDateRanges(placeId).then((ranges) => {
        setBookedRanges(ranges || []);
      });
    }
  }, [visible, placeId]);

  // Calendar month view
  const [calYear, setCalYear] = useState<number>(() => {
    if (initialCheckIn) {
      const parts = initialCheckIn.split('-');
      if (parts.length === 3) return Number(parts[0]);
    }
    return new Date().getFullYear();
  });
  const [calMonth, setCalMonth] = useState<number>(() => {
    if (initialCheckIn) {
      const parts = initialCheckIn.split('-');
      if (parts.length === 3) return Number(parts[1]) - 1;
    }
    return new Date().getMonth();
  });

  // Track if user is actively targeting check-in or check-out
  const [step, setStep] = useState<'checkIn' | 'checkOut'>('checkIn');

  // Reset / sync state whenever modal opens
  useEffect(() => {
    if (visible) {
      setTempCheckIn(initialCheckIn);
      setTempCheckOut(initialCheckOut);
      if (initialCheckIn) {
        const parts = initialCheckIn.split('-');
        if (parts.length === 3) {
          setCalYear(Number(parts[0]));
          setCalMonth(Number(parts[1]) - 1);
        }
      }
      setStep('checkIn');
    }
  }, [visible, initialCheckIn, initialCheckOut]);

  // Calculate nights
  const nights = useMemo(() => {
    if (!tempCheckIn || !tempCheckOut) return 0;
    try {
      const inD = new Date(tempCheckIn);
      const outD = new Date(tempCheckOut);
      const diffTime = outD.getTime() - inD.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch {
      return 0;
    }
  }, [tempCheckIn, tempCheckOut]);

  // Check if chosen range overlaps existing confirmed bookings
  const rangeConflict = useMemo(() => {
    if (!tempCheckIn || !tempCheckOut) return null;
    const conflicting = bookedRanges.find(
      (r) => r.check_in < tempCheckOut && r.check_out > tempCheckIn
    );
    return conflicting || null;
  }, [tempCheckIn, tempCheckOut, bookedRanges]);

  // Month navigation boundary
  const isPastMonth = useMemo(() => {
    const curYear = today.getFullYear();
    const curMonth = today.getMonth();
    return calYear < curYear || (calYear === curYear && calMonth <= curMonth);
  }, [calYear, calMonth, today]);

  const handlePrevMonth = () => {
    if (isPastMonth) return;
    const d = new Date(calYear, calMonth - 1, 1);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  };

  const handleNextMonth = () => {
    const d = new Date(calYear, calMonth + 1, 1);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  };

  // Calendar days grid
  const calDays = useMemo(() => {
    const first = new Date(calYear, calMonth, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [calYear, calMonth]);

  // Handle tapping a day cell
  const handleSelectDay = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Cannot pick past dates
    if (dateStr < todayStr) return;

    // Check if tapped day is already booked by another guest
    const isBooked = bookedRanges.some((r) => dateStr >= r.check_in && dateStr < r.check_out);
    if (isBooked) {
      Alert.alert(
        'Ngày đã có người đặt! ⚠️',
        `Ngày ${formatDisplayDate(dateStr)} đã có khách đặt chỗ này. Vui lòng chọn ngày còn trống khác.`
      );
      return;
    }

    if (!tempCheckIn || (tempCheckIn && tempCheckOut)) {
      // Starting a new selection
      setTempCheckIn(dateStr);
      setTempCheckOut('');
      setStep('checkOut');
    } else if (tempCheckIn && !tempCheckOut) {
      // Selecting check-out
      if (dateStr > tempCheckIn) {
        setTempCheckOut(dateStr);
        setStep('checkIn');
      } else {
        // Tapped earlier date, make it the new check-in
        setTempCheckIn(dateStr);
        setTempCheckOut('');
        setStep('checkOut');
      }
    }
  };

  // Quick preset chips
  const applyPreset = (daysCount: number) => {
    const baseIn = tempCheckIn && tempCheckIn >= todayStr ? tempCheckIn : addDaysToString(todayStr, 1);
    const baseOut = addDaysToString(baseIn, daysCount);
    setTempCheckIn(baseIn);
    setTempCheckOut(baseOut);
    setStep('checkIn');
  };

  const applyWeekendPreset = () => {
    // Find next Saturday
    const d = new Date(today);
    const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat
    const daysUntilSat = dayOfWeek === 6 ? 0 : (6 - dayOfWeek + 7) % 7;
    d.setDate(d.getDate() + (daysUntilSat === 0 ? 7 : daysUntilSat));
    const satStr = toDateString(d);
    const monStr = addDaysToString(satStr, 2); // Sat to Mon = 2 nights
    setTempCheckIn(satStr);
    setTempCheckOut(monStr);
    const satParts = satStr.split('-');
    setCalYear(Number(satParts[0]));
    setCalMonth(Number(satParts[1]) - 1);
    setStep('checkIn');
  };

  const handleReset = () => {
    const nextDay = addDaysToString(todayStr, 1);
    const dayAfter = addDaysToString(todayStr, 2);
    setTempCheckIn(nextDay);
    setTempCheckOut(dayAfter);
    setStep('checkIn');
  };

  const handleApply = () => {
    if (tempCheckIn && tempCheckOut && nights >= minNights) {
      onApply(tempCheckIn, tempCheckOut, nights);
      onClose();
    }
  };

  const canApply = Boolean(
    tempCheckIn &&
    tempCheckOut &&
    nights >= minNights &&
    !rangeConflict
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(19, 27, 46, 0.55)' }}
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-t-3xl overflow-hidden"
          style={{ maxHeight: '90%' }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Sheet Handle */}
          <View className="items-center pt-3 pb-1">
            <View className="w-12 h-1.5 rounded-full bg-borderLight" />
          </View>

          {/* Modal Header */}
          <View className="px-5 py-3 flex-row items-center justify-between border-b border-borderLight/60">
            <View>
              <Text className="text-lg font-bold text-textMain">Chọn ngày lưu trú</Text>
              <Text className="text-xs text-textMuted mt-0.5">
                Quy chuẩn nhận phòng 14:00 • Trả phòng 12:00 (BR03)
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="w-9 h-9 rounded-full bg-appBg border border-borderLight items-center justify-center"
            >
              <Ionicons name="close" size={20} color="#131B2E" />
            </Pressable>
          </View>

          <ScrollView className="px-5 pt-3" showsVerticalScrollIndicator={false}>
            {/* Range Overview Boxes (Airbnb / Booking.com style) */}
            <View className="flex-row items-center gap-2 mb-3">
              {/* Check-in Card */}
              <Pressable
                onPress={() => setStep('checkIn')}
                className={`flex-1 p-3 rounded-2xl border ${
                  step === 'checkIn'
                    ? 'border-brand bg-[#F2F3FF]'
                    : 'border-borderLight bg-white'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] font-bold text-brand uppercase">Nhận phòng</Text>
                  <Text className="text-[10px] text-textMuted">Từ 14:00</Text>
                </View>
                <Text className="text-sm font-bold text-textMain mt-1">
                  {formatDisplayDate(tempCheckIn)}
                </Text>
              </Pressable>

              {/* Arrow & Nights Badge */}
              <View className="items-center justify-center px-1">
                <Ionicons name="arrow-forward" size={16} color="#4F46E5" />
                <View className="bg-brand/10 px-2 py-0.5 rounded-full mt-1">
                  <Text className="text-[10px] font-bold text-brand">
                    {nights > 0 ? `${nights} đêm` : '—'}
                  </Text>
                </View>
              </View>

              {/* Check-out Card */}
              <Pressable
                onPress={() => setStep('checkOut')}
                className={`flex-1 p-3 rounded-2xl border ${
                  step === 'checkOut'
                    ? 'border-brand bg-[#F2F3FF]'
                    : 'border-borderLight bg-white'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] font-bold text-brand uppercase">Trả phòng</Text>
                  <Text className="text-[10px] text-textMuted">Trước 12:00</Text>
                </View>
                <Text
                  className={`text-sm font-bold mt-1 ${
                    tempCheckOut ? 'text-textMain' : 'text-textMuted italic'
                  }`}
                >
                  {tempCheckOut ? formatDisplayDate(tempCheckOut) : 'Chọn ngày'}
                </Text>
              </Pressable>
            </View>

            {/* Quick Chips (Preset options from Booking / Agoda) */}
            <View className="mb-3">
              <Text className="text-xs font-semibold text-textMuted mb-2">Chọn nhanh:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                <Pressable
                  onPress={() => applyPreset(1)}
                  className={`px-3 py-1.5 rounded-full border ${
                    nights === 1 ? 'border-brand bg-brand' : 'border-borderLight bg-white'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      nights === 1 ? 'text-white' : 'text-textMain'
                    }`}
                  >
                    1 {i18n.language === 'vi' ? 'đêm' : 'night'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => applyPreset(2)}
                  className={`px-3 py-1.5 rounded-full border ${
                    nights === 2 ? 'border-brand bg-brand' : 'border-borderLight bg-white'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      nights === 2 ? 'text-white' : 'text-textMain'
                    }`}
                  >
                    2 {i18n.language === 'vi' ? 'đêm' : 'nights'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => applyWeekendPreset()}
                  className="px-3 py-1.5 rounded-full border border-borderLight bg-white flex-row items-center gap-1"
                >
                  <Ionicons name="sunny-outline" size={13} color="#F59E0B" />
                  <Text className="text-xs font-semibold text-textMain">
                    {i18n.language === 'vi' ? 'Cuối tuần (2đ)' : 'Weekend (2n)'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => applyPreset(3)}
                  className={`px-3 py-1.5 rounded-full border ${
                    nights === 3 ? 'border-brand bg-brand' : 'border-borderLight bg-white'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      nights === 3 ? 'text-white' : 'text-textMain'
                    }`}
                  >
                    3 {i18n.language === 'vi' ? 'đêm' : 'nights'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => applyPreset(7)}
                  className={`px-3 py-1.5 rounded-full border ${
                    nights === 7 ? 'border-brand bg-brand' : 'border-borderLight bg-white'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      nights === 7 ? 'text-white' : 'text-textMain'
                    }`}
                  >
                    {i18n.language === 'vi' ? '1 tuần (7đ)' : '1 week (7n)'}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>

            {/* Calendar Month Navigator */}
            <View className="bg-appBg rounded-2xl p-3 border border-borderLight mb-3">
              <View className="flex-row items-center justify-between mb-3 px-1">
                <Pressable
                  onPress={handlePrevMonth}
                  disabled={isPastMonth}
                  className={`w-9 h-9 rounded-full border items-center justify-center ${
                    isPastMonth
                      ? 'border-borderLight/40 bg-gray-100'
                      : 'border-borderLight bg-white shadow-sm'
                  }`}
                >
                  <Ionicons
                    name="chevron-back"
                    size={18}
                    color={isPastMonth ? '#A0AEC0' : '#131B2E'}
                  />
                </Pressable>

                <Text className="text-base font-bold text-textMain">
                  {(i18n.language === 'vi' ? MONTH_NAMES : EN_MONTH_NAMES)[calMonth]} {calYear}
                </Text>

                <Pressable
                  onPress={handleNextMonth}
                  className="w-9 h-9 rounded-full border border-borderLight bg-white shadow-sm items-center justify-center"
                >
                  <Ionicons name="chevron-forward" size={18} color="#131B2E" />
                </Pressable>
              </View>

              {/* Day of week labels */}
              <View className="flex-row mb-1">
                {(i18n.language === 'vi' ? WEEKDAY_NAMES : EN_WEEKDAY_NAMES).map((dw) => (
                  <Text
                    key={dw}
                    className="flex-1 text-center text-xs font-semibold text-textMuted py-1"
                  >
                    {dw}
                  </Text>
                ))}
              </View>

              {/* Day Cells Grid */}
              <View className="flex-row flex-wrap">
                {calDays.map((day, idx) => {
                  if (day === null) {
                    return <View key={`empty-${idx}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
                  }

                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isPast = dateStr < todayStr;
                  const isToday = dateStr === todayStr;
                  const isStart = dateStr === tempCheckIn;
                  const isEnd = dateStr === tempCheckOut;
                  const isInRange = Boolean(
                    tempCheckIn && tempCheckOut && dateStr > tempCheckIn && dateStr < tempCheckOut
                  );
                  const isBooked = bookedRanges.some(
                    (r) => dateStr >= r.check_in && dateStr < r.check_out
                  );

                  let cellBg = 'transparent';
                  let textColor = '#131B2E';
                  let fontWeight: 'bold' | 'normal' | '500' = 'normal';

                  if (isStart || isEnd) {
                    cellBg = '#4F46E5';
                    textColor = '#FFFFFF';
                    fontWeight = 'bold';
                  } else if (isInRange) {
                    cellBg = '#EEF2FF';
                    textColor = '#4F46E5';
                    fontWeight = '500';
                  } else if (isBooked) {
                    cellBg = '#FEE2E2';
                    textColor = '#EF4444';
                    fontWeight = 'bold';
                  } else if (isPast) {
                    textColor = '#CBD5E1';
                  }

                  return (
                    <View
                      key={`day-${day}`}
                      style={{
                        width: '14.28%',
                        aspectRatio: 1,
                        padding: 2,
                      }}
                    >
                      <Pressable
                        onPress={() => !isPast && handleSelectDay(day)}
                        disabled={isPast}
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: cellBg,
                          borderRadius: isStart || isEnd ? 999 : isInRange ? 8 : 999,
                          borderWidth: isToday && !isStart && !isEnd ? 1 : 0,
                          borderColor: '#4F46E5',
                        }}
                      >
                        <Text
                          style={{
                            color: textColor,
                            fontSize: 13,
                            fontWeight,
                          }}
                        >
                          {day}
                        </Text>
                        {isStart && (
                          <Text style={{ color: '#FFFFFF', fontSize: 7, fontWeight: '700' }}>
                            Nhận
                          </Text>
                        )}
                        {isEnd && (
                          <Text style={{ color: '#FFFFFF', fontSize: 7, fontWeight: '700' }}>
                            Trả
                          </Text>
                        )}
                        {isBooked && !isStart && !isEnd && (
                          <Text style={{ color: '#EF4444', fontSize: 7, fontWeight: '700' }}>
                            Kín
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Helper Guideline / Validation Feedback */}
            <View
              className={`rounded-xl p-3 border flex-row items-center gap-2 mb-4 ${
                rangeConflict
                  ? 'bg-red-50 border-red-200'
                  : canApply
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-white border-borderLight'
              }`}
            >
              <Ionicons
                name={
                  rangeConflict
                    ? 'alert-circle'
                    : canApply
                    ? 'checkmark-circle'
                    : 'information-circle'
                }
                size={18}
                color={rangeConflict ? '#DC2626' : canApply ? '#059669' : '#F59E0B'}
              />
              <Text
                className={`flex-1 text-xs leading-4 ${
                  rangeConflict ? 'text-red-700 font-semibold' : 'text-textMuted'
                }`}
              >
                {rangeConflict
                  ? `Trùng lịch! Khoảng ngày này đã có khách đặt trước (${rangeConflict.check_in} đến ${rangeConflict.check_out}). Vui lòng chọn ngày khác.`
                  : !tempCheckIn
                  ? 'Vui lòng chạm chọn ngày nhận phòng trên lịch.'
                  : !tempCheckOut
                  ? 'Tuyệt vời! Bây giờ hãy chạm chọn ngày trả phòng.'
                  : `Đã chọn: ${nights} đêm (${formatDisplayDate(tempCheckIn)} ➔ ${formatDisplayDate(
                      tempCheckOut
                    )}).`}
              </Text>
            </View>
          </ScrollView>

          {/* Modal Action Footer */}
          <View className="p-4 bg-white border-t border-borderLight flex-row items-center justify-between gap-3 shadow-lg">
            <Pressable
              onPress={handleReset}
              className="px-4 py-3 rounded-full border border-borderLight bg-appBg items-center"
            >
              <Text className="text-xs font-bold text-textMain">Đặt lại</Text>
            </Pressable>

            <Pressable
              onPress={handleApply}
              disabled={!canApply}
              className={`flex-1 py-3.5 rounded-full items-center justify-center flex-row gap-2 ${
                canApply ? 'bg-brand shadow-md shadow-brand/30' : 'bg-gray-300'
              }`}
            >
              <Ionicons name="calendar-outline" size={16} color="#FFF" />
              <Text className="text-sm font-bold text-white">
                {canApply ? `Áp dụng ngày (${nights} đêm)` : 'Chọn ngày hợp lệ'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
