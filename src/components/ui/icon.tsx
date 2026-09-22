import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

import { colors } from '@/constants/theme';

type Glyph = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type IconName =
  | 'home'
  | 'nhl'
  | 'community'
  | 'bell'
  | 'person'
  | 'search'
  | 'heart'
  | 'heartOutline'
  | 'chat'
  | 'share'
  | 'add'
  | 'back'
  | 'close'
  | 'more'
  | 'chevron'
  | 'check'
  | 'flag'
  | 'trash'
  | 'send'
  | 'photo'
  | 'hide';

const GLYPHS: Record<IconName, { idle: Glyph; active?: Glyph }> = {
  home: { idle: 'home-outline', active: 'home' },
  nhl: { idle: 'hockey-sticks' },
  community: { idle: 'forum-outline', active: 'forum' },
  bell: { idle: 'bell-outline', active: 'bell' },
  person: { idle: 'account-outline', active: 'account' },
  search: { idle: 'magnify' },
  heart: { idle: 'heart' },
  heartOutline: { idle: 'heart-outline' },
  chat: { idle: 'comment-outline' },
  share: { idle: 'share-variant-outline' },
  add: { idle: 'plus' },
  back: { idle: 'chevron-left' },
  close: { idle: 'close' },
  more: { idle: 'dots-horizontal' },
  chevron: { idle: 'chevron-right' },
  check: { idle: 'check' },
  flag: { idle: 'flag-outline' },
  trash: { idle: 'trash-can-outline' },
  send: { idle: 'send' },
  photo: { idle: 'image-outline' },
  hide: { idle: 'eye-off-outline' },
};

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  active?: boolean;
};

export function Icon({ name, size = 22, color = colors.ink, active = false }: Props) {
  const glyph = GLYPHS[name];
  return <MaterialCommunityIcons name={active && glyph.active ? glyph.active : glyph.idle} size={size} color={color} />;
}
