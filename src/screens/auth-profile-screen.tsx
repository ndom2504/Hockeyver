import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ApiError } from '@/api/client';
import { AuthShell } from '@/components/auth/auth-shell';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PressableOpacity } from '@/components/ui/pressable';
import { TeamLogo } from '@/components/ui/team-logo';
import { colors, radius } from '@/constants/theme';
import { useNhlSnapshot } from '@/hooks/use-nhl';
import { useSessionStore } from '@/store/useSessionStore';
import { fold } from '@/utils/text';

export function AuthProfileScreen() {
  const nhl = useNhlSnapshot();
  const completeProfile = useSessionStore((state) => state.completeProfile);
  const sessionUser = useSessionStore((state) => state.user);
  const [firstName, setFirstName] = useState(sessionUser?.firstName ?? '');
  const [lastName, setLastName] = useState(sessionUser?.lastName ?? '');
  const [username, setUsername] = useState('');
  const [teamId, setTeamId] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const teams = useMemo(() => {
    const needle = fold(query.trim());
    return (nhl.data?.teams ?? [])
      .filter((team) => !needle || fold(`${team.city} ${team.name} ${team.abbreviation}`).includes(needle))
      .sort((a, b) => a.city.localeCompare(b.city, 'fr'));
  }, [nhl.data?.teams, query]);

  const submit = async () => {
    setError('');
    setPending(true);
    try {
      await completeProfile({ firstName, lastName, username, favoriteTeamId: teamId });
      router.replace('/');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Le profil n’a pas pu être enregistré.');
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell title="Votre profil" subtitle="Un pseudo et une équipe favorite, puis vous entrez dans la communauté.">
      <Field label="Prénom" value={firstName} onChangeText={setFirstName} placeholder="Léa" />
      <Field label="Nom" value={lastName} onChangeText={setLastName} placeholder="Moreau" />
      <Field
        label="Pseudo"
        value={username}
        onChangeText={(value) => setUsername(value.replace(/\s/g, '').toLowerCase())}
        placeholder="lea.moreau"
        autoCapitalize="none"
      />
      <View style={styles.teams}>
        <AppText variant="footnote" color={colors.muted}>
          Équipe favorite
        </AppText>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher une équipe"
          placeholderTextColor={colors.faint}
          style={styles.search}
        />
        {teams.slice(0, 8).map((team) => {
          const selected = team.id === teamId;
          return (
            <PressableOpacity
              key={team.id}
              onPress={() => setTeamId(team.id)}
              style={[styles.team, selected && styles.teamOn]}
            >
              <TeamLogo team={team} size={28} />
              <AppText variant="callout" style={styles.teamName}>
                {team.fullName}
              </AppText>
            </PressableOpacity>
          );
        })}
      </View>
      {error ? (
        <AppText variant="footnote" color={colors.red}>
          {error}
        </AppText>
      ) : null}
      <Button
        label={pending ? 'Enregistrement…' : 'Entrer dans HOCKEYVER'}
        onPress={submit}
        disabled={pending || firstName.trim().length < 1 || username.trim().length < 3 || !teamId}
      />
    </AuthShell>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'words',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'words';
}) {
  return (
    <View style={styles.fieldWrap}>
      <AppText variant="footnote" color={colors.muted}>
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: { gap: 6 },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink,
  },
  teams: { gap: 8 },
  search: {
    minHeight: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink,
  },
  team: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  teamOn: { borderColor: colors.navy, backgroundColor: colors.ice },
  teamName: { flex: 1 },
});
