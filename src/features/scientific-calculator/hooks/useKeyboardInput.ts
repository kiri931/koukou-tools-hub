import { useEffect } from 'react';

interface UseKeyboardInputOptions {
  onPress: (action: string) => void;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

const KEY_ACTION_MAP: Record<string, string> = {
  Enter: '=',
  '=': '=',
  Backspace: 'del',
  Delete: 'del',
  Escape: 'ac',
  ArrowLeft: 'cursor-left',
  ArrowRight: 'cursor-right',
  ArrowUp: 'history-up',
  ArrowDown: 'history-down',
  Home: 'cursor-home',
  '+': '+',
  '-': '-',
  '*': '*',
  '/': '/',
  '^': '^',
  '.': '.',
  '(': '(',
  ')': ')',
  x: '*',
  X: '*',
};

export function useKeyboardInput({ onPress }: UseKeyboardInputOptions) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      let action: string | null = null;
      if (/^[0-9]$/.test(event.key)) {
        action = event.key;
      } else {
        action = KEY_ACTION_MAP[event.key] ?? null;
      }

      if (!action) return;

      event.preventDefault();
      onPress(action);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onPress]);
}
