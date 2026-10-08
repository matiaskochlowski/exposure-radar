import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FilterChipProps = { label: string; selected: boolean; onToggle: () => void };

export function FilterChip({ label, selected, onToggle }: FilterChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      hitSlop={{ top: 6, bottom: 6 }}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: selected ? theme.accent : theme.border },
        selected && { backgroundColor: theme.accent },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="small" style={{ color: selected ? theme.onAccent : theme.text }}>
        {selected ? '✓ ' : ''}
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
  },
  pressed: { opacity: 0.7 },
});
