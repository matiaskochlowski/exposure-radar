import { StyleSheet, Text, View } from 'react-native';

import { BandColors, Fonts } from '@/constants/theme';
import type { Priority } from '@/domain/types';

type PriorityPillProps = { priority: Priority; size?: 'small' | 'large' };

/** Band name and score together, so severity never depends on color alone. */
export function PriorityPill({ priority, size = 'small' }: PriorityPillProps) {
  const colors = BandColors[priority.band];
  const large = size === 'large';
  return (
    <View
      accessible
      accessibilityLabel={`${priority.band} priority, score ${priority.score} of 100`}
      style={[styles.pill, large && styles.pillLarge, { backgroundColor: colors.background }]}>
      <Text style={[styles.band, large && styles.bandLarge, { color: colors.text }]}>
        {priority.band.toUpperCase()}
      </Text>
      <Text style={[styles.score, large && styles.scoreLarge, { color: colors.text }]}>{priority.score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillLarge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 10 },
  band: { fontSize: 11, fontWeight: 700, letterSpacing: 0.6 },
  bandLarge: { fontSize: 14 },
  score: { fontSize: 13, fontWeight: 700, fontFamily: Fonts.mono },
  scoreLarge: { fontSize: 22 },
});
