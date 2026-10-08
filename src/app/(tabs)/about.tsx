import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { SNAPSHOT_GENERATED_AT } from '@/data/queries';
import { BAND_THRESHOLDS, PRIORITY_WEIGHTS } from '@/domain/priority';
import { useTheme } from '@/hooks/use-theme';

const REPO_URL = 'https://github.com/matiaskochlowski/exposure-radar';

// Rendered from PRIORITY_WEIGHTS so this explanation cannot drift from the code (ADR 0002).
const W = PRIORITY_WEIGHTS;
const MODEL_ROWS: [string, string][] = [
  ['EPSS probability', `0–${W.epssMax}`],
  ['No EPSS score yet', `${W.epssMissing}`],
  ['Known ransomware use', `+${W.ransomware}`],
  ['KEV due date passed', `+${W.overdue}`],
  ['Due within 7 days', `+${W.dueWithin7}`],
  ['Due within 30 days', `+${W.dueWithin30}`],
  ['Added in the last 30 days', `+${W.addedWithin30}`],
  ['Added in the last 90 days', `+${W.addedWithin90}`],
];

export default function AboutScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle" accessibilityRole="header">
          About
        </ThemedText>
        <ThemedText type="small">
          Exposure Radar ranks the vulnerabilities attackers are known to exploit, so a team knows what to
          patch first. Every score shows its reasons.
        </ThemedText>

        <Block title="How the priority score works">
          {MODEL_ROWS.map(([label, points]) => (
            <View key={label} style={[styles.row, { borderBottomColor: theme.border }]}>
              <ThemedText type="small">{label}</ThemedText>
              <ThemedText type="smallBold">{points}</ThemedText>
            </View>
          ))}
          <ThemedText type="small" themeColor="textSecondary">
            Bands:{' '}
            {BAND_THRESHOLDS.map((t, i) =>
              t.min > 0 ? `${t.band} ≥ ${t.min}` : `${t.band} < ${BAND_THRESHOLDS[i - 1]?.min ?? 0}`,
            ).join(' · ')}
          </ThemedText>
        </Block>

        <Block title="Data sources">
          <ThemedText type="small">
            CISA Known Exploited Vulnerabilities catalog (US Government public domain) and FIRST EPSS scores.
            The web build, and the mobile app when it is offline, use a bundled snapshot from{' '}
            {SNAPSHOT_GENERATED_AT.slice(0, 10)}.
          </ThemedText>
          <ExternalLink href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog">
            <ThemedText type="small" themeColor="accent">
              cisa.gov/known-exploited-vulnerabilities-catalog ↗
            </ThemedText>
          </ExternalLink>
          <ExternalLink href="https://www.first.org/epss/">
            <ThemedText type="small" themeColor="accent">
              first.org/epss ↗
            </ThemedText>
          </ExternalLink>
        </Block>

        <Block title="How it was built">
          <ThemedText type="small">
            Built with Claude Code. The repository contains the context files, skills, subagents and hooks the
            agent worked with, plus a log of the session and the decisions made.
          </ThemedText>
          <ExternalLink href={REPO_URL}>
            <ThemedText type="small" themeColor="accent">
              github.com/matiaskochlowski/exposure-radar ↗
            </ThemedText>
          </ExternalLink>
        </Block>

        <ThemedText type="small" themeColor="textSecondary">
          Demo software. Not a substitute for your own vulnerability management process.
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.block}>
      <ThemedText type="smallBold" accessibilityRole="header">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  block: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
