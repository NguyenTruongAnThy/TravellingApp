import { supabase } from '../lib/supabase';
import type { Collection, Place } from '../types';

// Tables collections / collection_items already exist on Supabase
// (created with Run without RLS, all tables UNRESTRICTED).
// collections: id, user_id, name, created_at
// collection_items: id, collection_id, place_id, created_at

export async function getCollections(userId: string): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('id, user_id, name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as Collection[];
}

export async function getCollectionItemCounts(collectionIds: string[]): Promise<Record<string, number>> {
  if (collectionIds.length === 0) return {};
  const { data, error } = await supabase
    .from('collection_items')
    .select('collection_id')
    .in('collection_id', collectionIds);
  if (error) throw error;
  const counts: Record<string, number> = {};
  (data || []).forEach((row: any) => {
    counts[row.collection_id] = (counts[row.collection_id] || 0) + 1;
  });
  return counts;
}

export async function createCollection(userId: string, name: string): Promise<Collection> {
  const { data, error } = await supabase
    .from('collections')
    .insert({ user_id: userId, name: name.trim() })
    .select('id, user_id, name, created_at')
    .single();
  if (error) throw error;
  return data as Collection;
}

export async function deleteCollection(collectionId: string): Promise<void> {
  // Remove the items first, then the collection itself.
  // The places and the favorites are untouched.
  const { error: itemsError } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId);
  if (itemsError) throw itemsError;
  const { error } = await supabase.from('collections').delete().eq('id', collectionId);
  if (error) throw error;
}

export async function getCollectionPlaces(collectionId: string): Promise<Place[]> {
  const { data, error } = await supabase
    .from('collection_items')
    .select('place_id, places(*)')
    .eq('collection_id', collectionId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const places: Place[] = [];
  (data || []).forEach((row: any) => {
    if (row.places) places.push(row.places as Place);
  });
  return places;
}

export async function addPlaceToCollection(
  collectionId: string,
  placeId: string,
): Promise<{ already: boolean }> {
  // NOTE: collection_items on Supabase has NO id column — only
  // collection_id, place_id, created_at. Selecting 'id' here used to fail
  // with "column does not exist" and made every save show the red error.
  const { data: existing, error: checkError } = await supabase
    .from('collection_items')
    .select('collection_id')
    .eq('collection_id', collectionId)
    .eq('place_id', placeId)
    .limit(1);
  if (checkError) throw checkError;
  if (existing && existing.length > 0) return { already: true };
  const { error } = await supabase
    .from('collection_items')
    .insert({ collection_id: collectionId, place_id: placeId });
  if (error) {
    // Unique violation: another tap added it in between — treat as already saved.
    if ((error as any).code === '23505') return { already: true };
    throw error;
  }
  return { already: false };
}

export async function removePlaceFromCollection(collectionId: string, placeId: string): Promise<void> {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('place_id', placeId);
  if (error) throw error;
}

export async function getCollectionsContainingPlace(userId: string, placeId: string): Promise<string[]> {
  const collections = await getCollections(userId);
  if (collections.length === 0) return [];
  const ids = collections.map((c) => c.id);
  const { data, error } = await supabase
    .from('collection_items')
    .select('collection_id')
    .eq('place_id', placeId)
    .in('collection_id', ids);
  if (error) throw error;
  return (data || []).map((row: any) => row.collection_id as string);
}
