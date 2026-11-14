import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput } from 'react-native';

import { Button, styles } from '@/components/ui';
import { createItem } from '@/lib/items';

export default function ComposeScreen() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);

  async function save() {
    if (pending.current) return;
    if (!title.trim()) {
      setError('Give your note a title.');
      return;
    }
    pending.current = true;
    setSaving(true);
    setError('');
    try {
      await createItem(title, body);
      router.back();
    } catch {
      setError('Could not save your note. Your text is still here; please try again.');
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Capture a thought</Text>
        <Text style={styles.label}>Title</Text>
        <TextInput accessibilityLabel="Title" placeholder="What is on your mind?" placeholderTextColor="#67766e"
          style={styles.input} value={title} onChangeText={setTitle} editable={!saving} />
        <Text style={styles.label}>Body</Text>
        <TextInput accessibilityLabel="Body" placeholder="Add the details (optional)" placeholderTextColor="#67766e"
          style={[styles.input, styles.bodyInput]} multiline value={body} onChangeText={setBody} editable={!saving} />
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <Button title={saving ? 'Saving…' : 'Save note'} onPress={save} disabled={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
