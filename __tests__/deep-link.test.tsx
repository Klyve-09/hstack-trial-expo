import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import appConfig from '../app.json';

const getItem = jest.mocked(AsyncStorage.getItem);
const note = {
  id: 'saved-note',
  title: 'Weekend plans',
  body: 'Walk by the river.',
  createdAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => jest.resetAllMocks());

test('a saved note link opens its title and body', async () => {
  getItem.mockResolvedValue(JSON.stringify([note]));

  await renderRouter('./app', { initialUrl: '/item/saved-note' });

  expect(await screen.findByText('Weekend plans')).toBeVisible();
  expect(screen.getByText('Walk by the river.')).toBeVisible();
  expect(screen).toHavePathname('/item/saved-note');
});

test('an unknown note link on cold start leaves only the notes list', async () => {
  getItem.mockResolvedValue(JSON.stringify([note]));

  const app = await renderRouter('./app', { initialUrl: '/item/unknown' });

  await waitFor(() => expect(screen).toHavePathname('/'));
  expect(screen.getByText('Your notes')).toBeVisible();
  expect(app.getRouterState()?.routes[0].state?.routes.map((route) => route.name)).toEqual(['index']);
  expect(router.canGoBack()).toBe(false);
  expect(screen.queryByText('This note is not available on this device.')).toBeNull();
});

test('an unknown note link in the running app returns to the existing notes list', async () => {
  getItem.mockResolvedValue(JSON.stringify([note]));
  const app = await renderRouter('./app', { initialUrl: '/' });
  expect(await screen.findByText('Weekend plans')).toBeVisible();

  await act(() => router.push('/item/unknown'));

  await waitFor(() => expect(screen).toHavePathname('/'));
  expect(screen.getByText('Your notes')).toBeVisible();
  expect(app.getRouterState()?.routes[0].state?.routes.map((route) => route.name)).toEqual(['index']);
  expect(router.canGoBack()).toBe(false);
});

test('a storage read failure stays on the detail route and can retry', async () => {
  getItem.mockRejectedValue(new Error('Storage unavailable'));

  await renderRouter('./app', { initialUrl: '/item/saved-note' });

  expect(await screen.findByText('Could not load this note.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  expect(screen).toHavePathname('/item/saved-note');
  expect(screen.queryByText('Your notes')).toBeNull();

  getItem.mockResolvedValue(JSON.stringify([note]));
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

  expect(await screen.findByText('Weekend plans')).toBeVisible();
  expect(screen.getByText('Walk by the river.')).toBeVisible();
  expect(screen).toHavePathname('/item/saved-note');
});

test.each(['/item/', '/item/a/b', '/item/%E0%A4%A', '/nope'])(
  '%s on cold start leaves only the notes list', async (path) => {
    getItem.mockResolvedValue(JSON.stringify([note]));

    const app = await renderRouter('./app', { initialUrl: path });

    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(screen.getByText('Your notes')).toBeVisible();
    expect(app.getRouterState()?.routes[0].state?.routes.map((route) => route.name)).toEqual(['index']);
    expect(router.canGoBack()).toBe(false);
  }
);

test.each(['/item/', '/item/a/b', '/item/%E0%A4%A', '/nope'])(
  '%s in the running app returns to the existing notes list', async (path) => {
    getItem.mockResolvedValue(JSON.stringify([note]));
    const app = await renderRouter('./app', { initialUrl: '/' });
    expect(await screen.findByText('Weekend plans')).toBeVisible();

    await act(() => router.push(path));

    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(screen.getByText('Your notes')).toBeVisible();
    expect(app.getRouterState()?.routes[0].state?.routes.map((route) => route.name)).toEqual(['index']);
    expect(router.canGoBack()).toBe(false);
  }
);

test('the app declares the pocketnotes URL scheme', () => {
  expect(appConfig.expo.scheme).toBe('pocketnotes');
});
