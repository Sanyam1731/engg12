import pako from 'pako';
import type { College, RawCollege, RoundNum } from './types';

export function decompress(b64: string): RawCollege[] {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return JSON.parse(pako.inflate(bytes, { to: 'string' }));
}

export function getCity(cn: string): string {
  const p = cn.split(',');
  return p.length > 1 ? p[p.length - 1].trim() : '';
}

export function catCls(cat: string): string {
  if (!cat) return 'b-other';
  const u = cat.toUpperCase();
  if (u.startsWith('AI (')) return 'b-ai';
  if (u.includes('DEF')) return 'b-def';
  if (u.includes('PWD')) return 'b-pwd';
  if (u === 'EWS') return 'b-ews';
  if (u.includes('OPEN')) return 'b-open';
  if (u.includes('SC') || u.includes('ST')) return 'b-sc';
  if (u.includes('OBC') || u.includes('SEBC') || u.includes('NT') || u.includes('VJ'))
    return 'b-obc';
  return 'b-other';
}

export const sh = (n: string) =>
  n
    .replace('Computer Science and Engineering', 'CS Engg')
    .replace('Electronics and Telecommunication Engg', 'E&TC Engg')
    .replace('Electronics and Telecommunication', 'E&TC')
    .replace('Information Technology', 'IT')
    .replace('Artificial Intelligence', 'AI')
    .replace('Mechanical Engineering', 'Mech. Engg')
    .replace('Electrical Engineering', 'Elect. Engg')
    .replace('Civil Engineering', 'Civil Engg');

export function mergeAll(
  r1: RawCollege[],
  r2: RawCollege[],
  r3: RawCollege[],
  r4: RawCollege[]
): College[] {
  const map: Record<string, College> = {};
  const addRound = (data: RawCollege[], rKey: 'r1cuts' | 'r2cuts' | 'r3cuts' | 'r4cuts') => {
    data.forEach(col => {
      if (!map[col.cc]) map[col.cc] = { cc: col.cc, cn: col.cn, branches: {} };
      Object.entries(col.branches).forEach(([rc, b]) => {
        if (!map[col.cc].branches[rc])
          map[col.cc].branches[rc] = {
            rn: b.rn,
            r1cuts: [],
            r2cuts: [],
            r3cuts: [],
            r4cuts: [],
          };
        map[col.cc].branches[rc][rKey] = b.cuts;
      });
    });
  };
  addRound(r1, 'r1cuts');
  addRound(r2, 'r2cuts');
  addRound(r3, 'r3cuts');
  addRound(r4, 'r4cuts');
  return Object.values(map).sort((a, b) => a.cn.localeCompare(b.cn));
}

export function totalCutsForRound(
  branches: { r1cuts: unknown[]; r2cuts: unknown[]; r3cuts: unknown[]; r4cuts: unknown[] }[],
  r: RoundNum
): number {
  return branches.reduce((s, b) => s + (b[`r${r}cuts` as const] as unknown[]).length, 0);
}

export const CATEGORIES = [
  'OPEN',
  'SC',
  'ST',
  'OBC',
  'SEBC',
  'EWS',
  'VJ',
  'NT-B',
  'NT-C',
  'NT-D',
  'PWD',
  'DEF',
] as const;
