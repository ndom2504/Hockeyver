import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';

import { StackHeader } from '@/components/navigation/stack-header';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable';
import { TeamLogo } from '@/components/ui/team-logo';
import { colors, radius } from '@/constants/theme';
import { useNhlSnapshot } from '@/hooks/use-nhl';
import { useSessionStore } from '@/store/useSessionStore';
import { useToastStore } from '@/store/useToastStore';
import { fold } from '@/utils/text';

export function FavoriteTeamScreen() {
  const nhl = useNhlSnapshot();
  const favoriteId = useSessionStore((state) => state.user?.favoriteTeamId);
  const setFavoriteTeam = useSessionStore((state) => state.setFavoriteTeam);
  const show = useToastStore((state) => state.show);
  const [query, setQuery] = useState('');
  const teams = useMemo(() => {
    const needle = fold(query.trim());
    return (nhl.data?.teams ?? [])
      .filter((team) => fold(`${team.city} ${team.name} ${team.abbreviation}`).includes(needle))
      .sort((a, b) => a.city.localeCompare(b.city, 'fr'));
  }, [nhl.data?.teams, query]);

  return (
    <View style={styles.screen}>
      <StackHeader title="Équipe favorite" subtitle="Elle personnalise votre fil et vos matchs." />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Les 32 équipes"
        placeholderTextColor={colors.faint}
        style={styles.search}
      />
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const selected = item.id === favoriteId;
          return (
            <PressableOpacity
              style={[styles.row, selected && styles.selected]}
              onPress={() => {
                setFavoriteTeam(item.id)
                  .then(() => {
                    show('Équipe favorite mise à jour');
                    router.back();
                  })
                  .catch(() => show('Équipe non enregistrée'));
              }}
            >
              <TeamLogo team={item} size={36} />
              <View style={styles.copy}>
                <AppText variant="callout">{item.name}</AppText>
                <AppText variant="caption" color={colors.muted}>
                  {item.city}
                </AppText>
              </View>
              {selected ? <Icon name="check" size={18} color={colors.navy} /> : null}
            </PressableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink,
  },
  list: { padding: 16, gap: 8, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 12,
  },
  selected: { borderWidth: 1, borderColor: colors.navy },
  copy: { flex: 1 },
});
