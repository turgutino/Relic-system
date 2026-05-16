import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'relic-compare-selection';

export type CompareStub = {
  id: string;
  name: string;
  image_url: string;
};

type CompareSelectionContextValue = {
  selected: CompareStub[];
  toggle: (stub: CompareStub) => void;
  removeId: (id: string) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  slotsRemaining: number;
  canCompare: boolean;
};

function loadStored(): CompareStub[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
      .filter((x) => typeof x.id === 'string' && x.id.trim())
      .slice(0, 3)
      .map((x) => ({
        id: String(x.id),
        name: typeof x.name === 'string' ? x.name : '',
        image_url: typeof x.image_url === 'string' ? x.image_url : '',
      }));
  } catch {
    return [];
  }
}

function persist(selected: CompareStub[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
  } catch {
    /* ignore quota */
  }
}

const CompareSelectionContext = createContext<CompareSelectionContextValue | null>(null);

export function CompareSelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<CompareStub[]>(loadStored);

  useEffect(() => {
    persist(selected);
  }, [selected]);

  const toggle = useCallback((stub: CompareStub) => {
    const id = stub.id.trim();
    if (!id) return;
    const normalized = { ...stub, id };
    setSelected((prev) => {
      const exists = prev.some((s) => s.id === id);
      if (exists) return prev.filter((s) => s.id !== id);
      if (prev.length >= 3) return prev;
      return [...prev, normalized];
    });
  }, []);

  const removeId = useCallback((id: string) => {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clear = useCallback(() => setSelected([]), []);

  const isSelected = useCallback((id: string) => selected.some((s) => s.id === id), [selected]);

  const value = useMemo(
    (): CompareSelectionContextValue => ({
      selected,
      toggle,
      removeId,
      clear,
      isSelected,
      slotsRemaining: Math.max(0, 3 - selected.length),
      canCompare: selected.length >= 2,
    }),
    [selected, toggle, removeId, clear, isSelected],
  );

  return <CompareSelectionContext.Provider value={value}>{children}</CompareSelectionContext.Provider>;
}

export function useCompareSelection(): CompareSelectionContextValue {
  const ctx = useContext(CompareSelectionContext);
  if (!ctx) {
    throw new Error('useCompareSelection must be used within CompareSelectionProvider');
  }
  return ctx;
}
