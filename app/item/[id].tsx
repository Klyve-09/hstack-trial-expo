import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text } from 'react-native';

import { Button, styles } from '@/components/ui';
import { Item, loadItems } from '@/lib/items';

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Item>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    loadItems().then((items) => {
      if (active) setItem(items.find((note) => note.id === id));
    }).catch(() => {
      if (active) setError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id, attempt]);

  useEffect(() => {
    if (!loading && !error && !item) router.dismissTo('/');
  }, [loading, error, item]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {loading ? <ActivityIndicator accessibilityLabel="Loading note" /> : error ? <>
        <Text accessibilityRole="alert" style={styles.error}>Could not load this note.</Text>
        <Button title="Try again" onPress={() => { setLoading(true); setError(false); setAttempt((value) => value + 1); }} />
      </> : item ? <>
        <Text selectable style={styles.heading}>{item.title}</Text>
        <Text style={styles.muted}>{new Date(item.createdAt).toLocaleString()}</Text>
        <Text selectable style={styles.text}>{item.body || 'No additional details.'}</Text>
      </> : null}
    </ScrollView>
  );
}
