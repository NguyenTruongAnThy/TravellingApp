import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getPlaceById } from '../../services/placesService';
import { createReview, getReviewsByPlace, incrementHelpful, uploadReviewPhotos } from '../../services/reviewService';
import type { Place, Review } from '../../types';
import { useAuth } from '../../context/AuthContext';
import AppButton from '../../components/AppButton';

type Filter = 'all' | 'photos' | '1' | '2' | '3' | '4' | '5';

export default function ReviewsScreen({ route, navigation }: { route: any; navigation: any }) {
  const { session } = useAuth();
  const placeId = route?.params?.placeId as string | undefined;
  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [likeError, setLikeError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Write a Review modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [draftRating, setDraftRating] = useState(0);
  const [draftComment, setDraftComment] = useState('');
  const [draftPhotos, setDraftPhotos] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!placeId) { setErrorMessage('Could not find this stay.'); setLoading(false); return; }
    setLoading(true); setErrorMessage('');
    const [p, r] = await Promise.all([getPlaceById(placeId), getReviewsByPlace(placeId)]);
    if (p.error || !p.data) setErrorMessage('Could not load reviews. Please try again.');
    else { setPlace(p.data); setReviews(r.data || []); }
    setLoading(false);
  }, [placeId]);

  useEffect(() => { load(); }, [load]);

  const dist = useMemo(() => {
    const c = [0, 0, 0, 0, 0, 0];
    reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) c[r.rating] += 1; });
    return c;
  }, [reviews]);

  const photoCount = useMemo(() => reviews.filter((r) => Array.isArray(r.photos) && r.photos.length > 0).length, [reviews]);
  const starCount = useMemo(() => {
    const c: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    reviews.forEach((r) => { const s = String(Math.round(r.rating)); if (c[s] != null) c[s] += 1; });
    return c;
  }, [reviews]);
  const filtered = useMemo(() => {
    if (filter === 'photos') return reviews.filter((r) => Array.isArray(r.photos) && r.photos.length > 0);
    if (filter === '1' || filter === '2' || filter === '3' || filter === '4' || filter === '5') {
      return reviews.filter((r) => Math.round(r.rating) === Number(filter));
    }
    return reviews;
  }, [reviews, filter]);

  if (loading) return (<View className="flex-1 bg-appBg items-center justify-center px-6"><ActivityIndicator size="large" color="#4F46E5" /><Text className="mt-3 text-sm text-textMuted">Loading reviews...</Text></View>);
  if (errorMessage || !place) return (<View className="flex-1 bg-appBg items-center justify-center px-6"><Text className="text-lg font-bold text-textMain text-center">Could not load reviews</Text><Text className="mt-2 text-sm text-textMuted text-center">{errorMessage}</Text><View className="mt-6 w-full"><AppButton title="Try again" onPress={load} /></View></View>);

  const onLike = async (review: Review) => {
    if (likedIds.has(review.id)) return;
    const current = review.helpful_count || 0;
    setLikedIds((prev) => new Set(prev).add(review.id));
    setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, helpful_count: current + 1 } : r)));
    setLikeError('');
    const { error } = await incrementHelpful(review.id, current);
    if (error) {
      setLikedIds((prev) => { const n = new Set(prev); n.delete(review.id); return n; });
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, helpful_count: current } : r)));
      setLikeError('Could not save the like. Please try again.');
    }
  };

  const handleBook = () => {
    if (!session) { navigation.navigate('Login'); return; }
    navigation.navigate('MainTabs', { screen: 'Booking' });
  };

  const openWriteReview = () => {
    if (!session) { navigation.navigate('Login'); return; }
    setDraftRating(0);
    setDraftComment('');
    setDraftPhotos([]);
    setSubmitError('');
    setModalVisible(true);
  };

  const pickPhotos = async () => {
    const remaining = 4 - draftPhotos.length;
    if (remaining <= 0) { setSubmitError('You can add up to 4 photos.'); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setSubmitError('Please allow photo access to add photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (result.canceled) return;
    const uris = result.assets.map((a) => a.uri).filter(Boolean);
    setDraftPhotos((prev) => [...prev, ...uris].slice(0, 4));
    setSubmitError('');
  };

  const removeDraftPhoto = (uri: string) => {
    setDraftPhotos((prev) => prev.filter((u) => u !== uri));
  };

  const submitReview = async () => {
    if (!session) { setModalVisible(false); navigation.navigate('Login'); return; }
    if (draftRating === 0 || draftComment.trim().length === 0) {
      setSubmitError('Please choose a rating and write a comment.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    let photoUrls: string[] = [];
    if (draftPhotos.length > 0) {
      const { urls, error: uploadError } = await uploadReviewPhotos(place.id, session.user.id, draftPhotos);
      if (uploadError) {
        setSubmitting(false);
        setSubmitError('Could not upload photos. Please try again.');
        return;
      }
      photoUrls = urls;
    }
    const { error } = await createReview(place.id, session.user.id, draftRating, draftComment.trim(), photoUrls);
    setSubmitting(false);
    if (error) {
      setSubmitError('Could not submit your review. Please try again.');
      return;
    }
    setModalVisible(false);
    setDraftRating(0);
    setDraftComment('');
    setDraftPhotos([]);
    setFilter('all');
    await load();
  };

  const total = reviews.length;

  return (
    <View className="flex-1 bg-appBg">
      <ScrollView className="flex-1 bg-appBg" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-5 pt-12 pb-3 flex-row items-center">
          <Pressable className="w-9 h-9 rounded-full bg-white items-center justify-center border border-borderLight" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#131B2E" />
          </Pressable>
          <Text className="ml-3 text-lg font-bold text-textMain flex-1">Reviews</Text>
        </View>

        {/* Title + location, same polish as Detail */}
        <View className="mx-5 mt-2">
          <Text className="text-2xl font-bold text-textMain">{place.title}</Text>
          <View className="mt-2 flex-row items-center">
            <Ionicons name="location-outline" size={18} color="#4F46E5" />
            <Text className="ml-1 text-base text-textMuted flex-1">{place.location}</Text>
          </View>
        </View>

        {/* Figma Reviews summary: big score + stars on the left, distribution bars on the right. Real data only. */}
        <View className="mx-5 mt-4 rounded-3xl bg-white border border-borderLight p-5 flex-row">
          <Pressable className="items-center justify-center pr-4" style={{ borderRightWidth: 1, borderRightColor: '#E6E3F5' }} onPress={() => setFilter('all')}>
            <Text className="text-5xl font-bold text-textMain">{place.rating != null && Number(place.rating) > 0 ? Number(place.rating).toFixed(1) : 'New'}</Text>
            <View className="mt-1 flex-row">{[1, 2, 3, 4, 5].map((i) => (<Ionicons key={i} name={place.rating != null && i <= Math.round(place.rating) ? 'star' : 'star-outline'} size={14} color={place.rating != null && i <= Math.round(place.rating) ? '#FFB020' : '#D9D4F0'} />))}</View>
            <Text className="mt-1 text-sm text-textMuted">{(place.review_count ?? total) > 0 ? `${place.review_count ?? total} reviews` : 'Chưa có đánh giá'}</Text>
          </Pressable>
          <View className="flex-1 pl-4 justify-center">
            {total === 0 ? <Text className="text-base text-textMuted">No detailed reviews yet to calculate the distribution.</Text> : [5, 4, 3, 2, 1].map((star) => {
              const pct = Math.round((dist[star] / total) * 100);
              const starFilter = String(star) as Filter;
              const active = filter === starFilter;
              return (
                <Pressable key={star} className="flex-row items-center mt-1.5" onPress={() => setFilter(active ? 'all' : starFilter)}>
                  <Text className={`w-6 text-sm font-bold ${active ? 'text-brand' : 'text-textMain'}`}>{star} ★</Text>
                  <View className="flex-1 h-2 rounded-full bg-borderLight overflow-hidden">
                    <View style={{ width: `${pct}%`, height: 8, backgroundColor: '#4F46E5', borderRadius: 999 }} />
                  </View>
                  <Text className={`ml-2 w-10 text-right text-sm ${active ? 'font-bold text-brand' : 'text-textMuted'}`}>{pct}%</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Figma filter pills, real counts */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 px-5" contentContainerStyle={{ alignItems: 'center' }}>
          {([
            { key: 'all', label: `All ${total}` },
            { key: 'photos', label: `With photos ${photoCount}` },
            { key: '5', label: `5 stars ${starCount['5']}` },
            { key: '4', label: `4 stars ${starCount['4']}` },
            { key: '3', label: `3 stars ${starCount['3']}` },
            { key: '2', label: `2 stars ${starCount['2']}` },
            { key: '1', label: `1 star ${starCount['1']}` },
          ] as { key: Filter; label: string }[]).map((pill) => (
            <Pressable
              key={pill.key}
              onPress={() => setFilter(pill.key)}
              className={`mr-2 px-4 py-2 rounded-full border ${filter === pill.key ? 'bg-brand border-brand' : 'bg-white border-borderLight'}`}
            >
              <Text className={`text-sm font-bold ${filter === pill.key ? 'text-white' : 'text-textMain'}`}>{pill.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View className="mx-5 mt-4">
          {likeError ? <Text className="text-sm text-red-500">{likeError}</Text> : null}
          {filtered.length === 0 ? <Text className="mt-2 text-base text-textMuted">{total === 0 ? 'No reviews for this stay yet.' : 'No reviews match this filter.'}</Text> : filtered.map((review) => {
            const guestName = review.reviewer_name || review.users?.name || 'Guest';
            const liked = likedIds.has(review.id);
            return (
              <View key={review.id} className="mt-3 rounded-3xl bg-white border border-borderLight p-4">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-full bg-brand items-center justify-center">
                      <Text className="text-base font-bold text-white">{guestName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-bold text-textMain">{guestName}</Text>
                      {review.created_at ? <Text className="text-xs text-textMuted">{review.created_at.slice(0, 10)}</Text> : null}
                    </View>
                  </View>
                  <View className="flex-row items-center"><Ionicons name="star" size={14} color="#FFB020" /><Text className="ml-1 text-sm font-bold text-textMain">{review.rating}/5</Text></View>
                </View>
                <View className="mt-2 flex-row">{[1, 2, 3, 4, 5].map((i) => (<Ionicons key={i} name={i <= review.rating ? 'star' : 'star-outline'} size={15} color={i <= review.rating ? '#FFB020' : '#D9D4F0'} />))}</View>
                <Text className="mt-2 text-base text-textMuted leading-6">{review.comment || '(No comment)'}</Text>
                {Array.isArray(review.photos) && review.photos.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                    {review.photos.map((photo, i) => (
                      <Image key={`${review.id}-photo-${i}`} source={{ uri: photo }} style={{ width: 96, height: 96, borderRadius: 12, marginRight: 8 }} resizeMode="cover" />
                    ))}
                  </ScrollView>
                ) : null}
                <Pressable className="mt-3 self-start flex-row items-center px-3 py-2 rounded-full border border-borderLight bg-white" onPress={() => onLike(review)}>
                  <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? '#EF4444' : '#4F46E5'} />
                  <Text className="ml-1 text-sm font-bold text-textMain">{review.helpful_count || 0} likes</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Figma bottom bar: Write a Review (outlined) + Book (solid) */}
      <View className="bg-white border-t border-borderLight px-5 py-3 flex-row items-center">
        <Pressable className="flex-1 rounded-full py-3.5 items-center bg-white border border-brand" onPress={openWriteReview}>
          <Text className="text-base font-bold text-brand">Write a Review</Text>
        </Pressable>
        <Pressable className="flex-1 ml-3 rounded-full py-3.5 items-center bg-brand" onPress={handleBook}>
          <Text className="text-base font-bold text-white">Book</Text>
        </Pressable>
      </View>

      {/* Write a Review modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(19, 27, 46, 0.5)' }}>
          <Pressable className="flex-1" onPress={() => setModalVisible(false)} />
          <ScrollView className="bg-white rounded-t-3xl px-5 pt-5 pb-6" style={{ maxHeight: '85%' }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-textMain">Write a Review</Text>
              <Pressable className="w-9 h-9 rounded-full bg-appBg items-center justify-center" onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color="#131B2E" />
              </Pressable>
            </View>
            <Text className="mt-1 text-base text-textMuted">{place.title}</Text>
            <Text className="mt-4 text-base font-bold text-textMain">Your rating</Text>
            <View className="mt-2 flex-row">
              {[1, 2, 3, 4, 5].map((i) => (
                <Pressable key={i} className="mr-1" onPress={() => setDraftRating(i)}>
                  <Ionicons name={i <= draftRating ? 'star' : 'star-outline'} size={32} color={i <= draftRating ? '#FFB020' : '#D9D4F0'} />
                </Pressable>
              ))}
            </View>
            <Text className="mt-4 text-base font-bold text-textMain">Your review</Text>
            <TextInput
              className="mt-2 rounded-2xl border border-borderLight bg-white p-3 text-base text-textMain"
              style={{ height: 120, textAlignVertical: 'top' }}
              multiline
              placeholder="Share your experience..."
              placeholderTextColor="#8A90A6"
              value={draftComment}
              onChangeText={setDraftComment}
            />
            <Text className="mt-4 text-base font-bold text-textMain">Photos</Text>
            <Pressable className="mt-2 rounded-2xl border border-borderLight bg-white p-3 flex-row items-center justify-center" onPress={pickPhotos}>
              <Ionicons name="image-outline" size={20} color="#4F46E5" />
              <Text className="ml-2 text-base font-bold text-brand">Add photos{draftPhotos.length > 0 ? ` (${draftPhotos.length}/4)` : ''}</Text>
            </Pressable>
            {draftPhotos.length > 0 ? (
              <View className="mt-3 flex-row flex-wrap">
                {draftPhotos.map((uri) => (
                  <View key={uri} className="mr-2 mb-2" style={{ width: 72, height: 72 }}>
                    <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 12 }} resizeMode="cover" />
                    <Pressable className="w-6 h-6 rounded-full bg-white items-center justify-center border border-borderLight" style={{ position: 'absolute', top: -6, right: -6 }} onPress={() => removeDraftPhoto(uri)}>
                      <Ionicons name="close" size={14} color="#131B2E" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
            {submitError ? <Text className="mt-2 text-sm text-red-500">{submitError}</Text> : null}
            <View className="mt-4 flex-row items-center">
              <Pressable className="flex-1 rounded-full py-3.5 items-center bg-white border border-brand" onPress={() => setModalVisible(false)}>
                <Text className="text-base font-bold text-brand">Cancel</Text>
              </Pressable>
              <Pressable className="flex-1 ml-3 rounded-full py-3.5 items-center bg-brand" onPress={submitReview} disabled={submitting}>
                <Text className="text-base font-bold text-white">{submitting ? 'Submitting...' : 'Submit'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
