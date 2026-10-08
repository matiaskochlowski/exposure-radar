import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import type { Priority } from '@/domain/types';
import { useTheme } from '@/hooks/use-theme';

/** The reasons behind a score, one bar per contribution (ADR 0002). */
export function ScoreBreakdown({ priority }: { priority: Priority }) {
  const theme = useTheme();
  if (priority.reasons.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        No priority signals apply to this entry.
      </ThemedText>
    );
  }
  return (
    <View style={styles.list}>
      {priority.reasons.map((reason) => (
        <View
          key={reason.code}
          style={styles.item}
          accessible
          accessibilityLabel={`plus ${reason.points} points: ${reason.label}`}>
          <View style={styles.labelRow}>
            <ThemedText type="small" style={styles.label}>
              {reason.label}
            </ThemedText>
            <ThemedText type="smallBold" style={styles.points}>
              +{reason.points}
            </ThemedText>
          </View>
          <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.fill, { width: `${reason.points}%`, backgroundColor: theme.accent }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
  item: { gap: Spacing.one },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  label: { flex: 1 },
  points: { fontFamily: Fonts.mono },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
