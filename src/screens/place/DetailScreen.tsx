import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPlaceById } from '../../services/placesService';
import { getFavoritePlaceIds, toggleFavorite } from '../../services/favoritesService';
import { addPlaceToCollection, createCollection, getCollections, getCollectionsContainingPlace, removePlaceFromCollection } from '../../services/collectionsService';
import { getReviewsByPlace, incrementHelpful } from '../../services/reviewService';
import type { Collection, Place, Review } from '../../types';
import { useAuth } from '../../context/AuthContext';
import AppButton from '../../components/AppButton';

function amenityIcon(name: string): any {
  const n = name.toLowerCase();
  if (n.includes('wifi')) return 'wifi-outline';
  if (n.includes('kitchen') || n.includes('bếp')) return 'restaurant-outline';
  if (n.includes('pool') || n.includes('hồ bơi')) return 'water-outline';
  if (n.includes('parking') || n.includes('đỗ xe')) return 'car-outline';
  if (n.includes('kayak')) return 'boat-outline';
  return 'checkmark-circle-outline';
}

export default function DetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { session } = useAuth();
  const placeId = route?.params?.placeId as string | undefined;
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviewsError, setReviewsError] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [facExpanded, setFacExpanded] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  // Save to collection: which of the user's collections already hold this place.
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveCollections, setSaveCollections] = useState<Collection[]>([]);
  const [inCollectionIds, setInCollectionIds] = useState<Set<string>>(new Set());
  const [newSaveName, setNewSaveName] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);
  // Swipeable hero photos: current page index, updated as the user swipes.
  const [photoIndex, setPhotoIndex] = useState(0);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index?: number | null }> }) => {
    const first = viewableItems[0];
    if (first?.index != null) setPhotoIndex(first.index);
  });
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const loadPlace = useCallback(async () => {
    if (!placeId) {
      setErrorMessage('Could not find this stay.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage('');
    const { data, error } = await getPlaceById(placeId);
    if (error || !data) {
      setErrorMessage('Could not load the stay details. Please try again.');
    } else {
      setPlace(data);
    }
    setLoading(false);
  }, [placeId]);

  useEffect(() => { loadPlace(); }, [loadPlace]);

  // Start back at the first photo whenever a different place is opened.
  useEffect(() => { setPhotoIndex(0); }, [placeId]);

  useEffect(() => {
    if (!placeId) return;
    getReviewsByPlace(placeId).then(({ data, error }) => {
      if (error) { setReviewsError(true); } else { setReviews(data || []); setReviewsError(false); }
    });
  }, [placeId]);

  useEffect(() => {
    if (!placeId || !session?.user?.id) { setIsFavorite(false); setInCollectionIds(new Set()); return; }
    getFavoritePlaceIds(session.user.id).then((ids) => setIsFavorite(ids.includes(placeId))).catch(() => {});
    getCollectionsContainingPlace(session.user.id, placeId).then((ids) => setInCollectionIds(new Set(ids))).catch(() => {});
  }, [placeId, session]);

  if (loading) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-sm text-textMuted">Loading stay details...</Text>
      </View>
    );
  }

  if (errorMessage || !place) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <Text className="text-lg font-bold text-textMain text-center">Could not load details</Text>
        <Text className="mt-2 text-sm text-textMuted text-center">{errorMessage}</Text>
        <View className="mt-6 w-full">
          <AppButton title="Try again" onPress={loadPlace} />
        </View>
      </View>
    );
  }

  // Hero photos: all images from Supabase; a single fallback image when the place has none.
  const heroImages =
    Array.isArray(place.images) && place.images.length > 0
      ? place.images
      : ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'];
  const photoCount = Array.isArray(place.images) ? place.images.length : 0;
  const screenWidth = Dimensions.get('window').width;

  const handleBook = () => {
    if (!session) { navigation.navigate('Login'); return; }
    navigation.navigate('ConfirmAndPay', { place });
  };

  const onLike = async (review: Review) => {
    if (likedIds.has(review.id)) return;
    const current = review.helpful_count || 0;
    setLikedIds((prev) => new Set(prev).add(review.id));
    setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, helpful_count: current + 1 } : r)));
    const { error } = await incrementHelpful(review.id, current);
    if (error) {
      setLikedIds((prev) => { const n = new Set(prev); n.delete(review.id); return n; });
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, helpful_count: current } : r)));
    }
  };

  const toggleFav = async () => {
    if (!session) { navigation.navigate('Login'); return; }
    try {
      await toggleFavorite(session.user.id, place.id, isFavorite);
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.warn('Could not toggle favorite:', err);
    }
  };

  const openSaveModal = async () => {
    if (!session) { navigation.navigate('Login'); return; }
    setSaveError('');
    setNewSaveName('');
    try {
      const cols = await getCollections(session.user.id);
      setSaveCollections(cols);
      setInCollectionIds(new Set(await getCollectionsContainingPlace(session.user.id, place.id)));
    } catch {
      setSaveError('Could not load your collections. Please try again.');
    }
    setSaveModalVisible(true);
  };

  const toggleSaveToCollection = async (collection: Collection) => {
    if (!session) { navigation.navigate('Login'); return; }
    setSaveBusy(true);
    setSaveError('');
    try {
      if (inCollectionIds.has(collection.id)) {
        await removePlaceFromCollection(collection.id, place.id);
        setInCollectionIds((prev) => { const next = new Set(prev); next.delete(collection.id); return next; });
      } else {
        await addPlaceToCollection(collection.id, place.id);
        setInCollectionIds((prev) => new Set(prev).add(collection.id));
      }
    } catch {
      setSaveError('Could not save to this collection. Please try again.');
    } finally {
      setSaveBusy(false);
    }
  };

  const createAndSaveToCollection = async () => {
    if (!session) { navigation.navigate('Login'); return; }
    if (!newSaveName.trim()) {
      setSaveError('Please enter a name.');
      return;
    }
    setSaveBusy(true);
    setSaveError('');
    try {
      const created = await createCollection(session.user.id, newSaveName.trim());
      await addPlaceToCollection(created.id, place.id);
      setSaveCollections((prev) => [...prev, created]);
      setInCollectionIds((prev) => new Set(prev).add(created.id));
      setNewSaveName('');
    } catch {
      setSaveError('Could not create the collection. Please try again.');
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-appBg">
      <ScrollView className="flex-1 bg-appBg" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Figma Property details: anh hero tran vien, nut Back/Save noi tren anh, khong co thanh tieu de rieng phia tren */}
        <View>
          {/* Swipeable hero photos: one photo per page, paging snap to full screen width */}
          <FlatList
            data={heroImages}
            keyExtractor={(_, i) => `hero-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged.current}
            viewabilityConfig={viewabilityConfig.current}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width: screenWidth, height: 320 }} resizeMode="cover" />
            )}
          />
          <Pressable className="w-9 h-9 rounded-full bg-white items-center justify-center border border-borderLight" style={{ position: 'absolute', top: 48, left: 16 }} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#131B2E" />
          </Pressable>
          <Pressable className="w-10 h-10 rounded-full bg-white items-center justify-center border border-borderLight" style={{ position: 'absolute', top: 48, right: 64 }} onPress={openSaveModal}>
            <Ionicons name={inCollectionIds.size > 0 ? 'bookmark' : 'bookmark-outline'} size={22} color={inCollectionIds.size > 0 ? '#4F46E5' : '#131B2E'} />
          </Pressable>
          <Pressable className="w-10 h-10 rounded-full bg-white items-center justify-center border border-borderLight" style={{ position: 'absolute', top: 48, right: 16 }} onPress={toggleFav}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? '#EF4444' : '#131B2E'} />
          </Pressable>
          {photoCount > 0 ? (
            <View className="px-3 py-1.5 rounded-full flex-row items-center" style={{ position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(19,27,46,0.65)' }}>
              <Ionicons name="camera-outline" size={14} color="#FFFFFF" />
              <Text className="ml-1.5 text-xs font-bold text-white">{photoIndex + 1} / {photoCount}</Text>
            </View>
          ) : null}
          {photoCount > 1 ? (
            <View className="flex-row items-center justify-center" style={{ position: 'absolute', bottom: 16, left: 0, right: 0 }}>
              {place.images!.slice(0, 5).map((_, i) => (
                <View key={i} style={{ width: i === photoIndex ? 16 : 6, height: 6, borderRadius: 3, marginHorizontal: 2, backgroundColor: i === photoIndex ? '#FFFFFF' : 'rgba(255,255,255,0.6)' }} />
              ))}
            </View>
          ) : null}
        </View>

        {/* The tieu de noi len tren anh, chi chua thong tin co ban */}
        <View className="mx-5 -mt-6 rounded-3xl bg-white border border-borderLight p-5">
          <Text className="text-2xl font-bold text-textMain">{place.title}</Text>
          <View className="mt-2 flex-row items-center">
            <Ionicons name="location-outline" size={18} color="#4F46E5" />
            <Text className="ml-1 text-base text-textMuted flex-1">{place.location}</Text>
          </View>
          <View className="mt-2 flex-row items-baseline">
            <Text className="text-3xl font-bold text-brand">${place.price_per_night}</Text>
            <Text className="text-base text-textMuted"> / night</Text>
          </View>
          <Pressable className="mt-3 flex-row items-center self-start px-3 py-2 rounded-full bg-appBg border border-borderLight" onPress={openSaveModal}>
            <Ionicons name={inCollectionIds.size > 0 ? 'bookmark' : 'bookmark-outline'} size={16} color="#4F46E5" />
            <Text className="ml-1.5 text-sm font-bold text-brand">{inCollectionIds.size > 0 ? 'Saved to collection' : 'Save to collection'}</Text>
          </Pressable>
        </View>

        {/* Figma rating card: light-purple, real rating/review_count only, taps to Reviews */}
        <Pressable className="mx-5 mt-4 rounded-2xl border border-borderLight p-4 flex-row items-center" style={{ backgroundColor: '#EDE9FE' }} onPress={() => navigation.navigate('Reviews', { placeId: place.id })}>
          <Ionicons name="star" size={22} color="#FFB020" />
          <Text className="ml-2 text-lg font-bold text-textMain">{place.rating != null ? place.rating.toFixed(1) : 'New'}{place.rating != null ? ' / 5' : ''}</Text>
          {place.rating != null ? <Text className="ml-2 text-sm font-bold text-brand">{place.rating >= 4.8 ? 'Exceptional' : place.rating >= 4.5 ? 'Excellent' : 'Very good'}</Text> : null}
          {place.review_count ? <Text className="ml-2 text-sm text-textMuted">{place.review_count} reviews ›</Text> : null}
        </Pressable>

        {/* Figma capacity pills in a white card. No bathrooms column in DB, so no bath pill is invented. */}
        <View className="mx-5 mt-4 rounded-3xl bg-white border border-borderLight p-4">
          <View className="flex-row flex-wrap">
            {place.guests_capacity != null ? <View className="mr-2 mb-2 px-3 py-2 rounded-full bg-appBg border border-borderLight flex-row items-center"><Ionicons name="people-outline" size={16} color="#4F46E5" /><Text className="ml-1.5 text-sm text-textMain">{place.guests_capacity} guests</Text></View> : null}
            {place.rooms != null ? <View className="mr-2 mb-2 px-3 py-2 rounded-full bg-appBg border border-borderLight flex-row items-center"><Ionicons name="home-outline" size={16} color="#4F46E5" /><Text className="ml-1.5 text-sm text-textMain">{place.rooms} rooms</Text></View> : null}
            {place.beds != null ? <View className="mr-2 mb-2 px-3 py-2 rounded-full bg-appBg border border-borderLight flex-row items-center"><Ionicons name="bed-outline" size={16} color="#4F46E5" /><Text className="ml-1.5 text-sm text-textMain">{place.beds} beds</Text></View> : null}
            {place.place_type || place.category ? <View className="mr-2 mb-2 px-3 py-2 rounded-full bg-appBg border border-borderLight flex-row items-center"><Ionicons name="business-outline" size={16} color="#4F46E5" /><Text className="ml-1.5 text-sm text-textMain">{place.place_type || place.category}</Text></View> : null}
          </View>
        </View>

        {/* Cac muc rieng biet, khong long the trang trong the trang */}
        {place.description ? (
          <View className="mx-5 mt-4 rounded-3xl bg-white border border-borderLight p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-textMain">Description</Text>
              <Pressable onPress={() => setDescExpanded(!descExpanded)}><Text className="text-sm font-bold text-brand">{descExpanded ? 'Show less ›' : 'View more ›'}</Text></Pressable>
            </View>
            <Text className="mt-2 text-base text-textMuted leading-6" numberOfLines={descExpanded ? undefined : 3}>{place.description}</Text>
          </View>
        ) : null}

        {Array.isArray(place.amenities) && place.amenities.length > 0 ? (
          <View className="mx-5 mt-4 rounded-3xl bg-white border border-borderLight p-5">
            <Text className="text-base font-bold text-textMain">Facilities</Text>
            <View className="mt-2">
              {(facExpanded ? place.amenities : place.amenities.slice(0, 3)).map((item, i, arr) => (
                <View key={item} className="flex-row items-center py-2.5" style={{ borderBottomWidth: i === arr.length - 1 ? 0 : 1, borderBottomColor: '#E6E3F5' }}>
                  <Ionicons name={amenityIcon(item)} size={18} color="#4F46E5" />
                  <Text className="ml-3 text-base text-textMain">{item}</Text>
                </View>
              ))}
            </View>
            {place.amenities.length > 3 ? (
              <Pressable className="mt-2" onPress={() => setFacExpanded(!facExpanded)}><Text className="text-sm font-bold text-brand">{facExpanded ? 'Show less ›' : `Show all ${place.amenities.length} facilities ›`}</Text></Pressable>
            ) : null}
          </View>
        ) : null}
        <View className="mx-5 mt-4 rounded-3xl bg-white border border-borderLight p-5">
          <Text className="text-base font-bold text-textMain">Policies</Text>
          {[
            { icon: 'log-in-outline', title: 'Check-in', text: `From ${place.check_in_time || '14:00'}` },
            { icon: 'log-out-outline', title: 'Check-out', text: `Until ${place.check_out_time || '12:00'}` },
            { icon: 'ban-outline', title: 'No smoking', text: 'No smoking inside' },
            { icon: 'moon-outline', title: 'Quiet hours', text: 'Quiet hours after 22:00' },
            { icon: 'paw-outline', title: 'Pets', text: 'Pets: upon request' },
            { icon: 'shield-checkmark-outline', title: 'Free cancellation', text: 'Free cancellation from 48 hours before check-in. Cancelling within 48 hours costs 1 night, refund = total − 1 night price. No refund after check-in or for a no-show.' },
          ].map((row) => (
            <View key={row.title} className="mt-3 flex-row items-start">
              <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: '#EDE9FE' }}>
                <Ionicons name={row.icon as any} size={18} color="#4F46E5" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base font-bold text-textMain">{row.title}</Text>
                <Text className="text-base text-textMuted">{row.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className="mx-5 mt-4 rounded-3xl bg-white border border-borderLight p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-textMain">Reviews</Text>
            <Pressable onPress={() => navigation.navigate('Reviews', { placeId: place.id })}><Text className="text-sm font-bold text-brand">Show all reviews ›</Text></Pressable>
          </View>
          {reviewsError ? (
            <Text className="mt-2 text-base text-textMuted">Could not load reviews. Please try again later.</Text>
          ) : reviews.length === 0 ? (
            <Text className="mt-2 text-base text-textMuted">No reviews for this stay yet.</Text>
          ) : (
            <View className="mt-2">
              {reviews.slice(0, 2).map((review) => {
                const guestName = review.reviewer_name || review.users?.name || 'Guest';
                return (
                <View key={review.id} className="mt-3 rounded-2xl border border-borderLight p-4" style={{ backgroundColor: '#EDE9FE' }}>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-full bg-white border border-borderLight items-center justify-center">
                        <Text className="text-sm font-bold text-brand">{guestName.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text className="ml-2 text-base font-bold text-textMain">{guestName}</Text>
                    </View>
                    <View className="flex-row items-center"><Ionicons name="star" size={13} color="#FFB020" /><Text className="ml-1 text-sm font-bold text-textMain">{review.rating}/5</Text></View>
                  </View>
                  {review.created_at ? <Text className="mt-1 text-xs text-textMuted">{review.created_at.slice(0, 10)}</Text> : null}
                  <Text className="mt-2 text-base text-textMuted">{review.comment || '(No comment)'}</Text>
                  <Pressable className="mt-3 self-start flex-row items-center px-3 py-1.5 rounded-full bg-white border border-borderLight" onPress={() => onLike(review)}>
                    <Ionicons name={likedIds.has(review.id) ? 'heart' : 'heart-outline'} size={16} color={likedIds.has(review.id) ? '#EF4444' : '#4F46E5'} />
                    <Text className="ml-1 text-sm font-bold text-textMain">{review.helpful_count || 0}</Text>
                  </Pressable>
                </View>
                );
              })}
            </View>
          )}
        </View>

        <View className="mx-5 mt-4 rounded-3xl bg-white border border-borderLight p-5">
          <Text className="text-base font-bold text-textMain">Location</Text>
          <View className="mt-2 flex-row items-center">
            <Ionicons name="location-outline" size={18} color="#4F46E5" />
            <Text className="ml-1 text-base font-bold text-textMain flex-1">{place.location}</Text>
          </View>
          <Pressable
            className="mt-3 rounded-3xl border border-borderLight p-4 flex-row items-center"
            style={{ backgroundColor: '#EDE9FE' }}
            onPress={() => navigation.navigate('Map', { placeId: place.id })}
          >
            <View className="w-12 h-12 rounded-full bg-white items-center justify-center border border-borderLight">
              <Ionicons name="map-outline" size={24} color="#4F46E5" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-base font-bold text-textMain">Open map</Text>
              <Text className="mt-1 text-sm text-textMuted">
                {place.latitude != null && place.longitude != null
                  ? 'See this stay on an interactive map.'
                  : 'Map location is not available for this stay.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#5A6478" />
          </Pressable>
          <Text className="mt-2 text-sm text-textMuted">{session ? 'You are signed in, tap Reserve below to continue.' : 'You are browsing as a guest. Sign in to book.'}</Text>
        </View>
      </ScrollView>
      <View className="bg-white border-t border-borderLight px-5 py-3 flex-row items-center">
        <View>
          <Text className="text-2xl font-bold text-brand">${place.price_per_night}</Text>
          <Text className="text-xs text-textMuted">/ night</Text>
        </View>
        <View className="flex-1 ml-4">
          <AppButton title="Reserve Now" onPress={handleBook} />
        </View>
      </View>

      {/* Save to collection modal */}
      <Modal visible={saveModalVisible} animationType="slide" transparent onRequestClose={() => setSaveModalVisible(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(19,27,46,0.5)' }} onPress={() => setSaveModalVisible(false)}>
          <Pressable className="bg-white rounded-t-3xl p-5" onPress={(e) => e.stopPropagation()}>
            <Text className="text-lg font-bold text-textMain">Save to collection</Text>
            <Text className="mt-1 text-sm text-textMuted" numberOfLines={1}>{place.title}</Text>
            {saveError ? <Text className="mt-2 text-sm text-red-500">{saveError}</Text> : null}
            <ScrollView style={{ maxHeight: 320 }} className="mt-3" showsVerticalScrollIndicator={false}>
              {saveCollections.length === 0 ? (
                <Text className="py-3 text-base text-textMuted">No collections yet.</Text>
              ) : (
                saveCollections.map((collection) => {
                  const saved = inCollectionIds.has(collection.id);
                  return (
                    <Pressable key={collection.id} className="flex-row items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3F5' }} onPress={() => toggleSaveToCollection(collection)} disabled={saveBusy}>
                      <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: '#EDE9FE' }}>
                        <Ionicons name="bookmark-outline" size={18} color="#4F46E5" />
                      </View>
                      <Text className="flex-1 ml-3 text-base font-bold text-textMain">{collection.name}</Text>
                      {saved ? <Ionicons name="checkmark-circle" size={24} color="#4F46E5" /> : <Ionicons name="ellipse-outline" size={24} color="#8A90A6" />}
                    </Pressable>
                  );
                })
              )}
              <View className="flex-row items-center mt-3">
                <TextInput
                  className="flex-1 px-4 py-3 rounded-2xl border border-borderLight bg-appBg text-base text-textMain"
                  placeholder="New collection name"
                  placeholderTextColor="#8A90A6"
                  value={newSaveName}
                  onChangeText={(text) => { setNewSaveName(text); setSaveError(''); }}
                  maxLength={50}
                />
                <Pressable className="ml-2 px-4 py-3 rounded-full bg-brand items-center" onPress={createAndSaveToCollection} disabled={saveBusy}>
                  <Text className="text-base font-bold text-white">Add</Text>
                </Pressable>
              </View>
            </ScrollView>
            <Pressable className="mt-4 py-3 rounded-full bg-brand items-center" onPress={() => setSaveModalVisible(false)}>
              <Text className="text-base font-bold text-white">Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
