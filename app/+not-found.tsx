import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function NotFoundScreen() {
  useFocusEffect(useCallback(() => {
    router.dismissTo('/');
  }, []));

  return null;
}
