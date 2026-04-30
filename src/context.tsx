import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { College, Preference, User } from './types';
import { decompress, mergeAll } from './utils';
import { R1_B64, R2_B64, R3_B64, R4_B64 } from './data';
import {
  loadAuths,
  loadPrefs,
  loadRecent,
  loadSession,
  loadUsers,
  saveAuths,
  savePrefs,
  saveRecent,
  saveSession,
  saveUsers,
} from './storage';

type AppCtx = {
  user: User | null;
  loading: boolean;
  loadError: string | null;
  colleges: College[];
  prefs: Preference[];
  login: (email: string, password: string) => string | null;
  signup: (data: User & { password: string }) => string | null;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
  addPref: (p: Omit<Preference, 'id' | 'addedAt'>) => boolean;
  removePref: (id: string) => void;
  movePref: (id: string, dir: -1 | 1) => void;
  hasPref: (collegeCode: string, branchCode: string) => boolean;
  compareList: string[];
  toggleCompare: (cc: string) => boolean;
  clearCompare: () => void;
  recentlyViewed: string[];
  trackView: (cc: string) => void;
};

const COMPARE_LIMIT = 3;
const RECENT_LIMIT = 10;

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Preference[]>([]);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  useEffect(() => {
    const session = loadSession();
    if (session) {
      const users = loadUsers();
      if (users[session]) {
        setUser(users[session]);
        setPrefs(loadPrefs(session));
        setRecentlyViewed(loadRecent(session));
      } else {
        saveSession(null);
      }
    }
    const t = setTimeout(() => {
      try {
        const r1 = decompress(R1_B64);
        const r2 = decompress(R2_B64);
        const r3 = decompress(R3_B64);
        const r4 = decompress(R4_B64);
        setColleges(mergeAll(r1, r2, r3, r4));
        setLoading(false);
      } catch (e) {
        setLoadError((e as Error).message);
        setLoading(false);
      }
    }, 80);
    return () => clearTimeout(t);
  }, []);

  const login = useCallback((email: string, password: string): string | null => {
    const e = email.trim().toLowerCase();
    const auths = loadAuths();
    const users = loadUsers();
    if (!auths[e]) return 'Account not found';
    if (auths[e].password !== password) return 'Incorrect password';
    setUser(users[e]);
    saveSession(e);
    setPrefs(loadPrefs(e));
    setRecentlyViewed(loadRecent(e));
    return null;
  }, []);

  const signup = useCallback((data: User & { password: string }): string | null => {
    const e = data.email.trim().toLowerCase();
    if (!e || !data.password) return 'Email and password required';
    const auths = loadAuths();
    if (auths[e]) return 'Account already exists';
    const newUser: User = { ...data, email: e, createdAt: Date.now() };
    delete (newUser as Partial<User & { password: string }>).password;
    const users = loadUsers();
    users[e] = newUser;
    auths[e] = { email: e, password: data.password };
    saveUsers(users);
    saveAuths(auths);
    saveSession(e);
    setUser(newUser);
    setPrefs([]);
    setRecentlyViewed([]);
    savePrefs(e, []);
    saveRecent(e, []);
    return null;
  }, []);

  const logout = useCallback(() => {
    saveSession(null);
    setUser(null);
    setPrefs([]);
    setRecentlyViewed([]);
    setCompareList([]);
  }, []);

  const updateUser = useCallback(
    (patch: Partial<User>) => {
      if (!user) return;
      const updated = { ...user, ...patch };
      const users = loadUsers();
      users[user.email] = updated;
      saveUsers(users);
      setUser(updated);
    },
    [user]
  );

  const addPref = useCallback(
    (p: Omit<Preference, 'id' | 'addedAt'>) => {
      if (!user) return false;
      if (prefs.some(x => x.collegeCode === p.collegeCode && x.branchCode === p.branchCode))
        return false;
      const newPref: Preference = {
        ...p,
        id: `${p.collegeCode}-${p.branchCode}-${Date.now()}`,
        addedAt: Date.now(),
      };
      const next = [...prefs, newPref];
      setPrefs(next);
      savePrefs(user.email, next);
      return true;
    },
    [user, prefs]
  );

  const removePref = useCallback(
    (id: string) => {
      if (!user) return;
      const next = prefs.filter(p => p.id !== id);
      setPrefs(next);
      savePrefs(user.email, next);
    },
    [user, prefs]
  );

  const movePref = useCallback(
    (id: string, dir: -1 | 1) => {
      if (!user) return;
      const idx = prefs.findIndex(p => p.id === id);
      if (idx < 0) return;
      const target = idx + dir;
      if (target < 0 || target >= prefs.length) return;
      const next = prefs.slice();
      [next[idx], next[target]] = [next[target], next[idx]];
      setPrefs(next);
      savePrefs(user.email, next);
    },
    [user, prefs]
  );

  const hasPref = useCallback(
    (collegeCode: string, branchCode: string) =>
      prefs.some(p => p.collegeCode === collegeCode && p.branchCode === branchCode),
    [prefs]
  );

  const toggleCompare = useCallback((cc: string): boolean => {
    let added = false;
    setCompareList(prev => {
      if (prev.includes(cc)) return prev.filter(x => x !== cc);
      if (prev.length >= COMPARE_LIMIT) return prev;
      added = true;
      return [...prev, cc];
    });
    return added;
  }, []);

  const clearCompare = useCallback(() => setCompareList([]), []);

  const trackView = useCallback(
    (cc: string) => {
      if (!user) return;
      setRecentlyViewed(prev => {
        const next = [cc, ...prev.filter(x => x !== cc)].slice(0, RECENT_LIMIT);
        saveRecent(user.email, next);
        return next;
      });
    },
    [user]
  );

  const value: AppCtx = useMemo(
    () => ({
      user,
      loading,
      loadError,
      colleges,
      prefs,
      login,
      signup,
      logout,
      updateUser,
      addPref,
      removePref,
      movePref,
      hasPref,
      compareList,
      toggleCompare,
      clearCompare,
      recentlyViewed,
      trackView,
    }),
    [
      user,
      loading,
      loadError,
      colleges,
      prefs,
      login,
      signup,
      logout,
      updateUser,
      addPref,
      removePref,
      movePref,
      hasPref,
      compareList,
      toggleCompare,
      clearCompare,
      recentlyViewed,
      trackView,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}
