import { forwardRef, type ButtonHTMLAttributes, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import type { ButtonDef } from '../types';

interface CalcButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  button: ButtonDef;
  shiftActive: boolean;
  /** ALT（第2機能）が押されているか */
  altActive?: boolean;
  /** 親の高さいっぱいに広げる（全画面の電卓で使う） */
  fill?: boolean;
  highlighted?: boolean;
  onPress: (action: string) => void;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

const variantClassMap: Record<ButtonDef['variant'], string> = {
  digit: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700',
  operator: 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:hover:bg-amber-500/30',
  action: 'bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
  function: 'bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500/25',
  mode: 'bg-violet-100 text-violet-900 hover:bg-violet-200 dark:bg-violet-500/20 dark:text-violet-200 dark:hover:bg-violet-500/30',
  memory: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25',
};

const CalcButton = forwardRef<HTMLButtonElement, CalcButtonProps>(function CalcButton(
  { button, shiftActive, altActive = false, fill = false, highlighted = false, onPress, onClick, className, ...buttonProps },
  ref
) {
  // ALT が優先。次に SHIFT。どちらも無ければそのキー本来の機能。
  const label = altActive && button.altLabel
    ? button.altLabel
    : shiftActive && button.shiftLabel
      ? button.shiftLabel
      : button.label;
  const action = altActive && button.altAction
    ? button.altAction
    : shiftActive && button.shiftAction
      ? button.shiftAction
      : button.action;
  const isShiftKey = button.action === 'toggle-shift';
  const isAltKey = button.action === 'toggle-alt';
  const hasShiftAlt = !isShiftKey && !isAltKey && Boolean(button.shiftAction || button.shiftLabel);
  const hasAlt = !isAltKey && Boolean(button.altAction || button.altLabel);
  const showShiftSubLabel = (hasShiftAlt || hasAlt) && label !== button.label;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    onPress(action);
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={cn(
        'relative rounded-lg border border-white/50 px-1 text-base font-semibold shadow-sm transition active:translate-y-px',
        // 全画面では画面の高さに合わせて伸ばす。最低44px（DADSのタップ領域）は確保する。
        fill ? 'h-full min-h-11' : 'h-11 sm:h-12',
        variantClassMap[button.variant],
        button.wide && 'col-span-2',
        showShiftSubLabel && 'py-1',
        isShiftKey && shiftActive && 'ring-2 ring-violet-400 ring-offset-1 dark:ring-violet-300',
        isAltKey && altActive && 'ring-2 ring-amber-600 ring-offset-1 dark:ring-amber-400',
        // ライトは amber-700 (対キー背景 4.57:1)、ダークは amber-400 (8.92:1)。
        // どちらも DADS の非テキスト 3:1 を満たす。yellow-400 は 1.39:1 で見えなかった。
        highlighted && 'ring-[3px] ring-amber-700 ring-offset-1 dark:ring-amber-400',
        className
      )}
      aria-pressed={isShiftKey ? shiftActive : isAltKey ? altActive : undefined}
      {...buttonProps}
    >
      {/* 色だけに情報を乗せないための印。枠線と併用する。 */}
      {highlighted && (
        <span
          aria-hidden="true"
          className="absolute left-1 top-0.5 text-[11px] font-bold leading-none text-amber-800 dark:text-amber-300"
        >
          ▶
        </span>
      )}
      {hasShiftAlt && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute right-1.5 top-1.5 size-1.5 rounded-full bg-current opacity-45',
            shiftActive && 'opacity-80'
          )}
        />
      )}
      {/* ALT の副機能を持つ印。SHIFT の丸と形を変えて、色だけに頼らないようにする。 */}
      {hasAlt && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute left-1.5 top-1.5 size-1.5 rotate-45 bg-current opacity-45',
            altActive && 'opacity-80'
          )}
        />
      )}
      <span className={cn('block leading-none', showShiftSubLabel && 'flex flex-col items-center gap-1')}>
        <span className={cn('block', showShiftSubLabel && 'text-xs sm:text-sm')}>{label}</span>
        {showShiftSubLabel && (
          <span className="block text-[10px] font-medium opacity-70 sm:text-xs">{button.label}</span>
        )}
      </span>
    </button>
  );
});

export default CalcButton;
