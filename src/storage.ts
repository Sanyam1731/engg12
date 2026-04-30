import type { Preference, StoredAuth, User } from './types';

const KEY_USERS = 'cet:users';
const KEY_AUTH = 'cet:auth';
const KEY_SESSION = 'cet:session';
const KEY_PREFS = 'cet:prefs';
const KEY_RECENT = 'cet:recent';

export function loadUsers(): Record<string, User> {
  try {
    return JSON.parse(localStorage.getItem(KEY_USERS) || '{}');
  } catch {
    return {};
  }
}
export function saveUsers(users: Record<string, User>) {
  localStorage.setItem(KEY_USERS, JSON.stringify(users));
}

export function loadAuths(): Record<string, StoredAuth> {
  try {
    return JSON.parse(localStorage.getItem(KEY_AUTH) || '{}');
  } catch {
    return {};
  }
}
export function saveAuths(a: Record<string, StoredAuth>) {
  localStorage.setItem(KEY_AUTH, JSON.stringify(a));
}

export function loadSession(): string | null {
  return localStorage.getItem(KEY_SESSION);
}
export function saveSession(email: string | null) {
  if (email) localStorage.setItem(KEY_SESSION, email);
  else localStorage.removeItem(KEY_SESSION);
}

export function loadPrefs(email: string): Preference[] {
  try {
    const all = JSON.parse(localStorage.getItem(KEY_PREFS) || '{}');
    return all[email] || [];
  } catch {
    return [];
  }
}
export function savePrefs(email: string, prefs: Preference[]) {
  let all: Record<string, Preference[]> = {};
  try {
    all = JSON.parse(localStorage.getItem(KEY_PREFS) || '{}');
  } catch {
    all = {};
  }
  all[email] = prefs;
  localStorage.setItem(KEY_PREFS, JSON.stringify(all));
}

export function loadRecent(email: string): string[] {
  try {
    const all = JSON.parse(localStorage.getItem(KEY_RECENT) || '{}');
    return all[email] || [];
  } catch {
    return [];
  }
}
export function saveRecent(email: string, recent: string[]) {
  let all: Record<string, string[]> = {};
  try {
    all = JSON.parse(localStorage.getItem(KEY_RECENT) || '{}');
  } catch {
    all = {};
  }
  all[email] = recent;
  localStorage.setItem(KEY_RECENT, JSON.stringify(all));
}
