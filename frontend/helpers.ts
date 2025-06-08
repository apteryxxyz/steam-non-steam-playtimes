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
  return Millennium.findElement(document, String(selectors));
}

export function querySelector(document: Document, selector: string) {
  return Millennium.findElement(document, selector).then((e) => e[0]);
}
