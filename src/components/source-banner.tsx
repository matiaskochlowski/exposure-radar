import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { DataSource, EpssSource } from '@/data/queries';
import { useTheme } from '@/hooks/use-theme';

type SourceBannerProps = {
  source: DataSource;
  epssSource: EpssSource;
  catalogVersion: string;
  total: number;
  shown: number;
};

const EPSS_TEXT: Record<EpssSource, string> = {
  live: 'EPSS live',
  partial: 'EPSS partly from snapshot',
  snapshot: 'EPSS from snapshot',
};

/** Always says where the data came from, so a snapshot is never mistaken for live data. */
export function SourceBanner({ source, epssSource, catalogVersion, total, shown }: SourceBannerProps) {
  const theme = useTheme();
  const live = source === 'live';
  return (
    <View style={styles.row} accessibilityRole="summary">
      <View style={[styles.dot, { backgroundColor: live ? theme.success : theme.textSecondary }]} />
      <ThemedText type="small" themeColor="textSecondary">
        {live ? 'Live' : 'Offline snapshot'} · KEV {catalogVersion} · {EPSS_TEXT[epssSource]} · showing{' '}
        {shown} of {total}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
