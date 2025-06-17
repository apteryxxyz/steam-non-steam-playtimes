import { Millennium } from '@steambrew/client';
import { createRoot } from 'react-dom/client';

export function renderComponent(component: React.ReactNode) {
  const container = document.createElement('div');
  const root = createRoot(container);
  root.render(component);
  return container;
}

export async function waitFor<T>(
  condition: () => T,
  interval = 10,
): Promise<T> {
  const result = await condition();
  if (result) return result;
  await new Promise((r) => setTimeout(r, interval * 1.1));
  return waitFor(condition, interval);
}

export function querySelectorAll(document: Document, selectors: string) {
  return Millennium.findElement(document, String(selectors), 5000);
}

export function jsonReplacer(_key: string, value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function jsonReviver(_key: string, value: unknown) {
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return value;
}

export type Tuple<Holds, Length extends number> = Length extends Length
  ? number extends Length
    ? Holds[]
    : _TupleOf<Holds, Length, []>
  : never;
type _TupleOf<
  Holds,
  Length extends number,
  Rest extends unknown[],
> = Rest['length'] extends Length
  ? Rest
  : _TupleOf<Holds, Length, [Holds, ...Rest]>;
