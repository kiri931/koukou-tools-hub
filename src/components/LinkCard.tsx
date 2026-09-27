// リンクカード。トップページとツール一覧で共通に使う。
//
// 以前はこの markup がトップページに16回コピーされていて、ホバー時の枠線色や
// アイコンの文字色がカードごとに違っていた。
//
// 2026-09-27: 見た目は高校情報の共通部品 kj-card（/kj/kj.css）に任せた。
// 枠・面・文字色・ホバーの枠色は kj の変数から来るので、ここでは色を持たない。
//
// アイコンのアクセント色は accent(16進1色)だけを受け取り、文字色は
// color-mix で作る(.icon-chip / global.css)。Tailwind のクラス名を
// 動的に組み立てると静的走査から漏れて CSS が出力されないため。
//
// 絞り込み（ツール一覧）は data-tool / data-audience を見て hidden を付け外しする。
// kj-card は display:flex だが、Tailwind の preflight の [hidden] が !important なので隠れる。

interface LinkCardProps {
  href: string;
  label: string;
  desc?: string;
  /** インライン SVG の文字列。省略するとアイコン枠ごと出さない */
  icon?: string;
  /** アクセント色（例 "#6366f1"）。省略時はブランドの indigo */
  accent?: string;
  /** 使う人での絞り込み用。data 属性として出し、絞り込みは素の JS が行う */
  audience?: "student" | "teacher" | "both";
  /**
   * 見出しの上に出す小さな印（「共有・送信あり」など）。
   * **付けるのは確かめられたものだけ。** 印が無い＝端末の中だけ、という
   * 読み方になるので、当てずっぽうで付けない。
   */
  badge?: string;
}

export function LinkCard({
  href,
  label,
  desc,
  icon,
  accent = "#6366f1",
  audience,
  badge,
}: LinkCardProps) {
  return (
    <a href={href} data-tool data-audience={audience} className="kj-card group">
      {icon && (
        // gap は kj-card が持つので、.icon-chip の下の余白は消す
        <div className="icon-chip" style={{ "--chip": accent, marginBottom: 0 } as React.CSSProperties}>
          <span className="block h-5 w-5" dangerouslySetInnerHTML={{ __html: icon }} />
        </div>
      )}
      {badge && (
        // 注意の色（kj-notice と同じ組）。文字は本文色なので 4.5:1 を割らない。
        // 枠の --color-warning は面に対して 3:1 以上（kj.css のコメント参照）
        <span
          className="kj-tag self-start"
          style={{
            borderColor: "var(--color-warning)",
            background: "var(--kj-notice-bg)",
            color: "var(--color-text)",
          }}
        >
          {badge}
        </span>
      )}
      <h3 className="kj-card__title">{label}</h3>
      {desc && <p className="kj-card__text">{desc}</p>}
    </a>
  );
}

export default LinkCard;
