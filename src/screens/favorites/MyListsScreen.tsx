import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getFavoritePlaces, toggleFavorite } from '../../services/favoritesService';
import {
  createCollection,
  deleteCollection,
  getCollectionItemCounts,
  getCollectionPlaces,
  getCollections,
  removePlaceFromCollection,
} from '../../services/collectionsService';
import type { Collection, Place } from '../../types';
import AppButton from '../../components/AppButton';
import PlaceCard from '../../components/PlaceCard';

export default function MyListsScreen({ navigation: propNavigation }: { navigation?: any } = {}) {
  const { t, i18n } = useTranslation();
  const hookNavigation = useNavigation<any>();
  const navigation = propNavigation || hookNavigation;
  const { session } = useAuth();
  const userId = session?.user?.id || '';
  const [favoritePlaces, setFavoritePlaces] = useState<Place[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  // Collection currently being viewed, or null = all favorites.
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [collectionPlaces, setCollectionPlaces] = useState<Place[]>([]);
  // place_type filter among the favorites: 'all' or a real place_type value.
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [listError, setListError] = useState('');

  // New-collection modal
  const [newModalVisible, setNewModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newError, setNewError] = useState('');
  const [creating, setCreating] = useState(false);

  const loadAll = useCallback(async (isRefresh = false) => {
    if (!userId) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setErrorMessage('');
    setListError('');
    try {
      const [favs, cols] = await Promise.all([getFavoritePlaces(userId), getCollections(userId)]);
      setFavoritePlaces(favs);
      setCollections(cols);
      setCounts(await getCollectionItemCounts(cols.map((c) => c.id)));
      setSelectedCollectionId(null);
      setCollectionPlaces([]);
      setTypeFilter('all');
    } catch {
      setErrorMessage('Could not load your lists. Please try again.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Keep the tab fresh when the user comes back from a Detail page.
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => { if (userId) loadAll(true); });
    return unsub;
  }, [navigation, userId, loadAll]);

  const selectedCollection = selectedCollectionId
    ? collections.find((c) => c.id === selectedCollectionId) || null
    : null;

  const selectCollection = useCallback(async (collection: Collection) => {
    setSelectedCollectionId(collection.id);
    setTypeFilter('all');
    setListError('');
    try {
      setCollectionPlaces(await getCollectionPlaces(collection.id));
    } catch {
      setListError('Could not load this collection. Please try again.');
      setCollectionPlaces([]);
    }
  }, []);

  const clearCollection = useCallback(() => {
    setSelectedCollectionId(null);
    setCollectionPlaces([]);
    setTypeFilter('all');
  }, []);

  const openNewModal = () => {
    setNewName('');
    setNewError('');
    setNewModalVisible(true);
  };

  const handleCreateCollection = async () => {
    if (!newName.trim()) {
      setNewError('Please enter a name.');
      return;
    }
    setCreating(true);
    setNewError('');
    try {
      const created = await createCollection(userId, newName.trim());
      setCollections((prev) => [...prev, created]);
      setCounts((prev) => ({ ...prev, [created.id]: 0 }));
      setNewModalVisible(false);
      setNewName('');
      // Open the new collection right away so the user can fill it.
      setSelectedCollectionId(created.id);
      setCollectionPlaces([]);
      setTypeFilter('all');
    } catch {
      setNewError('Could not create the collection. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const confirmDeleteCollection = (collection: Collection) => {
    Alert.alert(
      'Delete this collection?',
      'Places stay in your favorites.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCollection(collection.id);
              setCollections((prev) => prev.filter((c) => c.id !== collection.id));
              setCounts((prev) => {
                const next = { ...prev };
                delete next[collection.id];
                return next;
              });
              if (selectedCollectionId === collection.id) clearCollection();
            } catch {
              setListError('Could not delete the collection. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleRemoveFromCollection = async (place: Place) => {
    if (!selectedCollectionId) return;
    try {
      await removePlaceFromCollection(selectedCollectionId, place.id);
      setCollectionPlaces((prev) => prev.filter((p) => p.id !== place.id));
      setCounts((prev) => ({ ...prev, [selectedCollectionId]: Math.max(0, (prev[selectedCollectionId] || 1) - 1) }));
    } catch {
      setListError('Could not remove this stay. Please try again.');
    }
  };

  const handleShare = async () => {
    try {
      const names = favoritePlaces.slice(0, 5).map((p) => p.title).join(', ');
      await Share.share({
        message: favoritePlaces.length > 0
          ? `My favorite stays on WanderStay: ${names}${favoritePlaces.length > 5 ? ` and ${favoritePlaces.length - 5} more` : ''}`
          : 'My favorite stays on WanderStay',
      });
    } catch {
      // Share sheet dismissed — nothing to do.
    }
  };

  // Real place_type values present among the user's favorites (never fixed sample pills).
  const typeOptions = useMemo(() => {
    const seen = new Set<string>();
    favoritePlaces.forEach((p) => {
      if (p.place_type) seen.add(p.place_type);
    });
    return Array.from(seen);
  }, [favoritePlaces]);

  // Base list: the selected collection's places, or all favorites.
  const basePlaces = selectedCollectionId ? collectionPlaces : favoritePlaces;
  const places = typeFilter === 'all'
    ? basePlaces
    : basePlaces.filter((p) => p.place_type === typeFilter);

  if (!session) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <Text className="text-lg font-bold text-textMain text-center">You need to sign in</Text>
        <Text className="mt-2 text-sm text-textMuted text-center">Sign in to view your lists. Guests can still browse and search in the Search tab.</Text>
        <View className="mt-6 w-full"><AppButton title="Sign in" onPress={() => navigation.navigate('Login')} /></View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-sm text-textMuted">Loading your lists...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <Text className="text-lg font-bold text-textMain text-center">Could not load data</Text>
        <Text className="mt-2 text-sm text-textMuted text-center">{errorMessage}</Text>
        <View className="mt-6 w-full"><AppButton title="Try again" onPress={() => loadAll()} /></View>
      </View>
    );
  }

  const subtitle = selectedCollection
    ? `${collectionPlaces.length} ${collectionPlaces.length === 1 ? 'stay' : 'stays'} in ${selectedCollection.name}`
    : `${favoritePlaces.length} saved ${favoritePlaces.length === 1 ? 'stay' : 'stays'} you recently favorited`;
  const userInitial = (session.user?.email || 'W').charAt(0).toUpperCase();

  return (
    <View className="flex-1 bg-appBg">
      {/* Figma 'favouries' header: back, 'My Lists' centred, '...' menu + purple avatar */}
      <View className="px-5 pt-12 pb-3 bg-white border-b border-borderLight flex-row items-center">
        <Pressable
          className="w-9 h-9 rounded-full bg-white items-center justify-center border border-borderLight"
          onPress={() => { if (navigation.canGoBack?.()) navigation.goBack(); else navigation.navigate('Search'); }}
        >
          <Ionicons name="arrow-back" size={20} color="#131B2E" />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-bold text-textMain">{t('favorites.title')}</Text>
        <Pressable className="w-9 h-9 rounded-full bg-white items-center justify-center border border-borderLight" onPress={openNewModal}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#131B2E" />
        </Pressable>
        <Pressable className="ml-2 w-9 h-9 rounded-full bg-brand items-center justify-center" onPress={() => navigation.navigate('Profile')}>
          <Text className="text-sm font-bold text-white">{userInitial}</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAll(true)} colors={['#4F46E5']} />}>
        {/* Content header: 'Places you liked' + real count + share */}
        <View className="mx-5 mt-4 flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-2xl font-bold text-textMain">{i18n.language === 'vi' ? 'Chỗ nghỉ bạn đã thích' : 'Places you liked'}</Text>
            <Text className="mt-1 text-sm text-textMuted">{subtitle}</Text>
          </View>
          <Pressable className="w-10 h-10 rounded-full bg-white border border-borderLight items-center justify-center" onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#4F46E5" />
          </Pressable>
        </View>

        {/* Collection clear chip, shown only while a collection is selected */}
        {selectedCollection ? (
          <Pressable className="mx-5 mt-3 self-start flex-row items-center px-3 py-2 rounded-full bg-brand" onPress={clearCollection}>
            <Ionicons name="bookmark" size={15} color="#FFFFFF" />
            <Text className="ml-1.5 text-sm font-bold text-white">{i18n.language === 'vi' ? 'Bộ sưu tập' : 'Collection'}: {selectedCollection.name}</Text>
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </Pressable>
        ) : null}

        {/* Filter pills: 'All stays' + one per real place_type among the favorites */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mt-4" contentContainerStyle={{ alignItems: 'center', paddingRight: 20 }} style={{ flexGrow: 0 }}>
          <Pressable
            onPress={() => setTypeFilter('all')}
            className={`mr-2 px-4 py-2 rounded-full border flex-row items-center ${typeFilter === 'all' ? 'bg-brand border-brand' : 'bg-white border-borderLight'}`}
          >
            <Text className={`text-sm font-bold ${typeFilter === 'all' ? 'text-white' : 'text-textMain'}`}>{t('search.allStays')}</Text>
            <View className={`ml-1.5 px-1.5 py-0.5 rounded-full ${typeFilter === 'all' ? 'bg-white' : 'bg-appBg'}`}>
              <Text className={`text-xs font-bold ${typeFilter === 'all' ? 'text-brand' : 'text-textMuted'}`}>{favoritePlaces.length}</Text>
            </View>
          </Pressable>
          {typeOptions.map((type) => {
            const isSelected = typeFilter === type;
            const count = favoritePlaces.filter((p) => p.place_type === type).length;
            return (
              <Pressable
                key={type}
                onPress={() => setTypeFilter(type)}
                className={`mr-2 px-4 py-2 rounded-full border ${isSelected ? 'bg-brand border-brand' : 'bg-white border-borderLight'}`}
              >
                <Text className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-textMain'}`}>{type} ({count})</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {listError ? <Text className="mx-5 mt-3 text-sm text-red-500">{listError}</Text> : null}

        {/* Favorites feed */}
        {places.length === 0 ? (
          <View className="items-center justify-center px-6 py-10">
            {selectedCollectionId ? (
              <>
                <Text className="text-lg font-bold text-textMain text-center">
                  {i18n.language === 'vi' ? 'Chưa có chỗ nghỉ nào trong bộ sưu tập này' : 'No stays in this collection yet'}
                </Text>
                <Text className="mt-2 text-sm text-textMuted text-center">
                  {i18n.language === 'vi' ? 'Lưu chỗ nghỉ từ trang chi tiết.' : 'Add stays from their Detail page.'}
                </Text>
              </>
            ) : typeFilter !== 'all' ? (
              <>
                <Text className="text-lg font-bold text-textMain text-center">
                  {i18n.language === 'vi' ? `Chưa có chỗ nghỉ kiểu ${typeFilter} nào` : `No ${typeFilter} stays saved yet`}
                </Text>
                <Text className="mt-2 text-sm text-textMuted text-center">
                  {i18n.language === 'vi' ? 'Hãy khám phá và lưu thêm chỗ nghỉ.' : 'Try another type, or save more stays.'}
                </Text>
              </>
            ) : (
              <>
                <Text className="text-lg font-bold text-textMain text-center">{t('favorites.noFavoritesTitle')}</Text>
                <Text className="mt-2 text-sm text-textMuted text-center">{t('favorites.noFavoritesDesc')}</Text>
              </>
            )}
            <View className="mt-6 w-full"><AppButton title={t('favorites.exploreStays')} onPress={() => navigation.navigate('Search')} /></View>
          </View>
        ) : (
          <View className="mx-5 mt-4">
            {places.map((item) => (
              <View key={item.id}>
                <Pressable onPress={() => navigation.navigate('Detail', { placeId: item.id })}>
                  <PlaceCard
                    place={item}
                    isFavorite
                    onToggleFavorite={async () => {
                      await toggleFavorite(userId, item.id, true);
                      setFavoritePlaces((prev) => prev.filter((x) => x.id !== item.id));
                      if (selectedCollectionId) setCollectionPlaces((prev) => prev.filter((x) => x.id !== item.id));
                    }}
                  />
                </Pressable>
                {selectedCollectionId ? (
                  <Pressable className="mb-4 -mt-2 self-start flex-row items-center px-3 py-1.5 rounded-full bg-white border border-borderLight" onPress={() => handleRemoveFromCollection(item)}>
                    <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                    <Text className="ml-1 text-sm font-bold text-textMain">Remove from this collection</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* 'Curate a fresh collection' card */}
        <View className="mx-5 mt-4 rounded-3xl bg-white border border-borderLight p-5">
          <View className="flex-row items-start">
            <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: '#EDE9FE' }}>
              <Ionicons name="folder-outline" size={24} color="#4F46E5" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-base font-bold text-textMain">Curate a fresh collection</Text>
              <Text className="mt-1 text-sm text-textMuted leading-5">Organize your favorite homestays by upcoming seasons or weekend trips.</Text>
            </View>
          </View>
          <Pressable className="mt-4 self-start flex-row items-center px-4 py-2.5 rounded-full bg-brand" onPress={openNewModal}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text className="ml-1 text-sm font-bold text-white">Create new collection</Text>
          </Pressable>
        </View>

        {/* 'Your collections' — not in Figma, built for real per the settled decision */}
        {collections.length > 0 ? (
          <View className="mx-5 mt-4">
            <Text className="text-base font-bold text-textMain">Your collections</Text>
            <View className="mt-2 rounded-3xl bg-white border border-borderLight overflow-hidden">
              {collections.map((collection, index) => {
                const isSelected = selectedCollectionId === collection.id;
                return (
                  <Pressable
                    key={collection.id}
                    onPress={() => selectCollection(collection)}
                    onLongPress={() => confirmDeleteCollection(collection)}
                    className={`flex-row items-center px-4 py-3.5 ${isSelected ? 'bg-appBg' : 'bg-white'}`}
                    style={index < collections.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#E6E3F5' } : undefined}
                  >
                    <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: '#EDE9FE' }}>
                      <Ionicons name="bookmark" size={18} color="#4F46E5" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-base font-bold text-textMain">{collection.name}</Text>
                      <Text className="text-sm text-textMuted">
                        {counts[collection.id] || 0} {(counts[collection.id] || 0) === 1 ? 'stay' : 'stays'}
                      </Text>
                    </View>
                    {isSelected ? <Ionicons name="checkmark-circle" size={20} color="#4F46E5" /> : null}
                    <Ionicons name="chevron-forward" size={20} color="#5A6478" />
                  </Pressable>
                );
              })}
            </View>
            <Text className="mt-2 text-xs text-textMuted">Long-press a collection to delete it. Places stay in your favorites.</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* New collection modal */}
      <Modal visible={newModalVisible} animationType="slide" transparent onRequestClose={() => setNewModalVisible(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(19,27,46,0.5)' }} onPress={() => setNewModalVisible(false)}>
          <Pressable className="bg-white rounded-t-3xl p-5" onPress={(e) => e.stopPropagation()}>
            <Text className="text-lg font-bold text-textMain">{t('favorites.newCollection')}</Text>
            <Text className="mt-1 text-sm text-textMuted">
              {i18n.language === 'vi' ? 'Nhóm các chỗ nghỉ yêu thích cho chuyến đi của bạn.' : 'Group your favourite stays together.'}
            </Text>
            <TextInput
              className="mt-4 px-4 py-3 rounded-2xl border border-borderLight bg-appBg text-base text-textMain"
              placeholder={t('favorites.enterCollectionName')}
              placeholderTextColor="#8A90A6"
              value={newName}
              onChangeText={(text) => { setNewName(text); setNewError(''); }}
              autoFocus
              maxLength={50}
            />
            {newError ? <Text className="mt-2 text-sm text-red-500">{newError}</Text> : null}
            <View className="mt-4 flex-row">
              <Pressable className="flex-1 mr-2 py-3 rounded-full border border-brand items-center" onPress={() => setNewModalVisible(false)}>
                <Text className="text-base font-bold text-brand">{t('common.cancel')}</Text>
              </Pressable>
              <Pressable className="flex-1 ml-2 py-3 rounded-full bg-brand items-center" onPress={handleCreateCollection} disabled={creating}>
                <Text className="text-base font-bold text-white">{creating ? (i18n.language === 'vi' ? 'Đang tạo...' : 'Creating...') : t('favorites.create')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
