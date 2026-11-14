import { Pressable, StyleSheet, Text } from 'react-native';

export function Button({ title, onPress, disabled = false }: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.button, (disabled || pressed) && styles.dim]}>
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#faf8f4' },
  content: { padding: 24, gap: 16, flexGrow: 1 },
  heading: { fontSize: 30, fontWeight: '700', color: '#253b35' },
  text: { fontSize: 16, lineHeight: 25, color: '#344840' },
  muted: { fontSize: 14, lineHeight: 22, color: '#67766e' },
  card: { backgroundColor: '#ffffff', padding: 20, borderRadius: 14, gap: 8,
    borderWidth: 1, borderColor: '#e0e6df' },
  title: { fontSize: 20, fontWeight: '600', color: '#253b35' },
  label: { fontSize: 16, fontWeight: '600', color: '#253b35' },
  input: { borderWidth: 1, borderColor: '#a8b6ae', borderRadius: 10,
    padding: 14, fontSize: 17, color: '#253b35', backgroundColor: '#fff' },
  bodyInput: { minHeight: 200, textAlignVertical: 'top' },
  error: { color: '#a62f27', fontSize: 16, lineHeight: 24 },
  button: { padding: 16, borderRadius: 10, backgroundColor: '#285d4a', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  dim: { opacity: 0.5 },
});
