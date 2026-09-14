import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { NumberFormatMode } from '../types';

interface DigitsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formatMode: NumberFormatMode;
  digits: number;
  onPress: (action: string) => void;
}

const FORMAT_LABELS: Record<NumberFormatMode, string> = {
  NORM: 'Norm（ふつう）',
  FIX: 'Fix（小数点以下の桁数を固定）',
  SCI: 'Sci（科学表記）',
  ENG: 'Eng（工学表記・指数は3の倍数）',
};

export default function DigitsPanel({
  open,
  onOpenChange,
  formatMode,
  digits,
  onPress,
}: DigitsPanelProps) {
  const caption =
    formatMode === 'FIX'
      ? '小数点以下の桁数'
      : formatMode === 'NORM'
        ? '桁数（Normでは使いません）'
        : '有効数字の桁数';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>表示する桁数（DIGS）</SheetTitle>
          <SheetDescription>
            いまの表示形式は「{FORMAT_LABELS[formatMode]}」です。SHIFTのALT（FSE）で切り替えられます。
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6 text-base">
          <p className="font-semibold">{caption}</p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 11 }, (_, n) => n).map((n) => (
              <Button
                key={n}
                type="button"
                variant={n === digits ? 'default' : 'outline'}
                onClick={() => onPress(`digits:${n}`)}
                // 選ばれている桁は色だけでなく「✓」でも示す
                aria-pressed={n === digits}
                className="min-w-12"
              >
                {n === digits ? `✓${n}` : n}
              </Button>
            ))}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            例: Sci3 なら −233 は −2.33E2 と出ます。
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
