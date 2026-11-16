import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, styles } from '@/components/ui';
import { attachPhoto, Item, loadItems } from '@/lib/items';

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Item>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const [permissionDenied, setPermissionDenied] = useState(false);
  const [picking, setPicking] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  async function pickPhoto() {
    if (!item || picking) return;
    setPicking(true);
    setPhotoError(false);
    let savedFile: File | undefined;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPermissionDenied(true);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.8,
      });
      if (result.canceled) return;
      const source = new File(result.assets[0].uri);
      savedFile = new File(Paths.document, `note-photo-${item.id}-${Date.now()}${source.extension}`);
      source.copy(savedFile);
      const updated = await attachPhoto(item.id, savedFile.uri);
      setItem(updated);
      if (item.photoUri) {
        try {
          const previous = new File(item.photoUri);
          if (previous.exists) previous.delete();
        } catch {}
      }
    } catch {
      if (savedFile?.exists) savedFile.delete();
      setPhotoError(true);
    } finally {
      setPicking(false);
    }
  }

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

  if (permissionDenied) {
    return (
      <View style={[styles.page, styles.content]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.heading}>Permission required</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {loading ? <ActivityIndicator accessibilityLabel="Loading note" /> : error ? <>
        <Text accessibilityRole="alert" style={styles.error}>Could not load this note.</Text>
        <Button title="Try again" onPress={() => { setLoading(true); setError(false); setAttempt((value) => value + 1); }} />
      </> : item ? <>
        <Text selectable style={styles.heading}>{item.title}</Text>
        <Text style={styles.muted}>{new Date(item.createdAt).toLocaleString()}</Text>
        <Text selectable style={styles.text}>{item.body || 'No additional details.'}</Text>
        <View style={photoStyles.row}>
          <Text style={styles.label}>Photo</Text>
          <Pressable accessibilityRole="button" disabled={picking} onPress={pickPhoto}
            style={({ pressed }) => [photoStyles.control, (pressed || picking) && styles.dim]}>
            <View style={photoStyles.camera}>
              <View style={photoStyles.cameraTop} />
              <View style={photoStyles.lens} />
            </View>
          </Pressable>
        </View>
        {picking && <ActivityIndicator accessibilityLabel="Attaching photo" />}
        {photoError && <Text accessibilityRole="alert" style={styles.error}>Could not attach the photo. Please try again.</Text>}
        {item.photoUri && <Image source={{ uri: item.photoUri }} style={photoStyles.thumbnail}
          accessibilityLabel={`Photo attached to ${item.title}`} resizeMode="cover" />}

      </> : <Text style={styles.text}>This note is not available on this device.</Text>}
    </ScrollView>
  );
}

const photoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  control: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#285d4a',
    alignItems: 'center', justifyContent: 'center' },
  camera: { width: 26, height: 19, borderWidth: 2, borderColor: '#fff', borderRadius: 4,
    alignItems: 'center', justifyContent: 'center' },
  cameraTop: { position: 'absolute', top: -6, width: 12, height: 5,
    borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: '#fff' },
  lens: { width: 10, height: 10, borderWidth: 2, borderColor: '#fff', borderRadius: 5 },
  thumbnail: { width: 160, height: 160, borderRadius: 12, backgroundColor: '#e0e6df' },
});
