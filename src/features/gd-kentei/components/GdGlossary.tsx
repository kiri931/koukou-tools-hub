import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { terms as allTerms } from "../data/terms";
import { fields, levelLabels, levels as allLevels } from "../lib/fields";
import type { FieldId, GdTerm, Level } from "../types";

/**
 * グラフィックデザイン検定の用語辞典。
 *
 * 過去問の問題文は載せない。載せるのは書き下ろした定義だけで、
 * どの回のどの設問で問われたかは `seenIn` の件数としてだけ示す。
 */

type FieldFilter = FieldId | "all";

export default function GdGlossary() {
  const [query, setQuery] = useState("");
  const [field, setField] = useState<FieldFilter>("all");
  const [level, setLevel] = useState<Level | "all">("all");

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allTerms
      .filter((t) => (field === "all" ? true : t.field === field))
      .filter((t) => (level === "all" ? true : t.levels.includes(level)))
      .filter((t) =>
        needle === ""
          ? true
          : [t.term, t.reading, t.short, t.body].some((s) => s.toLowerCase().includes(needle)),
      )
      .sort((a, b) => a.reading.localeCompare(b.reading, "ja"));
  }, [query, field, level]);

  return (
    // 見出し（h1）と説明はページ側（Astro の PageHead）が SSR で出す。
    // <main> もページ側にあるので div にする。
    <div>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="gd-glossary-search"
            className="block text-base font-bold"
          >
            用語・読み・説明から探す
          </label>
          <Input
            id="gd-glossary-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ノンブル、あみてん、など"
            className="mt-2 h-11 text-base"
          />
        </div>

        <FilterRow label="分野">
          <FilterChip active={field === "all"} onClick={() => setField("all")}>
            すべて
          </FilterChip>
          {fields.map((f) => (
            <FilterChip key={f.id} active={field === f.id} onClick={() => setField(f.id)}>
              {f.label}
            </FilterChip>
          ))}
        </FilterRow>

        <FilterRow label="級">
          <FilterChip active={level === "all"} onClick={() => setLevel("all")}>
            すべて
          </FilterChip>
          {allLevels.map((l) => (
            <FilterChip key={l} active={level === l} onClick={() => setLevel(l)}>
              {levelLabels[l]}
            </FilterChip>
          ))}
        </FilterRow>
      </div>

      <p className="mt-6 text-base text-[var(--color-text-muted)]" aria-live="polite">
        {shown.length}語 / 全{allTerms.length}語
      </p>

      {shown.length === 0 ? (
        <p className="mt-8 rounded-lg border border-[var(--color-border)] p-6 text-base">
          あてはまる用語がありません。読みをひらがなで入れるか、分野の絞り込みを外してみてください。
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {shown.map((term) => (
            <TermCard key={term.id} term={term} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-base font-bold">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        // 44px 以上の高さを確保する（指で押せる大きさ）
        "min-h-11 rounded-full border px-4 text-base transition-colors",
        active
          ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-strong)]",
      )}
    >
      {children}
    </button>
  );
}

function TermCard({ term }: { term: GdTerm }) {
  const field = fields.find((f) => f.id === term.field);
  return (
    <li
      id={term.id}
      className="scroll-mt-20 rounded-lg border border-[var(--kj-divider)] bg-[var(--color-surface)] p-5"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{term.term}</h2>
        <span className="text-base text-[var(--color-text-muted)]">{term.reading}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {field && <Badge variant="secondary">{field.label}</Badge>}
        {term.levels.map((l) => (
          <Badge key={l} variant="outline">
            {levelLabels[l]}で出題
          </Badge>
        ))}
      </div>

      <p className="mt-3 text-base leading-relaxed text-slate-900 dark:text-slate-100">
        {term.short}
      </p>
      {term.body && (
        <p className="mt-2 text-base leading-relaxed">
          {renderEmphasis(term.body)}
        </p>
      )}

      <p className="mt-3 text-sm text-[var(--color-text-muted)]">
        {term.seenIn.length > 0
          ? `第26〜30回で${term.seenIn.length}回問われています`
          : "出題箇所は特定できていません（表記が違う形で出ています）"}
      </p>
    </li>
  );
}

/** `**…**` を太字にする。用語の説明で「ここを取り違える」箇所を強調するために使う。 */
function renderEmphasis(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-bold text-slate-900 dark:text-slate-50">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}
