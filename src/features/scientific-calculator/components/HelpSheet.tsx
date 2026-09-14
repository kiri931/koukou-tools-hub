import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type HelpItem = {
  label: string;
  description: string;
  shiftLabel?: string;
  shiftDescription?: string;
  altLabel?: string;
  altDescription?: string;
};

type HelpSection = {
  title: string;
  items: HelpItem[];
};

const HELP_SECTIONS: HelpSection[] = [
  {
    title: 'ALT（黄色の副機能）',
    items: [
      {
        label: 'ALT',
        description:
          'キーの左上に「◆」が付いたボタンの、もう1つの機能を有効にします。1回押すと、次に押したキー1つだけに効きます。',
      },
      {
        label: 'ALT → SHIFT（FSE）',
        description:
          '答えの見せ方を Norm → Fix → Sci → Eng の順に切り替えます。Sci3 なら −233 は −2.33E2 と出ます。',
      },
      {
        label: 'ALT → DEG（DRG）',
        description: '角度単位を DEG → RAD → GRAD の順に切り替えます。',
      },
      {
        label: 'ALT → STAT（DIGS）',
        description: '桁数を決めます。Fix は小数点以下、Sci と Eng は有効数字の桁数です。',
      },
      {
        label: 'ALT → °′″（H:M:S）',
        description: '答えを度分秒の形と十進の形で切り替えて見ます。例: 1.5 ⇄ 1°30\'0"',
      },
      {
        label: 'ALT → MC（Const）',
        description: '光速・重力加速度などの物理定数を一覧から選んで式に入れます。',
      },
      {
        label: 'ALT → MR（M）',
        description: 'メモリの値を「M」という記号のまま式に入れます。あとから中身が変わっても追随します。',
      },
      {
        label: 'ALT → DEL（(−)）',
        description: 'これから打つ数の符号をマイナスにします。引き算の「−」とは別のキーです。',
      },
      {
        label: 'ALT → x²（x⁻¹）',
        description: '逆数を計算します。例: 4 x⁻¹ = 0.25',
      },
      {
        label: 'ALT → √（Abs）',
        description: '絶対値を計算します。例: Abs((−)8) = 8',
      },
      {
        label: 'ALT → xʸ（Mod）',
        description: '割った余りを計算します。例: Mod(17,5) = 2',
      },
      {
        label: 'ALT → log（Pol）',
        description: '直交座標を極座標へ直します。例: Pol(3,4) で r=5、θ=53.13°',
      },
      {
        label: 'ALT → ln（Rec）',
        description: '極座標を直交座標へ直します。例: Rec(2,60) で x=1、y=1.732',
      },
    ],
  },
  {
    title: 'カーソルと基数',
    items: [
      {
        label: '◀ ▶',
        description: 'カーソルを1つずつ動かします。途中に文字を入れたり消したりできます。キー: ← →',
        altLabel: 'HEX / OCT',
        altDescription: 'ALTと一緒に押すと16進・8進モードになります。',
        shiftLabel: '◀ENG / ENG▶',
        shiftDescription: '出ている答えの指数を3つずつ動かします。例: 12.3E3 ⇄ 12345E0',
      },
      {
        label: '△',
        description: 'カーソルを式の先頭へ戻します。',
        altLabel: 'DEC',
        altDescription: '10進モードに戻します。',
        shiftLabel: '▲履歴',
        shiftDescription: '1つ前に計算した式を呼び戻します。キー: ↑',
      },
      {
        label: '⌦',
        description: 'カーソルの位置にある1文字を消します。DELはカーソルの手前を消します。',
        altLabel: 'BIN',
        altDescription: '2進モードにします。',
        shiftLabel: '▼履歴',
        shiftDescription: '1つ後に計算した式へ進みます。キー: ↓',
      },
      {
        label: 'SHIFT → 1〜6',
        description: '16進数の A〜F を入力します（HEXモードのとき）。',
      },
    ],
  },
  {
    title: 'モード・操作',
    items: [
      {
        label: 'SHIFT',
        description: '青いドット付きボタンの副機能を有効にします。もう一度押すと解除します。',
      },
      {
        label: 'DEG / RAD',
        description: '角度単位を度数法(DEG)とラジアン(RAD)で切り替えます。例: sin(30)=0.5 は DEG。',
      },
      {
        label: '°′″',
        description: '度・分・秒を区切って入力します。押すたびに度→分→秒と進みます。例: 35 °′″ 41 °′″ 22 °′″ で 35度41分22秒。',
      },
      {
        label: 'STAT',
        description: '統計処理パネルを開きます。複数データから平均や標準偏差を計算できます。',
      },
      {
        label: 'AC',
        description: '入力中の式と結果を全てクリアします。エラー表示の解除にも使います。',
      },
      {
        label: 'DEL',
        description: '式の末尾1文字を削除します。例: 12+3 → 12+。',
      },
    ],
  },
  {
    title: 'メモリ',
    items: [
      { label: 'MC', description: 'メモリをクリアします。保存していた値を 0 に戻します。' },
      { label: 'MR', description: 'メモリの値を呼び出して式に挿入します。' },
      { label: 'M+', description: '現在の結果をメモリへ加算します。例: 結果10のとき M+ で +10。' },
      { label: 'M-', description: '現在の結果をメモリから減算します。例: 結果3のとき M- で -3。' },
    ],
  },
  {
    title: '三角関数',
    items: [
      {
        label: 'sin',
        description: '正弦（サイン）を計算します。例: sin(30) = 0.5（DEGモード）',
        shiftLabel: 'sin⁻¹',
        shiftDescription: '逆正弦（アークサイン）を計算します。例: sin⁻¹(0.5) = 30°',
      },
      {
        label: 'cos',
        description: '余弦（コサイン）を計算します。例: cos(60) = 0.5（DEGモード）',
        shiftLabel: 'cos⁻¹',
        shiftDescription: '逆余弦（アークコサイン）を計算します。例: cos⁻¹(0.5) = 60°',
      },
      {
        label: 'tan',
        description: '正接（タンジェント）を計算します。例: tan(45) = 1（DEGモード）',
        shiftLabel: 'tan⁻¹',
        shiftDescription: '逆正接（アークタンジェント）を計算します。例: tan⁻¹(1) = 45°',
      },
      { label: 'π', description: '円周率 π を入力します。例: 2 × π ≈ 6.28318' },
      { label: 'e', description: '自然対数の底 e を入力します。例: ln(e) = 1' },
    ],
  },
  {
    title: 'べき乗・対数',
    items: [
      {
        label: 'x²',
        description: '2乗を入力します。例: 5 x² = 25',
        shiftLabel: 'x³',
        shiftDescription: '3乗を入力します。例: 2 x³ = 8',
      },
      {
        label: '√',
        description: '平方根を計算します。例: √(9) = 3',
        shiftLabel: '∛',
        shiftDescription: '立方根を計算します。例: ∛(27) = 3',
      },
      {
        label: 'xʸ',
        description: 'べき乗を入力します。例: 2 xʸ 5 = 32',
        shiftLabel: 'ʸ√x',
        shiftDescription: 'y乗根を計算します。先に根の数を押します。例: 5 ʸ√x 32 = 2',
      },
      {
        label: 'log',
        description: '常用対数 log10 を計算します。例: log(1000) = 3',
        shiftLabel: '10^x',
        shiftDescription: '10のべき乗を計算します。例: 10^x(3) = 1000',
      },
      {
        label: 'ln',
        description: '自然対数を計算します。例: ln(e) = 1',
        shiftLabel: 'eˣ',
        shiftDescription: '指数関数 e^x を計算します。例: eˣ(1) ≈ 2.71828',
      },
      {
        label: '×10ⁿ',
        description: '科学的記数法の指数部分を入力します。例: 1.5×10³ = 1500',
      },
    ],
  },
  {
    title: '順列・組合せ',
    items: [
      { label: 'nPr', description: '順列（並べ方の数）を計算します。数の後ろに押します。例: 5 nPr 2 = 20' },
      { label: 'nCr', description: '組合せ（選び方の数）を計算します。SHIFT のあと押します。例: 5 nCr 2 = 10' },
      { label: 'x!', description: '階乗を計算します。数の後ろに押します。例: 5 x! = 120' },
      { label: 'Ans', description: '直前の計算結果を式に入れます。SHIFT のあと押します。' },
      { label: '(', description: '左かっこを入力します。式の優先順位をまとめるときに使います。' },
      { label: ')', description: '右かっこを入力します。左かっこと対で使います。' },
    ],
  },
  {
    title: '基本演算',
    items: [
      { label: '0-9', description: '数字を入力します。例: 123.45' },
      { label: '.', description: '小数点を入力します。例: 3.14' },
      { label: '±', description: '最後の数値の符号を反転します。例: 5 → -5' },
      { label: '÷', description: '除算（割り算）を入力します。例: 8 ÷ 2 = 4' },
      { label: '×', description: '乗算（掛け算）を入力します。例: 6 × 7 = 42' },
      { label: '-', description: '減算（引き算）を入力します。例: 9 - 4 = 5' },
      { label: '+', description: '加算（足し算）を入力します。例: 3 + 2 = 5' },
      { label: '=', description: '計算を実行します。結果を表示します。' },
    ],
  },
  {
    title: 'キーボードショートカット',
    items: [
      { label: '0-9', description: '数字キーでそのまま入力できます。' },
      { label: '+ - * /', description: '演算子を入力できます。÷ は /、× は * を使います。' },
      { label: 'Enter / =', description: '計算を実行します（= ボタンと同じ）。' },
      { label: 'Backspace', description: '1文字削除します（DEL と同じ）。' },
      { label: 'Escape', description: '全消去します（AC と同じ）。' },
      { label: '( ) .', description: 'かっこと小数点を入力できます。' },
    ],
  },
];

interface HelpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HelpSheet({ open, onOpenChange }: HelpSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[94vw] max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>使い方ガイド</SheetTitle>
          <SheetDescription>
            ボタンの役割と SHIFT 時の副機能をまとめています。デスクトップでは各ボタンをホバーしても説明を確認できます。
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 pb-6">
          {HELP_SECTIONS.map((section) => (
            <section key={section.title} className="space-y-2">
              <h3 className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">{section.title}</h3>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={`${section.title}-${item.label}`} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                        {item.label}
                      </span>
                      <span className="text-muted-foreground">{item.description}</span>
                    </div>
                    {item.shiftLabel && item.shiftDescription && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 font-mono font-semibold text-blue-900 dark:bg-blue-500/15 dark:text-blue-200">
                          SHIFT: {item.shiftLabel}
                        </span>
                        <span className="text-muted-foreground">{item.shiftDescription}</span>
                      </div>
                    )}
                    {item.altLabel && item.altDescription && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono font-semibold text-amber-900 dark:bg-amber-500/15 dark:text-amber-100">
                          ALT: {item.altLabel}
                        </span>
                        <span className="text-muted-foreground">{item.altDescription}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
