import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import { CveRow } from '@/components/cve-row';
import { Screen } from '@/components/screen';
import { EmptyView, LoadingView } from '@/components/state-views';
import { ThemedText } from '@/components/themed-text';
import { STATUS_LABELS } from '@/components/triage-picker';
import { Spacing } from '@/constants/theme';
import { compareExposures } from '@/domain/queue';
import type { Exposure, TriageStatus } from '@/domain/types';
import { useExposures } from '@/hooks/use-exposures';
import { useTheme } from '@/hooks/use-theme';

const ORDER: TriageStatus[] = ['investigating', 'mitigated', 'accepted'];

export default function TriageScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { kev, exposures } = useExposures();
  const openCve = useCallback((cveId: string) => router.push(`/cve/${cveId}`), [router]);

  const sections = useMemo(
    () =>
      ORDER.map((status) => ({
        status,
        data: exposures.filter((e) => e.triage?.status === status).sort(compareExposures),
      })).filter((s) => s.data.length > 0),
    [exposures],
  );

  if (kev.isPending) return <LoadingView label="Loading the KEV catalog" />;

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle" accessibilityRole="header">
          Triage
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Exposures you have acted on. Stored on this device only.
        </ThemedText>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={keyOf}
        renderItem={({ item }) => <CveRow exposure={item} onPress={openCve} />}
        renderSectionHeader={({ section }) => (
          <ThemedText
            type="smallBold"
            accessibilityRole="header"
            style={[styles.sectionHeader, { backgroundColor: theme.backgroundElement }]}>
            {STATUS_LABELS[section.status]} · {section.data.length}
          </ThemedText>
        )}
        ListEmptyComponent={
          <EmptyView
            title="Nothing triaged yet"
            hint="Open an exposure from the queue and set its status to start tracking it here."
          />
        }
        stickySectionHeadersEnabled
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

const keyOf = (item: Exposure) => item.entry.cveId;

const styles = StyleSheet.create({
  header: { padding: Spacing.three, gap: Spacing.one },
  sectionHeader: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  list: { flexGrow: 1, paddingBottom: Spacing.six },
});
