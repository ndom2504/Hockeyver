import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { Team } from '@/services/nhl/nhl.types';

type Props = {
  team: Team;
  size?: number;
};

export function TeamLogo({ team, size = 36 }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <View
        style={[
          styles.mark,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: team.primaryColor },
        ]}
      >
        <AppText style={{ color: team.onPrimary, fontSize: Math.max(9, size * 0.28), fontWeight: '700' }}>
          {team.abbreviation}
        </AppText>
      </View>
    );
  }
  return (
    <Image
      source={{ uri: team.logoUrl }}
      style={{ width: size, height: size }}
      contentFit="contain"
      cachePolicy="memory-disk"
      accessibilityLabel={team.fullName}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
