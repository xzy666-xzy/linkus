import { useEffect, useRef, useState } from 'react';
import { defaults, sampleIds, storageKey, validDate } from './demo';
import type { Contract, Reminder } from './demo';

type DemoData = typeof defaults;

function readData(): DemoData {
  const stored = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
  if (!stored) return defaults;
  return {
    lang: stored.lang === 'ko' || stored.lang === 'zh' ? stored.lang : 'en',
    checks: Array.isArray(stored.checks)
      ? defaults.checks.map((_, index) => stored.checks[index] === true)
      : defaults.checks,
    contracts: Array.isArray(stored.contracts)
      ? stored.contracts.filter(
          (item: Contract) =>
            item &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            sampleIds.includes(item.sample) &&
            validDate(item.date),
        )
      : defaults.contracts,
    reminders: Array.isArray(stored.reminders)
      ? stored.reminders.filter(
          (item: Reminder) =>
            item &&
            typeof item.id === 'string' &&
            typeof item.title === 'string' &&
            typeof item.done === 'boolean' &&
            validDate(item.date),
        )
      : defaults.reminders,
    profile:
      typeof stored.profile?.name === 'string' &&
      typeof stored.profile.city === 'string'
        ? { name: stored.profile.name, city: stored.profile.city }
        : defaults.profile,
    notify: stored.notify !== false,
  };
}

export function useDemoStorage() {
  const [data, setData] = useState(defaults);
  const [storageError, setStorageError] = useState(false);
  const current = useRef(data);
  const hasUnsavedChanges = useRef(false);

  useEffect(() => {
    function sync() {
      if (hasUnsavedChanges.current) return;
      try {
        current.current = readData();
        setData(current.current);
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
    }
    function onStorage(event: StorageEvent) {
      if (event.key === storageKey || event.key === null) sync();
    }
    sync();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function update(change: (previous: DemoData) => DemoData) {
    let previous = current.current;
    if (!hasUnsavedChanges.current) {
      try {
        previous = readData();
      } catch {
        // Work from the in-memory state if the stored value cannot be read.
      }
    }
    const next = change(previous);
    current.current = next;
    setData(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      hasUnsavedChanges.current = false;
      setStorageError(false);
    } catch {
      hasUnsavedChanges.current = true;
      setStorageError(true);
    }
  }

  return { data, update, storageError };
}
