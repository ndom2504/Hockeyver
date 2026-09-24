import { ScrollView, StyleSheet, View } from 'react-native';

import { StackHeader } from '@/components/navigation/stack-header';
import { AppText } from '@/components/ui/app-text';
import { SUPPORT_EMAIL } from '@/constants/store';
import { colors, radius } from '@/constants/theme';

const SECTIONS = [
  {
    title: 'Compte',
    body: 'La création de compte se fait avec un numéro de téléphone et un code à usage unique, ou avec Sign in with Apple sur iPhone. Le compte se supprime dans Profil, avec Supprimer mon compte. La suppression efface le numéro, l’identifiant Apple, le nom, le pseudo, l’équipe favorite et la session. Elle est définitive.',
  },
  {
    title: 'Données utilisées',
    body: 'Numéro de téléphone ou identifiant Apple, prénom, nom, pseudo, équipe favorite et biographie. Apple ne transmet le nom qu’à la première connexion. Les publications, commentaires et réactions sont enregistrés avec le compte. Aucune donnée n’est vendue et l’app ne suit pas l’utilisateur pour de la publicité.',
  },
  {
    title: 'Photos',
    body: 'L’accès aux photos sert uniquement à illustrer une publication, si la personne le choisit. Le portrait cartoon est généré à partir du pseudo : deux comptes différents n’ont pas la même image.',
  },
  {
    title: 'App Store',
    body: 'Catégorie : Sports. Classification d’âge : 12+, à cause des contenus publiés par les fans. Chiffrement : standard, exemption d’exportation. Politique de confidentialité : cet écran. Suppression de compte : dans l’app, Profil. Contact : ' + SUPPORT_EMAIL + '.',
  },
  {
    title: 'Play Store',
    body: 'Sécurité des données : numéro de téléphone et infos de profil, collectés pour le compte, non partagés, non utilisés pour la pub. Suppression de compte : dans l’app. Autorisation photos : facultative, pour une publication. Même contact de support.',
  },
];

export function LegalScreen() {
  return (
    <View style={styles.screen}>
      <StackHeader title="Confidentialité" subtitle="Ce que les stores doivent savoir." />
      <ScrollView contentContainerStyle={styles.list}>
        {SECTIONS.map((section) => (
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
