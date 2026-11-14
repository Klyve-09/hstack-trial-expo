import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { Button, styles } from '@/components/ui';
import { Item, loadItems } from '@/lib/items';

export default function ItemsScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(false);
    loadItems().then((saved) => {
      if (active) setItems(saved);
    }).catch(() => {
      if (active) setError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  useFocusEffect(refresh);

  return (
    <View style={styles.page}>
      <FlatList data={error || loading ? [] : items} keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<View style={{ gap: 16, marginBottom: 8 }}>
          <Text style={styles.heading}>Your notes</Text>
          <Text style={styles.muted}>A quiet place for thoughts, ideas, and things to remember. Saved on this device.</Text>
          <Button title="New note" onPress={() => router.push('/compose')} />
        </View>}
        ListEmptyComponent={loading ? <ActivityIndicator accessibilityLabel="Loading notes" /> : error ?
          <View style={{ gap: 16 }}>
            <Text accessibilityRole="alert" style={styles.error}>Could not load your notes. Please try again.</Text>
            <Button title="Try again" onPress={refresh} />
          </View> : <Text style={styles.text}>No notes yet. Write your first one.</Text>}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.title}`}
            style={[styles.card, { marginBottom: 12 }]}
            onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}>
            <Text style={styles.title}>{item.title}</Text>
            {!!item.body && <Text style={styles.text} numberOfLines={2}>{item.body}</Text>}
            <Text style={styles.muted}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </Pressable>
        )} />
    </View>
  );
}
