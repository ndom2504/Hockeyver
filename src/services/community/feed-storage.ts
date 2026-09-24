import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { AppNotification, Comment, Like, Post } from '@/types/social';

const KEY = 'hockeyver-feed';

export type SavedFeed = {
  posts: Post[];
  comments: Comment[];
  likes: Like[];
  notifications: AppNotification[];
};

export async function readFeed(): Promise<SavedFeed | null> {
  try {
    const raw = Platform.OS === 'web' ? localStorage.getItem(KEY) : await readNative();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedFeed;
    if (!Array.isArray(parsed.posts) || !Array.isArray(parsed.comments) || !Array.isArray(parsed.likes)) return null;
    return {
      ...parsed,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
    };
  } catch {
    return null;
  }
}

export async function writeFeed(feed: SavedFeed) {
  const raw = JSON.stringify(feed);
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(KEY, raw);
      return;
    }
    const file = new File(Paths.document, `${KEY}.json`);
    if (!file.exists) file.create();
    file.write(raw);
  } catch {
    // La publication reste visible pour cette session.
  }
}

async function readNative() {
  const file = new File(Paths.document, `${KEY}.json`);
  if (!file.exists) return null;
  return file.text();
}
