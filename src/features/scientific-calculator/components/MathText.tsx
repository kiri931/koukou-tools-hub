import { Fragment } from 'react';

/**
 * 問題文の `10^9` `2.03^0.48` `1.34^(1÷6.54)` を、検定の問題用紙と同じ上付きで出す。
 *
 * 過去問（第82・83・85・86回）はべき指数を上付きで印刷していて、
 * `^` という記号は紙面のどこにも出てこない。
 * 生徒が本番で見る形と揃えるため、表示のときだけ上付きに直す。
 * キー操作（guide / keySequence）はこの関数を通さない。
 */
export function splitMath(text: string): Array<{ base: string; exponent?: string }> {
  const parts: Array<{ base: string; exponent?: string }> = [];
  // ^( … ) か、^ に続く数字（先頭の - を含む）
  const re = /\^(\(([^)]*)\)|-?[\d.]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const exponent = (m[2] ?? m[1]).trim();
    parts.push({ base: text.slice(last, m.index), exponent });
    last = m.index + m[0].length;
  }
  if (last < text.length || parts.length === 0) parts.push({ base: text.slice(last) });
  return parts;
}

export default function MathText({ children }: { children: string }) {
  const parts = splitMath(children);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part.base}
          {part.exponent !== undefined && (
            // 上付きは行の高さを押し上げないようにしておく
            <sup className="text-[0.75em] leading-none">
              {part.exponent.replace(/-/g, '−')}
            </sup>
          )}
        </Fragment>
      ))}
    </>
  );
}
