// セクションの見出し。メインサイト(koukou-jouhou)の SectionHeading.astro と揃えてある。
//
// 以前は `STUDY` `TOOLS` `SUPPORT` という英大文字の見出しだった。
// 日本語サイトで中身を表さないうえ、スクリーンリーダーが1文字ずつ
// 読み上げることがあるので使わない。
//
// 2026-09-27: 高校情報の共通部品 kj-heading（下に太い線）へ。説明文は本文と同じ 16px。

interface SectionHeadingProps {
  title: string;
  desc?: string;
}

export function SectionHeading({ title, desc }: SectionHeadingProps) {
  return (
    <div className="mb-5 flex flex-col gap-2">
      <h2 className="kj-heading kj-heading--rule">{title}</h2>
      {desc && <p className="m-0 text-base text-[var(--color-text-muted)]">{desc}</p>}
    </div>
  );
}

export default SectionHeading;
