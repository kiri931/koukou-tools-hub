import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CATEGORIES_BY_LEVEL, LEVELS, presetFor } from '../exam-presets';
import type { ExamCategory, ExamChoice, ExamLevel } from '../types';

interface CalculatorSetupProps {
  choice: ExamChoice;
  onChange: (choice: ExamChoice) => void;
  onStart: () => void;
}

export default function CalculatorSetup({ choice, onChange, onStart }: CalculatorSetupProps) {
  const preset = presetFor(choice);
  const categories = CATEGORIES_BY_LEVEL[choice.level];

  const selectLevel = (level: ExamLevel) => {
    const next = CATEGORIES_BY_LEVEL[level];
    onChange({
      level,
      // 級を変えると分野の顔ぶれが変わる。無い分野を選んだままにしない
      category: next.includes(choice.category) ? choice.category : next[0],
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          何の練習に使いますか
        </h2>
        <p className="mt-1 text-base text-slate-700 dark:text-slate-300">
          選ぶと、その区分に合わせた電卓が画面いっぱいに開きます。あとから選び直せます。
        </p>
      </div>

      <fieldset>
        <legend className="text-base font-semibold text-slate-900 dark:text-slate-100">級</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {LEVELS.map((level) => (
            <ChoiceButton
              key={level}
              selected={choice.level === level}
              onClick={() => selectLevel(level)}
            >
              {level}
            </ChoiceButton>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-base font-semibold text-slate-900 dark:text-slate-100">分野</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((category: ExamCategory) => (
            <ChoiceButton
              key={category}
              selected={choice.category === category}
              onClick={() => onChange({ ...choice, category })}
            >
              {category}
            </ChoiceButton>
          ))}
        </div>
      </fieldset>

      <div className="rounded-xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {choice.level}・{choice.category}
        </p>
        <ul className="mt-2 space-y-1 text-base text-slate-700 dark:text-slate-300">
          <li>答えの丸め方: {preset.roundingHint}</li>
          {preset.keyHint && <li>よく使うキー: {preset.keyHint}</li>}
          <li>角度は {preset.angleMode}、表示は Norm ではじめます</li>
        </ul>
      </div>

      <Button type="button" size="lg" className="w-full text-lg" onClick={onStart}>
        電卓をひらく
      </Button>
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        // 選択中は色だけでなく「✓」と太い枠でも示す
        'min-h-11 rounded-lg border-2 px-4 py-2 text-base font-semibold transition',
        selected
          ? 'border-violet-700 bg-violet-700 text-white dark:border-violet-300 dark:bg-violet-300 dark:text-slate-900'
          : 'border-slate-400 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
      )}
    >
      {selected ? `✓ ${children}` : children}
    </button>
  );
}
