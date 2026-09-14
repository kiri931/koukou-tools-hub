import {
  baseAllowsChar,
  formatDms,
  formatInBase,
  formatModeLabel,
  formatResult,
  formatScientific,
} from './format';

describe('format', () => {
  describe('formatResult', () => {
    it('Norm はこれまでどおりの見せ方を保つ', () => {
      const opts = { formatMode: 'NORM' as const, digits: 6, base: 'DEC' as const };
      expect(formatResult(0.5, opts)).toBe('0.5');
      expect(formatResult(1234.5, opts)).toBe('1234.5');
      expect(formatResult(52, opts)).toBe('52');
    });

    it('Fix は小数点以下の桁数を固定する', () => {
      expect(formatResult(3.14159, { formatMode: 'FIX', digits: 2, base: 'DEC' })).toBe('3.14');
      expect(formatResult(3.14159, { formatMode: 'FIX', digits: 0, base: 'DEC' })).toBe('3');
    });

    it('Sci は有効数字をそろえた指数表記にする', () => {
      expect(formatResult(-233, { formatMode: 'SCI', digits: 3, base: 'DEC' })).toBe('-2.33E2');
      expect(formatResult(-2240000, { formatMode: 'SCI', digits: 3, base: 'DEC' })).toBe('-2.24E6');
    });

    it('Eng は指数を3の倍数にそろえる', () => {
      expect(formatResult(12345, { formatMode: 'ENG', digits: 3, base: 'DEC' })).toBe('12.3E3');
      expect(formatResult(0.00573, { formatMode: 'ENG', digits: 3, base: 'DEC' })).toBe('5.73E-3');
    });

    it('ENG◀/▶ で指数をずらしても、桁の繰り上げで元に戻らない', () => {
      const opts = { formatMode: 'ENG' as const, digits: 3, base: 'DEC' as const };
      expect(formatResult(12345, { ...opts, engShift: 0 })).toBe('12.3E3');
      expect(formatResult(12345, { ...opts, engShift: 3 })).toBe('12345E0');
    });

    it('DEC以外は整数で、負の数は32ビットの2の補数になる', () => {
      expect(formatResult(255, { formatMode: 'NORM', digits: 6, base: 'HEX' })).toBe('FF');
      expect(formatResult(10, { formatMode: 'NORM', digits: 6, base: 'BIN' })).toBe('1010');
      expect(formatResult(64, { formatMode: 'NORM', digits: 6, base: 'OCT' })).toBe('100');
      expect(formatResult(-1, { formatMode: 'NORM', digits: 6, base: 'HEX' })).toBe('FFFFFFFF');
    });
  });

  it('formatScientific は丸めの繰り上がりを指数に反映する', () => {
    // 9.999 は有効数字3桁で 10.0 になるので、指数が1つ上がる
    expect(formatScientific(9.999, 3, 1)).toBe('1.00E1');
  });

  it('formatInBase は範囲外を Error にする', () => {
    expect(formatInBase(2 ** 40, 'HEX')).toBe('Error');
  });

  it('formatDms は十進の角度を度分秒にする', () => {
    expect(formatDms(1.5)).toBe("1°30'0\"");
    expect(formatDms(85 + 29 / 60 + 17 / 3600)).toBe("85°29'17\"");
    expect(formatDms(-1.5)).toBe("-1°30'0\"");
  });

  it('baseAllowsChar はその基数で使える文字だけを通す', () => {
    expect(baseAllowsChar('BIN', '1')).toBe(true);
    expect(baseAllowsChar('BIN', '2')).toBe(false);
    expect(baseAllowsChar('OCT', '7')).toBe(true);
    expect(baseAllowsChar('OCT', '8')).toBe(false);
    expect(baseAllowsChar('HEX', 'F')).toBe(true);
    expect(baseAllowsChar('DEC', 'A')).toBe(false);
  });

  it('formatModeLabel は Sci3 のような表示を作る', () => {
    expect(formatModeLabel('SCI', 3)).toBe('Sci3');
    expect(formatModeLabel('NORM', 6)).toBe('Norm');
  });
});
