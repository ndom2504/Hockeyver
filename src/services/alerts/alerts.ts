import { isRunningInExpoGo } from 'expo';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { AppState, Platform } from 'react-native';

import type { NotificationType } from '@/types/social';

type Tone = 'publication' | 'goal' | 'score' | 'alert';

const SOURCES: Record<Tone, number> = {
  publication: require('../../../assets/sounds/publication.wav'),
  goal: require('../../../assets/sounds/goal.wav'),
  score: require('../../../assets/sounds/score.wav'),
  alert: require('../../../assets/sounds/alert.wav'),
};

const PROFILE: Record<NotificationType, { channelId: string; file: string; tone: Tone }> = {
  reply: { channelId: 'publications', file: 'publication.wav', tone: 'publication' },
  mention: { channelId: 'publications', file: 'publication.wav', tone: 'publication' },
  favorite_team: { channelId: 'publications', file: 'publication.wav', tone: 'publication' },
  goal: { channelId: 'goals', file: 'goal.wav', tone: 'goal' },
  game_result: { channelId: 'scores', file: 'score.wav', tone: 'score' },
  reaction: { channelId: 'alerts', file: 'alert.wav', tone: 'alert' },
  poll: { channelId: 'alerts', file: 'alert.wav', tone: 'alert' },
  game_start: { channelId: 'alerts', file: 'alert.wav', tone: 'alert' },
};

const CHANNELS: { id: string; name: string; sound: string }[] = [
  { id: 'publications', name: 'Publications', sound: 'publication.wav' },
  { id: 'goals', name: 'Buts', sound: 'goal.wav' },
  { id: 'scores', name: 'Scores', sound: 'score.wav' },
  { id: 'alerts', name: 'Autres alertes', sound: 'alert.wav' },
];

type AlertKit = {
  scheduleNotificationAsync: (request: {
    content: {
      title: string;
      body: string;
      sound?: boolean | string;
      color?: string;
      interruptionLevel?: 'active';
      priority?: string;
    };
    trigger:
      | null
      | {
          type: string;
          seconds: number;
          channelId: string;
        };
  }) => Promise<string>;
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
      shouldShowBanner: boolean;
      shouldShowList: boolean;
    }>;
  }) => void;
  getPermissionsAsync: () => Promise<{ granted: boolean }>;
  requestPermissionsAsync: (options?: { ios?: { allowAlert?: boolean; allowBadge?: boolean; allowSound?: boolean } }) => Promise<unknown>;
  setNotificationChannelAsync: (id: string, channel: Record<string, unknown>) => Promise<unknown>;
  AndroidImportance: { MAX: number };
  AndroidNotificationPriority: { MAX: string };
  AndroidNotificationVisibility: { PUBLIC: number };
  SchedulableTriggerInputTypes: { TIME_INTERVAL: string };
};

const players = new Map<Tone, AudioPlayer>();
let prepared = false;
let notifications: AlertKit | null | undefined;

async function loadLocalNotifications(): Promise<AlertKit> {
  const [scheduler, handler, permissions, channels, types, channelTypes] = await Promise.all([
    import('expo-notifications/build/scheduleNotificationAsync'),
    import('expo-notifications/build/NotificationsHandler'),
    import('expo-notifications/build/NotificationPermissions'),
    import('expo-notifications/build/setNotificationChannelAsync'),
    import('expo-notifications/build/Notifications.types'),
    import('expo-notifications/build/NotificationChannelManager.types'),
  ]);
  return {
    scheduleNotificationAsync: scheduler.scheduleNotificationAsync,
    setNotificationHandler: handler.setNotificationHandler,
    getPermissionsAsync: permissions.getPermissionsAsync,
    requestPermissionsAsync: permissions.requestPermissionsAsync,
    setNotificationChannelAsync: channels.setNotificationChannelAsync,
    AndroidImportance: channelTypes.AndroidImportance,
    AndroidNotificationPriority: types.AndroidNotificationPriority,
    AndroidNotificationVisibility: channelTypes.AndroidNotificationVisibility,
    SchedulableTriggerInputTypes: types.SchedulableTriggerInputTypes,
  } as unknown as AlertKit;
}

async function loadNotifications() {
  if (notifications !== undefined) return notifications;
  try {
    const kit =
      Platform.OS === 'android' && isRunningInExpoGo()
        ? await loadLocalNotifications()
        : ((await import('expo-notifications')) as unknown as AlertKit);
    kit.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notifications = kit;
    return kit;
  } catch {
    notifications = null;
    return null;
  }
}

export async function prepareAlerts() {
  if (prepared) return;
  try {
    if (Platform.OS !== 'web') {
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
    }
    const module = await loadNotifications();
    if (!module) {
      prepared = true;
      return;
    }
    const current = await module.getPermissionsAsync();
    if (!current.granted) {
      await module.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: false, allowSound: true },
      });
    }
    if (Platform.OS === 'android') {
      await Promise.all(
        CHANNELS.map((channel) =>
          module.setNotificationChannelAsync(channel.id, {
            name: channel.name,
            importance: module.AndroidImportance.MAX,
            sound: isRunningInExpoGo() ? null : channel.sound,
            vibrationPattern: [0, 180, 80, 180],
            lockscreenVisibility: module.AndroidNotificationVisibility.PUBLIC,
          }),
        ),
      );
    }
    prepared = true;
  } catch {
    prepared = false;
  }
}

async function playTone(tone: Tone) {
  let player = players.get(tone);
  if (!player) {
    player = createAudioPlayer(SOURCES[tone]);
    players.set(tone, player);
  }
  try {
    await player.seekTo(0);
  } catch {
    // Le premier chargement démarre déjà au début.
  }
  player.play();
}

async function presentBanner(module: AlertKit, type: NotificationType, title: string, body: string) {
  const profile = PROFILE[type];
  const background = AppState.currentState !== 'active';
  await module.scheduleNotificationAsync({
    content: {
      title,
      body,
      color: '#0A2F6B',
      interruptionLevel: 'active',
      priority: module.AndroidNotificationPriority.MAX,
      sound: background ? (isRunningInExpoGo() ? true : profile.file) : false,
    },
    trigger: background
      ? {
          type: module.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          channelId: profile.channelId,
        }
      : null,
  });
}

export async function ring(type: NotificationType, title: string, body: string) {
  const profile = PROFILE[type];
  await prepareAlerts();
  const module = await loadNotifications();
  const background = AppState.currentState !== 'active';
  let presented = false;
  if (module && Platform.OS !== 'web') {
    try {
      await presentBanner(module, type, title, body);
      presented = true;
    } catch {
      presented = false;
    }
  }
  if (!presented || !background) await playTone(profile.tone);
}
