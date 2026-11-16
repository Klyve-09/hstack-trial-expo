import AsyncStorage from '@react-native-async-storage/async-storage';

export type Item = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  photoUri?: string;
};

export const ITEMS_KEY = 'pocket-notes.items.v1';

function isItem(value: unknown): value is Item {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && typeof item.title === 'string' &&
    typeof item.body === 'string' && typeof item.createdAt === 'string' &&
    Number.isFinite(Date.parse(item.createdAt)) &&
    (item.photoUri === undefined || typeof item.photoUri === 'string');
}

export async function loadItems(): Promise<Item[]> {
  const raw = await AsyncStorage.getItem(ITEMS_KEY);
  if (raw === null) return [];
  const items: unknown = JSON.parse(raw);
  if (!Array.isArray(items) || !items.every(isItem)) {
    throw new Error('Saved notes could not be read.');
  }
  return items;
}

export async function createItem(title: string, body: string): Promise<Item> {
  const cleanTitle = title.trim();
  if (!cleanTitle) throw new Error('Give your note a title.');
  const items = await loadItems();
  const item: Item = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    title: cleanTitle,
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify([item, ...items]));
  return item;
}

export async function attachPhoto(id: string, photoUri: string): Promise<Item> {
  const items = await loadItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('This note is no longer available.');
  const updated = { ...items[index], photoUri };
  items[index] = updated;
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  return updated;
}
