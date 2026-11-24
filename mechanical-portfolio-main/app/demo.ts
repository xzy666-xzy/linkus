export type Lang = 'en' | 'zh' | 'ko';
export type Page =
  | 'home'
  | 'upload'
  | 'result'
  | 'checklist'
  | 'contracts'
  | 'reminders'
  | 'profile';
export type Sample = (typeof sampleIds)[number];
export type Contract = {
  id: string;
  name: string;
  date: string;
  sample: Sample;
};
export type Reminder = {
  id: string;
  title: string;
  date: string;
  done: boolean;
};
export type Profile = { name: string; city: string };

export const defaultSample = 'erica';
export const sampleIds = [defaultSample, 'mapo', 'sinchon'] as const;
export const samples = {
  erica: {
    date: '2026-11-24',
    rent: '₩400,000',
    deposit: '₩3,000,000',
    levels: [0, 1, 0, 1],
  },
  mapo: {
    date: '2026-10-22',
    rent: '₩450,000',
    deposit: '₩5,000,000',
    levels: [0, 1, 0, 1],
  },
  sinchon: {
    date: '2026-10-15',
    rent: '₩520,000',
    deposit: '₩3,000,000',
    levels: [2, 2, 2, 2],
  },
};
export const defaultReminders: Reminder[] = [
  { id: 'rent', title: '', date: '2026-11-05', done: false },
  { id: 'expiry', title: '', date: '2027-02-28', done: false },
];

export const defaults = {
  lang: 'en' as Lang,
  checks: [false, false, false, false, false],
  contracts: [] as Contract[],
  reminders: defaultReminders,
  profile: { name: '', city: '' } as Profile,
  notify: true,
};

export const storageKey = 'linkus.demo.v1';
export const pages: Page[] = [
  'home',
  'upload',
  'result',
  'checklist',
  'contracts',
  'reminders',
  'profile',
];

export function readRoute() {
  const [view, id] = location.hash.slice(1).split('/');
  const page = pages.find((candidate) => candidate === view) ?? 'home';
  return {
    page,
    id:
      page === 'result' || page === 'checklist'
        ? id || defaultSample
        : defaultSample,
  };
}

export function validDate(date: unknown): date is string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return false;
  const value = new Date(date + 'T00:00:00Z');
  return (
    Number.isFinite(value.valueOf()) &&
    value.toISOString().slice(0, 10) === date
  );
}

export function dateLabel(
  date: string,
  lang: Lang,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(lang, { ...options, timeZone: 'UTC' }).format(
    new Date(date + 'T00:00:00Z'),
  );
}

export async function validFile(file: File) {
  const extension = file.name.match(/\.([a-z]+)$/i)?.[1].toLowerCase();
  if (
    !extension ||
    !/^(pdf|jpe?g|png)$/.test(extension) ||
    !file.size ||
    file.size > 10 * 1024 * 1024
  )
    return false;
  const bytes = Array.from(
    new Uint8Array(await file.slice(0, 8).arrayBuffer()),
  );
  const signature =
    extension === 'pdf'
      ? [37, 80, 68, 70, 45]
      : extension === 'png'
        ? [137, 80, 78, 71, 13, 10, 26, 10]
        : [255, 216, 255];
  return signature.every((byte, index) => bytes[index] === byte);
}
