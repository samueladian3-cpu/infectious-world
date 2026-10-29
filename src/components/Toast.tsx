import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { IcName } from '../ui/meta';
import { Ico } from './ui';

export type ToastTone = 'info' | 'good' | 'warn' | 'bad';
interface ToastItem {
  id: number;
  text: string;
  tone: ToastTone;
}

const ICON: Record<ToastTone, IcName> = { info: 'info', good: 'check', warn: 'warn', bad: 'megaphone' };

const ToastContext = createContext<(text: string, tone?: ToastTone) => void>(() => {});

/** Maksimal 3 toast, masing-masing hilang setelah 3,2 detik. */
export function ToastProvider({ children, bottom }: { children: ReactNode; bottom: string }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const show = useCallback((text: string, tone: ToastTone = 'info') => {
    const id = nextId.current++;
    setItems((list) => [...list.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-stack" style={{ bottom }} role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            <Ico name={ICON[t.tone]} size={18} stroke={2.8} />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
