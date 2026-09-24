import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { StackHeader } from '@/components/navigation/stack-header';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable';
import { ApiError } from '@/api/client';
import { colors, radius } from '@/constants/theme';
import { CATEGORIES } from '@/constants/categories';
import { useNhlSnapshot } from '@/hooks/use-nhl';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useToastStore } from '@/store/useToastStore';
import type { PostCategory } from '@/types/social';
import { tap } from '@/utils/haptics';
import { fold } from '@/utils/text';

export function ComposeScreen() {
  const nhl = useNhlSnapshot();
  const createPost = useCommunityStore((state) => state.createPost);
  const show = useToastStore((state) => state.show);
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<PostCategory | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [picker, setPicker] = useState<'team' | 'player' | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [query, setQuery] = useState('');

  const team = nhl.data?.teams.find((item) => item.id === teamId);
  const player = nhl.data?.players.find((item) => item.id === playerId);
  const canPublish = body.trim().length >= 3 && category !== null;

  const choices = useMemo(() => {
    const needle = fold(query.trim());
    if (picker === 'team') {
      return (nhl.data?.teams ?? []).filter((item) => fold(`${item.city} ${item.name}`).includes(needle));
    }
    return (nhl.data?.players ?? [])
      .filter((item) => (teamId ? item.teamId === teamId : true))
      .filter((item) => fold(`${item.firstName} ${item.lastName}`).includes(needle));
  }, [picker, query, nhl.data, teamId]);

  const publish = async () => {
    if (!canPublish || !category || publishing) return;
    setPublishing(true);
    try {
      await createPost({
        body,
        category,
        imageUrl: imageUrl ?? undefined,
        teamId: teamId ?? undefined,
        playerId: playerId ?? undefined,
        extraTags: [team?.tag, player?.tag].filter((tag): tag is string => Boolean(tag)),
      });
      tap();
      show('Publication publiée');
      router.dismissTo('/community');
    } catch (error) {
      show(error instanceof ApiError ? error.message : 'La publication est restée sur cet appareil.');
    } finally {
      setPublishing(false);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      show('Accès aux photos refusé');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) setImageUrl(result.assets[0].uri);
  };

  return (
    <View style={styles.screen}>
      <StackHeader
        title={picker === 'team' ? 'Équipe' : picker === 'player' ? 'Joueur' : 'Créer une publication'}
        right={
          picker ? (
            <PressableOpacity onPress={() => setPicker(null)}>
              <AppText variant="footnote" color={colors.navy}>
                Fermer
              </AppText>
            </PressableOpacity>
          ) : (
            <PressableOpacity
              disabled={!canPublish || publishing}
              onPress={() => void publish()}
              style={!canPublish || publishing ? styles.disabled : undefined}
            >
              <AppText variant="callout" color={colors.navy}>
                {publishing ? 'Publication…' : 'Publier'}
              </AppText>
            </PressableOpacity>
          )
        }
      />
      {picker ? (
        <View style={styles.flex}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={picker === 'team' ? 'Filtrer les équipes' : 'Filtrer les joueurs'}
            placeholderTextColor={colors.faint}
            style={styles.search}
          />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.choices}>
            <PressableOpacity
              onPress={() => {
                if (picker === 'team') setTeamId(null);
                else setPlayerId(null);
                setPicker(null);
              }}
            >
              <AppText variant="body" color={colors.muted}>
                Aucun
              </AppText>
            </PressableOpacity>
            {choices.map((item) => (
              <PressableOpacity
                key={item.id}
                onPress={() => {
                  if (picker === 'team') {
                    setTeamId(item.id);
                    if (player && player.teamId !== item.id) setPlayerId(null);
                  } else {
                    setPlayerId(item.id);
                  }
                  setPicker(null);
                  setQuery('');
                }}
              >
                <AppText variant="body">
                  {'firstName' in item ? `${item.firstName} ${item.lastName}` : item.fullName}
                </AppText>
              </PressableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Qu’est-ce qui se passe dans la NHL ?"
            placeholderTextColor={colors.faint}
            multiline
            style={styles.body}
            maxLength={600}
          />
          {imageUrl ? (
            <View>
              <Image source={{ uri: imageUrl }} style={styles.preview} contentFit="cover" />
              <PressableOpacity onPress={() => setImageUrl(null)} style={styles.remove}>
                <AppText variant="caption" color={colors.white}>
                  Retirer
                </AppText>
              </PressableOpacity>
            </View>
          ) : null}
          <PressableOpacity style={styles.photo} onPress={() => void pickImage()}>
            <Icon name="photo" size={18} color={colors.navy} />
            <AppText variant="footnote" color={colors.navy}>
              Photo facultative
            </AppText>
          </PressableOpacity>
          <AppText variant="label" color={colors.navy}>
            Catégorie
          </AppText>
          <View style={styles.pills}>
            {CATEGORIES.map((item) => {
              const selected = category === item.id;
              return (
                <PressableOpacity
                  key={item.id}
                  onPress={() => setCategory(item.id)}
                  style={[styles.pill, selected && styles.pillOn]}
                >
                  <AppText variant="footnote" color={selected ? colors.white : colors.ink}>
                    {item.label}
                  </AppText>
                </PressableOpacity>
              );
            })}
          </View>
          <Field label="Équipe concernée" value={team?.fullName ?? 'Facultatif'} onPress={() => setPicker('team')} />
          <Field
            label="Joueur concerné"
            value={player ? `${player.firstName} ${player.lastName}` : 'Facultatif'}
            onPress={() => setPicker('player')}
          />
        </ScrollView>
      )}
    </View>
  );
}

function Field({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <PressableOpacity onPress={onPress} style={styles.field}>
      <View>
        <AppText variant="caption" color={colors.muted}>
          {label}
        </AppText>
        <AppText variant="body">{value}</AppText>
      </View>
      <Icon name="chevron" size={16} color={colors.faint} />
    </PressableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  form: { padding: 16, gap: 14, paddingBottom: 40 },
  body: {
    minHeight: 140,
    fontSize: 18,
    lineHeight: 26,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  preview: { width: '100%', height: 180, borderRadius: radius.md },
  remove: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: colors.navyDeep,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  photo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  pillOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  field: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  search: {
    marginHorizontal: 16,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 16,
  },
  choices: { padding: 16, gap: 16 },
  disabled: { opacity: 0.35 },
});
