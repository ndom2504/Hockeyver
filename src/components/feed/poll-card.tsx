import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PressableOpacity } from '@/components/ui/pressable';
import { colors, radius, shadow } from '@/constants/theme';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useToastStore } from '@/store/useToastStore';
import type { Poll } from '@/types/social';
import { tap } from '@/utils/haptics';
import { formatNumber } from '@/utils/text';

type Props = {
  poll: Poll;
  variant?: 'hero' | 'card';
};

export function PollCard({ poll, variant = 'card' }: Props) {
  const selected = useCommunityStore((state) => state.pollVotes[poll.id]);
  const vote = useCommunityStore((state) => state.votePoll);
  const show = useToastStore((state) => state.show);
  const hero = variant === 'hero';
  const total = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const revealed = Boolean(selected);

  const onVote = (optionId: string) => {
    if (revealed) return;
    const accepted = vote(poll.id, optionId);
    if (!accepted) return;
    tap();
    show('Vote enregistré');
  };

  return (
    <View style={[styles.card, hero && styles.hero]}>
      <View style={styles.kicker}>
        <View style={[styles.dot, hero && styles.dotHero]} />
        <AppText variant="label" color={hero ? '#D5E4F6' : colors.navy}>
          {poll.id === 'qotd' ? 'Question du jour' : 'Sondage'}
        </AppText>
      </View>
      <AppText variant="title3" color={hero ? colors.white : colors.ink}>
        {poll.question}
      </AppText>
      <View style={styles.options}>
        {poll.options.map((option) => {
          const active = selected === option.id;
          const ratio = total === 0 ? 0 : option.votes / total;
          return (
            <PressableOpacity
              key={option.id}
              accessibilityRole="button"
              disabled={revealed}
              onPress={() => onVote(option.id)}
              style={[
                styles.option,
                hero && styles.optionHero,
                active && (hero ? styles.optionHeroActive : styles.optionActive),
              ]}
            >
              {revealed ? (
                <View
                  style={[
                    styles.fill,
                    { width: `${Math.max(ratio * 100, 2)}%` },
                    hero ? styles.fillHero : styles.fillCard,
                    active && styles.fillActive,
                  ]}
                />
              ) : null}
              <View style={styles.optionRow}>
                <AppText
                  variant="callout"
                  color={active ? (hero ? colors.navy : colors.white) : hero ? colors.white : colors.ink}
                  style={styles.flex}
                >
                  {option.label}
                </AppText>
                {revealed ? (
                  <AppText variant="footnote" color={active ? (hero ? colors.navy : colors.white) : hero ? '#D5E4F6' : colors.muted}>
                    {Math.round(ratio * 100)} %
                  </AppText>
                ) : null}
              </View>
            </PressableOpacity>
          );
        })}
      </View>
      {revealed ? (
        <AppText variant="caption" color={hero ? '#D5E4F6' : colors.muted}>
          {formatNumber(total)} participants
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 18,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    ...shadow.card,
  },
  hero: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.red,
  },
  dotHero: {
    backgroundColor: colors.red,
  },
  options: {
    gap: 8,
  },
  option: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  optionHero: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  optionActive: {
    backgroundColor: colors.navy,
  },
  optionHeroActive: {
    backgroundColor: colors.white,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  flex: { flex: 1 },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  fillCard: {
    backgroundColor: colors.ice,
  },
  fillHero: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  fillActive: {
    backgroundColor: 'transparent',
  },
});
