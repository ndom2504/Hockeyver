import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { TERMS_VERSION } from '@/constants/terms';

const KEY = 'hockeyver_terms';

export async function loadTermsAccepted(): Promise<boolean> {
  try {
    const value =
      Platform.OS === 'web'
        ? typeof localStorage === 'undefined'
          ? null
          : localStorage.getItem(KEY)
        : await SecureStore.getItemAsync(KEY);
    return value === TERMS_VERSION;
  } catch {
    return false;
  }
}

export async function saveTermsAccepted() {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, TERMS_VERSION);
    return;
  }
  await SecureStore.setItemAsync(KEY, TERMS_VERSION);
}
