// 新しいカードの1日の上限を、画面に出す部品。
// 上限で止まっていることが「出題が壊れた」「全部終わった」と読まれないように、
// 残りの枚数と、止まっている理由（1日の上限）を文字で出す。色だけに頼らない。

import { isNewLimitReached, type NewCardBudget } from '../lib/newCardLimit';

/** 「新しいカード 残り N 枚（今日）」の1行。上限で止まったら「ここまで」と出す */
export function NewCardCounter({ budget }: { budget: NewCardBudget | null | undefined }) {
  if (!budget) return null;
  if (isNewLimitReached(budget)) {
    return (
      <p className="text-base font-semibold text-[var(--color-text)]" aria-live="polite">
        今日の新しいカードはここまで（1日{budget.limit}枚まで）
      </p>
    );
  }
  if (budget.unseen === 0) {
    return <p className="text-base text-[var(--color-text-muted)]">新しいカードはすべて出し終えました</p>;
  }
  return (
    <p className="text-base text-[var(--color-text)]" aria-live="polite">
      新しいカード 残り <span className="font-mono font-bold">{Math.min(budget.remaining, budget.unseen)}</span> 枚（今日）
      {/* 狭い画面で「1日」と「25枚まで」の間で折れないよう、まとめて折り返す */}
      <span className="inline-block text-[var(--color-text-muted)]">／1日{budget.limit}枚まで</span>
    </p>
  );
}

/** 上限で止まったときの説明。セッション完了の画面などに出す */
export function NewCardLimitNotice({ budget }: { budget: NewCardBudget | null | undefined }) {
  if (!budget || !isNewLimitReached(budget)) return null;
  return (
    <div className="kj-notice kj-notice--info" role="note">
      <div>
        <p className="kj-notice__title" style={{ margin: 0 }}>
          今日の新しいカードはここまで
        </p>
        <p style={{ margin: 0 }}>
          {budget.limit === 0
            ? '設定で、新しいカードを1日0枚（復習だけ）にしています。'
            : `新しいカードは1日${budget.limit}枚までにしています。`}
          まだ出していないカードが、あと{budget.unseen}枚あります。
          {budget.limit > 0 && `明日また${Math.min(budget.limit, budget.unseen)}枚出ます。`}
          枚数は「設定」タブで変えられます。
        </p>
      </div>
    </div>
  );
}
