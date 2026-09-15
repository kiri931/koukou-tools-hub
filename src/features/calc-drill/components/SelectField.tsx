interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  /** 選択肢の表示名。省略すると値をそのまま出す */
  display?: (value: T) => string;
}

/**
 * ラベル付きの選択メニュー。
 *
 * 級・分野・練習のしかたを横並びのボタンで出すと、キーパッドの前に
 * 15個のボタンが並んで、どれが設定でどれが電卓か分からなくなる。
 * 数が多く、かつ「1つだけ選ぶ」ものはメニューにまとめる。
 *
 * 素の <select> を使う。iPad ではシステムのメニューが出て指で選びやすく、
 * 読み上げやキーボード操作も最初から効く。
 * 文字は16px（iOS は16px未満の入力欄で勝手に拡大するため）。
 */
export default function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  display,
}: SelectFieldProps<T>) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-base text-slate-700 dark:text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="min-h-11 rounded-lg border border-slate-500 bg-white px-3 text-base font-semibold text-slate-900 dark:border-slate-400 dark:bg-slate-900 dark:text-slate-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {display ? display(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}
