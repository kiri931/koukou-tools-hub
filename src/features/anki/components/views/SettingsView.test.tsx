// 設定画面の「1日に出す新しいカード」。保存される値と、保存させない値を見る。

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsView from './SettingsView';
import { DEFAULT_SETTINGS } from '../../types';

// 目標保持率のスライダ（Radix）が ResizeObserver を使う。jsdom には無いので空のものを置く
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

function setup() {
  const onSave = vi.fn(async () => undefined);
  render(<SettingsView settings={DEFAULT_SETTINGS} onSave={onSave} />);
  const input = screen.getByLabelText('1日に出す新しいカード') as HTMLInputElement;
  const save = screen.getByRole('button', { name: '保存' });
  return { onSave, input, save };
}

describe('1日に出す新しいカードの設定', () => {
  it('既定は20枚と表示される', () => {
    const { input } = setup();
    expect(input.value).toBe('20');
  });

  it('5にして保存すると、5で保存される', async () => {
    const { onSave, input, save } = setup();
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(save);
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ newCardsPerDay: 5 })));
  });

  it('空欄で保存すると、既定の20に戻る', async () => {
    const { onSave, input, save } = setup();
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(save);
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ newCardsPerDay: 20 })));
    expect(input.value).toBe('20');
  });

  it('0は保存できる（復習だけ）', async () => {
    const { onSave, input, save } = setup();
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.click(save);
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ newCardsPerDay: 0 })));
  });

  it('負の数は保存せず、理由を出す', async () => {
    const { onSave, input, save } = setup();
    fireEvent.change(input, { target: { value: '-3' } });
    fireEvent.click(save);
    expect(await screen.findByText('新しいカードの枚数は、0以上の整数で入れてください。')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
