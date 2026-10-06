import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const KEY = 'hockeyver-moderation';

export type SavedModeration = {
  blockedUserIds: string[];
  hiddenPostIds: string[];
};

export async function readModeration(): Promise<SavedModeration> {
  try {
    const raw = Platform.OS === 'web' ? localStorage.getItem(KEY) : await readNative();
    if (!raw) return { blockedUserIds: [], hiddenPostIds: [] };
    const parsed = JSON.parse(raw) as Partial<SavedModeration>;
    return {
      blockedUserIds: Array.isArray(parsed.blockedUserIds) ? parsed.blockedUserIds.map(String) : [],
      hiddenPostIds: Array.isArray(parsed.hiddenPostIds) ? parsed.hiddenPostIds.map(String) : [],
    };
  } catch {
    return { blockedUserIds: [], hiddenPostIds: [] };
  }
}

export async function writeModeration(data: SavedModeration) {
  const raw = JSON.stringify({
    blockedUserIds: data.blockedUserIds.slice(0, 500),
    hiddenPostIds: data.hiddenPostIds.slice(0, 1000),
  });
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(KEY, raw);
      return;
    }
    const file = new File(Paths.document, `${KEY}.json`);
    if (!file.exists) file.create();
    file.write(raw);
  } catch {
    // Le blocage reste actif pour la session en cours.
  }
}

async function readNative() {
  const file = new File(Paths.document, `${KEY}.json`);
  if (!file.exists) return null;
  return file.text();
}
