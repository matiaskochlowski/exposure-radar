import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import { dueText } from '@/components/cve-row';
import { PriorityPill } from '@/components/priority-pill';
import { ScoreBreakdown } from '@/components/score-breakdown';
import { EmptyView, LoadingView } from '@/components/state-views';
import { ThemedText } from '@/components/themed-text';
import { TriagePicker } from '@/components/triage-picker';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { formatPercent } from '@/domain/priority';
import { extractSafeLinks, type SafeLink } from '@/domain/safe-links';
import { useExposures } from '@/hooks/use-exposures';
import { useTheme } from '@/hooks/use-theme';
import { NOTE_MAX_LENGTH, useTriageStore } from '@/store/triage-store';

export default function ExposureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cveId = String(id ?? '').toUpperCase();
  const theme = useTheme();
  const { kev, exposures } = useExposures();
  const exposure = useMemo(() => exposures.find((e) => e.entry.cveId === cveId), [exposures, cveId]);
  const setStatus = useTriageStore((s) => s.setStatus);
  const setNote = useTriageStore((s) => s.setNote);
  const [note, setDraft] = useState<string | undefined>(undefined);

  // The draft is saved on blur, on "Save note", and when the screen unmounts (a swipe-back
  // with the keyboard open never delivers blur). setNote ignores unchanged text.
  const draftRef = useRef<string | undefined>(undefined);
  const updateDraft = (text: string) => {
    draftRef.current = text;
    setDraft(text);
  };
  const saveDraft = () => {
    if (draftRef.current !== undefined) setNote(cveId, draftRef.current);
  };
  useEffect(
    () => () => {
      if (draftRef.current !== undefined) setNote(cveId, draftRef.current);
    },
    [cveId, setNote],
  );

  const links: SafeLink[] = useMemo(() => {
    if (!exposure) return [];
    const nvd = { url: `https://nvd.nist.gov/vuln/detail/${exposure.entry.cveId}`, host: 'nvd.nist.gov' };
    const fromNotes = extractSafeLinks(exposure.entry.notes).filter((l) => l.url !== nvd.url);
    return [nvd, ...fromNotes];
  }, [exposure]);

  if (kev.isPending) return <LoadingView label="Loading exposure" />;
  if (!exposure) {
    return <EmptyView title={`${cveId} is not in the catalog`} hint="It may have been removed from KEV." />;
  }

  const { entry, epss, priority, triage } = exposure;
  const noteValue = note ?? triage?.note ?? '';

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: entry.cveId }} />

      <View style={styles.hero}>
        <PriorityPill priority={priority} size="large" />
        <ThemedText type="small" themeColor="textSecondary" style={styles.mono}>
          {entry.cveId}
        </ThemedText>
        <ThemedText style={styles.title} accessibilityRole="header">
          {entry.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {entry.vendor} · {entry.product}
        </ThemedText>
      </View>

      <Section title="Why this priority">
        <ScoreBreakdown priority={priority} />
      </Section>

      <View style={[styles.facts, { borderColor: theme.border }]}>
        <Fact label="EPSS" value={epss ? formatPercent(epss.epss) : 'Not scored'} />
        <Fact label="EPSS percentile" value={epss ? formatPercent(epss.percentile) : 'n/a'} />
        <Fact label="Added to KEV" value={entry.dateAdded} />
        <Fact
          label="KEV due date"
          value={`${entry.dueDate} (${dueText(priority.daysUntilDue).toLowerCase()})`}
          danger={priority.daysUntilDue < 0}
        />
        <Fact
          label="Ransomware use"
          value={entry.knownRansomware ? 'Known' : 'Unknown'}
          danger={entry.knownRansomware}
        />
        <Fact label="Weakness" value={entry.cwes.length ? entry.cwes.join(', ') : 'n/a'} />
      </View>

      <Section title="Description">
        <ThemedText type="small">{entry.description || 'No description in the feed.'}</ThemedText>
      </Section>

      <Section title="Required action">
        <ThemedText type="small">{entry.requiredAction || 'No action listed in the feed.'}</ThemedText>
      </Section>

      <Section title="Triage">
        <TriagePicker value={triage?.status ?? 'new'} onChange={(status) => setStatus(entry.cveId, status)} />
        <TextInput
          value={noteValue}
          onChangeText={updateDraft}
          onBlur={saveDraft}
          placeholder="Notes for your team (stays on this device)"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Triage note"
          maxLength={NOTE_MAX_LENGTH}
          multiline
          style={[styles.note, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
        {note !== undefined && note !== (triage?.note ?? '') && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save note"
            onPress={saveDraft}
            style={[styles.save, { backgroundColor: theme.accent }]}>
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              Save note
            </ThemedText>
          </Pressable>
        )}
      </Section>

      <Section title="References">
        <ThemedText type="small" themeColor="textSecondary">
          Links from the KEV feed. Only https links are shown, and each one opens in your browser.
        </ThemedText>
        {links.map((link) => (
          <ExternalLink key={link.url} href={link.url as `https://${string}`} accessibilityRole="link">
            <ThemedText type="small" themeColor="accent">
              {link.host} ↗
            </ThemedText>
          </ExternalLink>
        ))}
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" accessibilityRole="header">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

function Fact({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={styles.fact} accessible accessibilityLabel={`${label}: ${value}`}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold" themeColor={danger ? 'danger' : 'text'}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  hero: { gap: Spacing.two },
  mono: { fontFamily: Fonts.mono },
  title: { fontSize: 22, lineHeight: 28, fontWeight: 600 },
  section: { gap: Spacing.two },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.two,
  },
  fact: { width: '50%', paddingVertical: Spacing.two, paddingRight: Spacing.two, gap: Spacing.half },
  note: { minHeight: 88, borderRadius: 10, padding: Spacing.three, fontSize: 15, textAlignVertical: 'top' },
  save: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    borderRadius: 10,
  },
});
