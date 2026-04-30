export type Cut = {
  cat: string;
  r: number | null;
  p: number | null;
  src: 'CET' | 'AI' | string;
};

export type Branch = {
  rn: string;
  r1cuts: Cut[];
  r2cuts: Cut[];
  r3cuts: Cut[];
  r4cuts: Cut[];
};

export type College = {
  cc: string;
  cn: string;
  branches: Record<string, Branch>;
};

export type RawCollege = {
  cc: string;
  cn: string;
  branches: Record<string, { rn: string; cuts: Cut[] }>;
};

export type RoundKey = 'r1cuts' | 'r2cuts' | 'r3cuts' | 'r4cuts';
export type RoundNum = 1 | 2 | 3 | 4;

export type Preference = {
  id: string;
  collegeCode: string;
  collegeName: string;
  branchCode: string;
  branchName: string;
  addedAt: number;
  note?: string;
};

export type User = {
  email: string;
  name: string;
  mobile?: string;
  category?: string;
  percentile?: number;
  rank?: number;
  dreamBranches?: string[];
  city?: string;
  createdAt: number;
};

export type StoredAuth = {
  email: string;
  password: string;
};
