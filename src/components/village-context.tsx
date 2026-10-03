'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ScheduleEventDto } from '@/lib/data';

export type SchedulePayload = {
  village: string;
  year: number;
  years: number[];
  events: ScheduleEventDto[];
  upcoming: ScheduleEventDto[];
  today: string;
};

type Ctx = {
  villageId: string;
  setVillageId: (id: string) => void;
  data: SchedulePayload;
  loading: boolean;
};

const VillageCtx = createContext<Ctx | null>(null);

export function useVillage(): Ctx {
  const ctx = useContext(VillageCtx);
  if (!ctx) throw new Error('useVillage mora biti znotraj <VillageProvider>');
  return ctx;
}

export function VillageProvider({
  initial,
  children,
}: {
  initial: SchedulePayload;
  children: React.ReactNode;
}) {
  const [villageId, setVillageId] = useState(initial.village);
  const [data, setData] = useState<SchedulePayload>(initial);
  const [loading, setLoading] = useState(false);
  const cache = useRef(new Map<string, SchedulePayload>([[initial.village, initial]]));

  useEffect(() => {
    if (villageId === data.village) return;
    const cached = cache.current.get(villageId);
    if (cached) {
      setData(cached);
      return;
    }
    let active = true;
    setLoading(true);
    fetch(`/api/schedule?kraj=${encodeURIComponent(villageId)}`)
      .then((r) => r.json())
      .then((d: SchedulePayload) => {
        if (!active) return;
        cache.current.set(villageId, d);
        setData(d);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [villageId, data.village]);

  /* kraj si zapomnimo med obiski */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('odvoz.kraj');
      if (saved && saved !== initial.village) setVillageId(saved);
    } catch {
      /* brez shrambe */
    }
  }, [initial.village]);

  useEffect(() => {
    try {
      localStorage.setItem('odvoz.kraj', villageId);
    } catch {
      /* brez shrambe */
    }
  }, [villageId]);

  const value = useMemo(() => ({ villageId, setVillageId, data, loading }), [villageId, data, loading]);
  return <VillageCtx.Provider value={value}>{children}</VillageCtx.Provider>;
}
