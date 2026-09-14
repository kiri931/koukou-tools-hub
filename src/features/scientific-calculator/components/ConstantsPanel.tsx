import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PHYSICAL_CONSTANTS } from '../hooks/useCalculator';

interface ConstantsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPress: (action: string) => void;
}

export default function ConstantsPanel({ open, onOpenChange, onPress }: ConstantsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>物理定数（Const）</SheetTitle>
          <SheetDescription>選ぶと、いまのカーソル位置に記号のまま入ります。</SheetDescription>
        </SheetHeader>

        <div className="grid gap-2 px-4 pb-6 sm:grid-cols-2">
          {PHYSICAL_CONSTANTS.map((constant) => (
            <Button
              key={constant.key}
              type="button"
              variant="outline"
              className="h-auto justify-between gap-3 py-3 text-left"
              onClick={() => {
                onPress(`const:${constant.key}`);
                onOpenChange(false);
              }}
            >
              <span className="text-base font-semibold">{constant.label}</span>
              <span className="font-mono text-sm text-slate-600 dark:text-slate-300">
                {constant.value} {constant.unit}
              </span>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
