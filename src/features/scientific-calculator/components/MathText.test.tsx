import { render } from '@testing-library/react';
import MathText, { splitMath } from './MathText';

describe('MathText', () => {
  it('10^9 を底と指数に分ける', () => {
    expect(splitMath('7.04 × 10^9')).toEqual([{ base: '7.04 × 10', exponent: '9' }]);
  });

  it('負の指数も拾う', () => {
    expect(splitMath('8.54 × 10^-7 + 2.05 × 10^-8')).toEqual([
      { base: '8.54 × 10', exponent: '-7' },
      { base: ' + 2.05 × 10', exponent: '-8' },
    ]);
  });

  it('小数の指数も拾う', () => {
    expect(splitMath('2.03^0.48')).toEqual([{ base: '2.03', exponent: '0.48' }]);
  });

  it('かっこ付きの指数は、かっこを外して上付きにする', () => {
    expect(splitMath('1.34^(1÷6.54)')).toEqual([{ base: '1.34', exponent: '1÷6.54' }]);
  });

  it('指数のあとに続く式も落とさない', () => {
    expect(splitMath('( 4.92 × 10^9 ) ÷ 3')).toEqual([
      { base: '( 4.92 × 10', exponent: '9' },
      { base: ' ) ÷ 3' },
    ]);
  });

  it('^ が無ければそのまま', () => {
    expect(splitMath('12 × ( 8 + 5 ) ÷ 3')).toEqual([{ base: '12 × ( 8 + 5 ) ÷ 3' }]);
  });

  it('描いたとき ^ は残らず、指数は sup になる', () => {
    const { container } = render(<MathText>{'7.04 × 10^9'}</MathText>);
    expect(container.textContent).not.toContain('^');
    expect(container.querySelector('sup')?.textContent).toBe('9');
  });

  it('負の指数はマイナス記号で出す', () => {
    const { container } = render(<MathText>{'8.54 × 10^-7'}</MathText>);
    expect(container.querySelector('sup')?.textContent).toBe('−7');
  });
});
