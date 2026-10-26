import { fireEvent, render, screen, within } from '@testing-library/react';
import type { DrillProblem } from '../types';

/*
 * 直接入力の答え合わせを確かめるため、問題を1つに固定する。
 * 採点（grading.ts）は本物を使い、丸めの判定が今と同じかも一緒に見る。
 */
const FIXED: DrillProblem = {
  id: 'fixed-1',
  level: '3級',
  category: '四則計算',
  question: '3.08 × 4.01',
  expectedAnswer: '12.35',
  keySequence: ['3', '.', '0', '8', '*', '4', '.', '0', '1', '='],
  angleMode: 'DEG',
  rounding: { kind: 'decimals', value: 2 },
};

vi.mock('../data/problems', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/problems')>();
  return {
    ...actual,
    generateProblems: () => [FIXED, { ...FIXED, id: 'fixed-2' }],
  };
});

import CalcDrill from './CalcDrill';

function openAt(search: string) {
  window.history.replaceState(null, '', `/tools/calc-drill/${search}`);
  window.localStorage.clear();
  return render(<CalcDrill />);
}

const modeSelect = () => screen.getByLabelText('練習') as HTMLSelectElement;

describe('最初に開くモードと URL', () => {
  it('指定が無ければ「自分で解く」で、画面の電卓は隠れている', () => {
    openAt('');
    expect(modeSelect().value).toBe('solo');
    expect(screen.getByRole('button', { name: 'このサイトの電卓で打つ' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.queryByRole('button', { name: /^SHIFT/ })).toBeNull();
  });

  it('?mode=guide でガイド練習が開く', () => {
    openAt('?mode=guide');
    expect(modeSelect().value).toBe('guide');
  });

  it('不正な値なら「自分で解く」', () => {
    openAt('?mode=foo');
    expect(modeSelect().value).toBe('solo');
  });

  it('モードを切り替えると URL も変わる', () => {
    openAt('');
    fireEvent.change(modeSelect(), { target: { value: 'sheet' } });
    expect(new URLSearchParams(window.location.search).get('mode')).toBe('sheet');
  });
});

describe('直接入力で答え合わせ', () => {
  it('正しい答えを打つと正解', () => {
    openAt('');
    fireEvent.change(screen.getByLabelText('答え'), { target: { value: '12.35' } });
    fireEvent.click(screen.getByRole('button', { name: '答え合わせ' }));
    expect(screen.getByRole('status')).toHaveTextContent('✓ 正解');
  });

  it('全角で打っても同じ判定になる', () => {
    openAt('');
    fireEvent.change(screen.getByLabelText('答え'), { target: { value: '１２．３５' } });
    fireEvent.click(screen.getByRole('button', { name: '答え合わせ' }));
    expect(screen.getByRole('status')).toHaveTextContent('✓ 正解');
  });

  it('ちがう答えだと不正解で、正しい答えを見せる', () => {
    openAt('');
    fireEvent.change(screen.getByLabelText('答え'), { target: { value: '12.3' } });
    fireEvent.click(screen.getByRole('button', { name: '答え合わせ' }));
    expect(screen.getByRole('status')).toHaveTextContent('✗ 不正解 → 12.35');
  });

  it('解答用紙でも各問の入力欄に打って採点できる', () => {
    openAt('?mode=sheet');
    fireEvent.change(screen.getByLabelText('(1) の答え'), { target: { value: '12.35' } });
    fireEvent.change(screen.getByLabelText('(2) の答え'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: '採点する' }));
    expect(screen.getAllByText('○ 正解').length).toBe(1);
    expect(screen.getAllByText('✗ 12.35').length).toBe(1);
  });
});

describe('画面の電卓（オプション）', () => {
  it('「このサイトの電卓で打つ」で電卓が出て、選んだ表示を覚える', () => {
    openAt('');
    fireEvent.click(screen.getByRole('button', { name: 'このサイトの電卓で打つ' }));
    expect(screen.getAllByRole('button', { name: /SHIFT/ }).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText('答え')).toBeNull();
    expect(window.localStorage.getItem('calc-drill.show-calc')).toBe('1');
  });
});

describe('打ち方を見る', () => {
  it('開くと押す順が出る', () => {
    openAt('');
    fireEvent.click(screen.getByRole('button', { name: /打ち方を見る/ }));
    const list = screen.getByRole('list', { name: '押す順' });
    expect(within(list).getByText('3.08')).toBeInTheDocument();
    expect(screen.getByText(/機種によっては異なります/)).toBeInTheDocument();
  });
});

describe('4級はアーカイブ', () => {
  it('級の選択肢に4級が出ない', () => {
    openAt('');
    const options = [...(screen.getByLabelText('級') as HTMLSelectElement).options].map((o) => o.value);
    expect(options).toEqual(['3級', '2級']);
  });

  it('ガイド練習の選択肢にも4級が出ない', () => {
    openAt('?mode=guide');
    const options = [...(screen.getByLabelText('級') as HTMLSelectElement).options].map((o) => o.value);
    expect(options).not.toContain('4級');
  });

  it('アーカイブから開くと4級になり、URL に level=4 が付く', () => {
    openAt('');
    fireEvent.click(screen.getByRole('button', { name: '4級の問題（アーカイブ）を開く' }));
    expect(screen.getByText('4級の問題（アーカイブ）を表示しています。')).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get('level')).toBe('4');
    fireEvent.click(screen.getByRole('button', { name: '3級に戻る' }));
    expect(new URLSearchParams(window.location.search).get('level')).toBeNull();
  });

  it('?level=4 で直接開ける', () => {
    openAt('?level=4');
    expect(screen.getByText('4級の問題（アーカイブ）を表示しています。')).toBeInTheDocument();
  });
});
