import AsyncStorage from '@react-native-async-storage/async-storage';

import { createItem, ITEMS_KEY, loadItems } from '../lib/items';

const getItem = jest.mocked(AsyncStorage.getItem);
const setItem = jest.mocked(AsyncStorage.setItem);

beforeEach(() => {
  jest.resetAllMocks();
  getItem.mockResolvedValue(null);
  setItem.mockResolvedValue();
});

test('a fresh install has no notes', async () => {
  await expect(loadItems()).resolves.toEqual([]);
  expect(getItem).toHaveBeenCalledWith(ITEMS_KEY);
});

test('saving trims input, prepends the new note and survives a reload', async () => {
  const previous = { id: 'older', title: 'Earlier', body: 'Keep me', createdAt: '2026-01-01T00:00:00.000Z' };
  getItem.mockResolvedValue(JSON.stringify([previous]));
  const item = await createItem('  Groceries  ', '  Apples\nBread  ');
  expect(item).toEqual({ id: expect.any(String), title: 'Groceries', body: 'Apples\nBread', createdAt: expect.any(String) });
  expect(Number.isFinite(Date.parse(item.createdAt))).toBe(true);
  const saved = setItem.mock.calls[0][1];
  expect(JSON.parse(saved)).toEqual([item, previous]);
  getItem.mockResolvedValue(saved);
  await expect(loadItems()).resolves.toEqual([item, previous]);
});

test('a blank title does not write storage', async () => {
  await expect(createItem('  ', 'Body')).rejects.toThrow('title');
  expect(setItem).not.toHaveBeenCalled();
});

test.each(['not json', '{}', '[{"id":"broken"}]'])('invalid saved data is preserved: %s', async (raw) => {
  getItem.mockResolvedValue(raw);
  await expect(createItem('New', '')).rejects.toThrow();
  expect(setItem).not.toHaveBeenCalled();
});

test('a failed write is reported to the caller', async () => {
  setItem.mockRejectedValue(new Error('Storage full'));
  await expect(createItem('Draft', '')).rejects.toThrow('Storage full');
});
