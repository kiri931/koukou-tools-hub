import {
  DEFAULT_LEVEL,
  categoriesForFilter,
  levelFilterOptions,
  levelMatches,
  levelOptions,
  normalizeTypedAnswer,
  parseArchiveParam,
  parseModeParam,
  urlWithDrillState,
} from './drillOptions';
import { keyStepsFor } from './keyLabels';

describe('URL のモード指定', () => {
  it('指定が無ければ「自分で解く」', () => {
    expect(parseModeParam('')).toBe('solo');
  });

  it.each(['guide', 'solo', 'sheet', 'tips'] as const)('?mode=%s をそのまま使う', (mode) => {
    expect(parseModeParam(`?mode=${mode}`)).toBe(mode);
  });

  it.each(['?mode=GUIDE', '?mode=exam', '?mode=', '?level=4'])('不正な値 %s なら「自分で解く」', (q) => {
    expect(parseModeParam(q)).toBe('solo');
  });

  it('モードを書き込み、ほかのクエリとハッシュは残す', () => {
    expect(urlWithDrillState('https://example.org/tools/calc-drill/?x=1#a', 'guide', false)).toBe(
      '/tools/calc-drill/?x=1&mode=guide#a'
    );
  });

  it('アーカイブを開いたら level=4、閉じたら消す', () => {
    const opened = urlWithDrillState('https://example.org/tools/calc-drill/', 'solo', true);
    expect(opened).toBe('/tools/calc-drill/?mode=solo&level=4');
    expect(urlWithDrillState(`https://example.org${opened}`, 'sheet', false)).toBe(
      '/tools/calc-drill/?mode=sheet'
    );
  });
});

describe('級の選択肢（4級はアーカイブ）', () => {
  it('既定の級は3級', () => {
    expect(DEFAULT_LEVEL).toBe('3級');
  });

  it('ふだんの選択肢に4級が出ない', () => {
    expect(levelOptions(false)).toEqual(['3級', '2級']);
    expect(levelFilterOptions(false)).not.toContain('4級');
    expect(levelFilterOptions(false)).toContain('2級');
  });

  it('「すべて」は3級と2級だけで、4級の問題も4級だけの分野も入らない', () => {
    expect(levelMatches('3級', 'すべて')).toBe(true);
    expect(levelMatches('2級', 'すべて')).toBe(true);
    expect(levelMatches('4級', 'すべて')).toBe(false);
    expect(categoriesForFilter('すべて')).not.toContain('集計計算');
  });

  it('?level=4 でアーカイブを開き、そのときは4級だけ', () => {
    expect(parseArchiveParam('?level=4')).toBe(true);
    expect(parseArchiveParam('?level=3')).toBe(false);
    expect(parseArchiveParam('')).toBe(false);
    expect(levelOptions(true)).toEqual(['4級']);
    expect(levelMatches('4級', '4級')).toBe(true);
  });
});

describe('打った答えの正規化', () => {
  it('全角・カンマ・空白・全角マイナスを直す', () => {
    expect(normalizeTypedAnswer('１２．３５')).toBe('12.35');
    expect(normalizeTypedAnswer(' 1,234.5 ')).toBe('1234.5');
    expect(normalizeTypedAnswer('−0.25')).toBe('-0.25');
    expect(normalizeTypedAnswer('3.46e-8')).toBe('3.46e-8');
  });
});

describe('打ち方の表示', () => {
  it('数字は1つの数にまとめ、SHIFT 側のキーの前に SHIFT を補う', () => {
    // log ( 3.08 ) × ³√ ( 2 ) =
    expect(keyStepsFor(['log(', '3', '.', '0', '8', ')', '*', 'cbrt(', '2', ')', '='])).toEqual([
      'log',
      '3.08',
      ')',
      '×',
      'SHIFT',
      expect.any(String),
      '2',
      ')',
      '=',
    ]);
  });
});
