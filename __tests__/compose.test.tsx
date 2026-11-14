import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import ComposeScreen from '../app/compose';
import { createItem } from '../lib/items';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('../lib/items', () => ({ createItem: jest.fn() }));
const save = jest.mocked(createItem);

beforeEach(() => jest.resetAllMocks());

test('an empty title shows guidance without saving', async () => {
  await render(<ComposeScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Save note' }));
  expect(screen.getByText('Give your note a title.')).toBeTruthy();
  expect(save).not.toHaveBeenCalled();
});

test('saves the entered text before returning to the list', async () => {
  save.mockResolvedValue({ id: 'one', title: 'Idea', body: 'Make soup', createdAt: '2026-01-01T00:00:00.000Z' });
  await render(<ComposeScreen />);
  await fireEvent.changeText(screen.getByLabelText('Title'), 'Idea');
  await fireEvent.changeText(screen.getByLabelText('Body'), 'Make soup');
  await fireEvent.press(screen.getByRole('button', { name: 'Save note' }));
  await waitFor(() => expect(router.back).toHaveBeenCalledTimes(1));
  expect(save).toHaveBeenCalledWith('Idea', 'Make soup');
});

test('a failed save keeps the draft available for retry', async () => {
  save.mockRejectedValueOnce(new Error('Storage full'));
  await render(<ComposeScreen />);
  await fireEvent.changeText(screen.getByLabelText('Title'), 'Keep this');
  await fireEvent.changeText(screen.getByLabelText('Body'), 'My draft');
  await fireEvent.press(screen.getByRole('button', { name: 'Save note' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/Could not save your note/);
  expect(screen.getByDisplayValue('Keep this')).toBeTruthy();
  expect(screen.getByDisplayValue('My draft')).toBeTruthy();
  expect(router.back).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Save note' })).toBeEnabled();
});
