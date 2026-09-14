import { act, renderHook } from '@testing-library/react';
import { useCalculator } from './useCalculator';

type CalculatorHook = ReturnType<typeof useCalculator>;

function press(result: { current: CalculatorHook }, ...actions: string[]) {
  act(() => {
    for (const action of actions) {
      result.current.pressButton(action);
    }
  });
}

describe('useCalculator（関数電卓として増やした機能）', () => {
  describe('角度モード', () => {
    it('DRG は DEG → RAD → GRAD の順に回る', () => {
      const { result } = renderHook(() => useCalculator());
      expect(result.current.state.angleMode).toBe('DEG');
      press(result, 'cycle-angle');
      expect(result.current.state.angleMode).toBe('RAD');
      press(result, 'cycle-angle');
      expect(result.current.state.angleMode).toBe('GRAD');
      press(result, 'cycle-angle');
      expect(result.current.state.angleMode).toBe('DEG');
    });

    it('GRAD では sin(100) が 1 になる', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'cycle-angle', 'cycle-angle');
      press(result, 'sin(', '1', '0', '0', ')', '=');
      expect(Number(result.current.state.result)).toBeCloseTo(1, 9);
    });
  });

  describe('表示形式', () => {
    it('FSE は Norm → Fix → Sci → Eng の順に回り、出ている答えの見せ方も変わる', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '2', '3', '3', 'negate', '=');
      expect(result.current.state.result).toBe('-233');

      press(result, 'cycle-format'); // FIX
      expect(result.current.state.formatMode).toBe('FIX');
      expect(result.current.state.result).toBe('-233.000000');

      press(result, 'digits:3');
      press(result, 'cycle-format'); // SCI
      expect(result.current.state.result).toBe('-2.33E2');

      press(result, 'cycle-format'); // ENG
      expect(result.current.state.formatMode).toBe('ENG');
    });

    it('ENG◀ / ENG▶ は出ている答えの指数だけを動かす', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '1', '2', '3', '4', '5', '=');
      press(result, 'cycle-format', 'cycle-format', 'cycle-format'); // ENG
      press(result, 'digits:3');
      expect(result.current.state.result).toBe('12.3E3');
      press(result, 'eng-right');
      expect(result.current.state.result).toBe('12345E0');
      expect(result.current.state.engShift).toBe(3);
    });
  });

  describe('基数モード', () => {
    it('HEX では FF + 1 が 100 になる', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'base:HEX');
      press(result, 'F', 'F', '+', '1', '=');
      expect(result.current.state.result).toBe('100');
      expect(result.current.state.resultValue).toBe(256);
    });

    it('BIN では 2 以上の数字も小数点も入らない', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'base:BIN');
      press(result, '1', '2', '.', '1');
      expect(result.current.state.expression).toBe('11');
    });

    it('DEC 以外では答えが整数になる', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'base:OCT');
      press(result, '7', '/', '2', '=');
      expect(result.current.state.resultValue).toBe(3);
      expect(result.current.state.result).toBe('3');
    });
  });

  describe('カーソル編集', () => {
    it('カーソルを戻して途中に入れられる', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '1', '2', 'cursor-left', '0', '=');
      expect(result.current.state.resultValue).toBe(102);
    });

    it('DEL はカーソル手前、⌦ はカーソル位置を消す', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '1', '2', '3', 'del');          // "12"
      expect(result.current.state.expression).toBe('12');
      press(result, 'cursor-home', 'del-forward');  // "2"
      expect(result.current.state.expression).toBe('2');
    });

    it('▲で1つ前に計算した式を呼び戻せる', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '1', '+', '1', '=');
      press(result, 'ac');
      press(result, 'history-up');
      expect(result.current.state.expression).toBe('1+1');
    });
  });

  describe('ALT / SHIFT', () => {
    it('ALT は1回押すと立ち、次のキーで戻る', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'toggle-alt');
      expect(result.current.state.altActive).toBe(true);
      press(result, '1');
      expect(result.current.state.altActive).toBe(false);
    });

    it('ALT と SHIFT は同時には立たない', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'toggle-shift');
      press(result, 'toggle-alt');
      expect(result.current.state.shiftActive).toBe(false);
      expect(result.current.state.altActive).toBe(true);
    });
  });

  describe('増やした関数', () => {
    it('Abs・Mod・x⁻¹ が計算できる', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'abs(', '-', '8', ')', '=');
      expect(result.current.state.resultValue).toBe(8);

      press(result, 'ac', 'mod(', '1', '7', ',', '5', ')', '=');
      expect(result.current.state.resultValue).toBe(2);

      press(result, 'ac', '4', 'inv(', '=');
      expect(result.current.state.resultValue).toBe(0.25);
    });

    it('Pol は r と θ の両方を出す', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'pol(', '3', ',', '4', ')', '=');
      expect(result.current.state.resultValue).toBe(5);
      const line = result.current.state.lines.at(-1);
      expect(line?.text).toContain('θ=53.13010235');
    });

    it('Rec は x と y の両方を出す', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'rec(', '2', ',', '6', '0', ')', '=');
      expect(result.current.state.resultValue).toBeCloseTo(1, 9);
      expect(result.current.state.lines.at(-1)?.text).toContain('y=1.732050807');
    });

    it('物理定数を式に入れられる', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'const:c', '=');
      expect(result.current.state.resultValue).toBe(299792458);
    });

    it('(−) は次に打つ数の符号になる', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'neg', '3', ')', '+', '1', '0', '=');
      expect(result.current.state.resultValue).toBe(7);
    });
  });

  describe('表示', () => {
    it('= を押すと式と答えが行として積み上がる', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '1', '+', '2', '=');
      press(result, 'ac', '3', '*', '4', '=');
      expect(result.current.state.lines).toHaveLength(4);
      expect(result.current.state.lines[0].text).toBe('1+2');
      expect(result.current.state.lines[1].text).toBe('=3');
      expect(result.current.state.lines[3].text).toBe('=12');
    });

    it('カーソルの前後に分けた表示が取れる', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '1', '+', '2', 'cursor-left');
      expect(result.current.displayBeforeCursor).toBe('1+');
      expect(result.current.displayAfterCursor).toBe('2');
    });

    it('H:M:S は答えを度分秒と十進で切り替える', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '1', '.', '5', '=');
      expect(result.current.state.result).toBe('1.5');
      press(result, 'dms-view');
      expect(result.current.state.dmsView).toBe(true);
    });

    it('メモリの M を式に入れて計算できる', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '1', '0', 'm+', 'ac');
      press(result, 'm', '*', '2', '=');
      expect(result.current.state.resultValue).toBe(20);
    });
  });
});
