import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { getPlaces } from './src/services/placesService';

export default function App() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchPlacesData = useCallback(async () => {
    setErrorMessage(null);
    const { data, error } = await getPlaces();

    if (error) {
      console.error('Lỗi khi tải dữ liệu từ Supabase:', error);
      setErrorMessage(error.message || 'Không thể kết nối đến Supabase');
    } else {
      setPlaces(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchPlacesData();
  }, [fetchPlacesData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlacesData();
  };

  const renderItem = ({ item }) => {
    const mainImage =
      Array.isArray(item.images) && item.images.length > 0
        ? item.images[0]
        : 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80';

    return (
      <View style={styles.card}>
        <Image source={{ uri: mainImage }} style={styles.cardImage} />
        <View style={styles.cardBody}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>★ {item.rating ?? 'New'}</Text>
            </View>
          </View>
          <Text style={styles.cardLocation} numberOfLines={1}>
            📍 {item.location}
          </Text>
          <Text style={styles.cardCategory}>
            {item.place_type || item.category || 'Stay'} • {item.guests_capacity ?? 1} khách
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceValue}>${item.price_per_night}</Text>
            <Text style={styles.pricePeriod}> / đêm</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.appName}>WanderStay</Text>
            <Text style={styles.appSubtitle}>Kết nối Supabase</Text>
          </View>
          <View style={[styles.statusDot, errorMessage ? styles.statusError : styles.statusSuccess]} />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF385C" />
          <Text style={styles.helperText}>Đang tải dữ liệu từ Supabase...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Lỗi kết nối</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Text style={styles.instructionText}>
            💡 Lưu ý: Hãy đảm bảo bạn đã tạo bảng `places` trong Supabase SQL Editor bằng file `supabase/schema.sql` và chèn dữ liệu bằng `supabase/seed.sql`.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPlacesData}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : places.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>Chưa có địa điểm nào</Text>
          <Text style={styles.instructionText}>
            Kết nối Supabase thành công nhưng bảng `places` đang trống. Hãy chạy file `supabase/seed.sql` trong SQL Editor của Supabase để nạp dữ liệu mẫu!
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPlacesData}>
            <Text style={styles.retryButtonText}>Làm mới</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF385C']} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF385C',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusSuccess: {
    backgroundColor: '#10B981',
  },
  statusError: {
    backgroundColor: '#EF4444',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  helperText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF385C',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  headerContent: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
  },
  cardBody: {
    padding: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  cardLocation: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  cardCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  pricePeriod: {
    fontSize: 13,
    color: '#6B7280',
  },
});
