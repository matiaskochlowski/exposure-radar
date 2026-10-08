import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { CveRow } from '@/components/cve-row';
import { FilterChip } from '@/components/filter-chip';
import { Screen } from '@/components/screen';
import { SourceBanner } from '@/components/source-banner';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { applyQueue, DEFAULT_FILTERS, type QueueFilters } from '@/domain/queue';
import type { Exposure } from '@/domain/types';
import { useExposures } from '@/hooks/use-exposures';
import { useTheme } from '@/hooks/use-theme';

type ToggleKey = Exclude<keyof QueueFilters, 'search'>;
const CHIPS: { key: ToggleKey; label: string }[] = [
  { key: 'ransomwareOnly', label: 'Ransomware' },
  { key: 'dueSoonOnly', label: 'Due ≤ 7d' },
  { key: 'newOnly', label: 'New this month' },
  { key: 'showClosed', label: 'Show closed' },
];

export default function QueueScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { kev, epss, exposures, now } = useExposures();
  const [filters, setFilters] = useState<QueueFilters>(DEFAULT_FILTERS);

  const queue = useMemo(() => applyQueue(exposures, filters, now), [exposures, filters, now]);
  const openCve = useCallback((cveId: string) => router.push(`/cve/${cveId}`), [router]);
  const toggle = (key: ToggleKey) => setFilters((f) => ({ ...f, [key]: !f[key] }));

  if (kev.isPending) return <LoadingView label="Loading the KEV catalog" />;
  if (kev.isError)
    return <ErrorView message="Could not load vulnerability data." onRetry={() => kev.refetch()} />;

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle" accessibilityRole="header">
          Exposure queue
        </ThemedText>
        <SourceBanner
          source={kev.data.source}
          epssSource={epss.data?.source ?? 'snapshot'}
          catalogVersion={kev.data.catalog.catalogVersion}
          total={exposures.length}
          shown={queue.length}
        />
        <TextInput
          value={filters.search}
          onChangeText={(search) => setFilters((f) => ({ ...f, search }))}
          placeholder="Search CVE, vendor or product"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Search CVE, vendor or product"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          style={[styles.search, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CHIPS.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              selected={filters[chip.key]}
              onToggle={() => toggle(chip.key)}
            />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={queue}
        keyExtractor={keyOf}
        renderItem={({ item }) => <CveRow exposure={item} onPress={openCve} />}
        initialNumToRender={15}
        windowSize={7}
        refreshControl={<RefreshControl refreshing={kev.isRefetching} onRefresh={() => kev.refetch()} />}
        ListEmptyComponent={
          <EmptyView
            title="Nothing matches"
            hint="Clear the search or turn off a filter to see more exposures."
          />
        }
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

const keyOf = (item: Exposure) => item.entry.cveId;

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.two },
  search: { minHeight: 44, borderRadius: 10, paddingHorizontal: Spacing.three, fontSize: 16 },
  chips: { gap: Spacing.two, paddingBottom: Spacing.two },
  list: { paddingBottom: Spacing.six },
});
