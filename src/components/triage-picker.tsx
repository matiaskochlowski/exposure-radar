import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { TRIAGE_STATUSES, type TriageStatus } from '@/domain/types';
import { useTheme } from '@/hooks/use-theme';

export const STATUS_LABELS: Record<TriageStatus, string> = {
  new: 'New',
  investigating: 'Investigating',
  mitigated: 'Mitigated',
  accepted: 'Risk accepted',
};

type TriagePickerProps = { value: TriageStatus; onChange: (status: TriageStatus) => void };

export function TriagePicker({ value, onChange }: TriagePickerProps) {
  const theme = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Triage status" style={styles.group}>
      {TRIAGE_STATUSES.map((status) => {
        const selected = status === value;
        return (
          <Pressable
            key={status}
            accessibilityRole="radio"
            accessibilityLabel={STATUS_LABELS[status]}
            accessibilityState={{ selected }}
            onPress={() => onChange(status)}
            style={({ pressed }) => [
              styles.option,
              { borderColor: selected ? theme.accent : theme.border },
              selected && { backgroundColor: theme.accent },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={{ color: selected ? theme.onAccent : theme.text }}>
              {STATUS_LABELS[status]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
  },
  pressed: { opacity: 0.7 },
});
