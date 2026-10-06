import { ScrollView, StyleSheet, View } from 'react-native';

import { StackHeader } from '@/components/navigation/stack-header';
import { AppText } from '@/components/ui/app-text';
import { TERMS_SECTIONS } from '@/constants/terms';
import { colors, radius } from '@/constants/theme';

export function TermsScreen() {
  return (
    <View style={styles.screen}>
      <StackHeader title="Conditions d’utilisation" subtitle="Règles de la communauté HOCKEYVER." />
      <ScrollView contentContainerStyle={styles.list}>
        <AppText variant="footnote" color={colors.muted}>
          Dernière mise à jour : 6 octobre 2026. Ces conditions constituent le contrat d’utilisation (EULA) de HOCKEYVER.
        </AppText>
        {TERMS_SECTIONS.map((section) => (
          <View key={section.title} style={styles.card}>
            <AppText variant="callout">{section.title}</AppText>
            <AppText variant="body" color={colors.muted}>
              {section.body}
            </AppText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    gap: 8,
  },
});
