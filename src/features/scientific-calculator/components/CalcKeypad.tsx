import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CalcButton from './CalcButton';
import { DEFAULT_THEME, type KeypadTheme } from '../keypad-themes';
import type { AngleMode, ButtonDef } from '../types';

export const BUTTON_ROWS: ButtonDef[][] = [
  [
    {
      label: 'ALT',
      action: 'toggle-alt',
      variant: 'mode',
      description: '黄色の字で書いてある副機能を有効にします。もう一度押すと解除します。',
    },
    {
      label: '△',
      // △ が「1つ前に打った式」。iPad 版と同じ割り当てにしてある。
      // 中が抜けている △ が「前に打ったものを出す」ほうが、押した見た目と合う。
      action: 'history-up',
      altLabel: 'DEC',
      altAction: 'base:DEC',
      shiftLabel: '▲先頭',
      shiftAction: 'cursor-home',
      variant: 'action',
      description: '1つ前に計算した式を呼び戻します。',
      altDescription: '10進モードに戻します。',
      shiftDescription: 'カーソルを式の先頭へ移します。',
    },
    {
      label: '◀',
      action: 'cursor-left',
      altLabel: 'HEX',
      altAction: 'base:HEX',
      shiftLabel: '◀ENG',
      shiftAction: 'eng-left',
      variant: 'action',
      description: 'カーソルを1つ左へ移します。キー: ←',
      altDescription: '16進モードにします。A〜FはSHIFTと数字キーで入れます。',
      shiftDescription: '答えの指数を3つ下げて表示します（12.3E3 → 12345E0）。',
    },
    {
      label: '▶',
      action: 'cursor-right',
      altLabel: 'OCT',
      altAction: 'base:OCT',
      shiftLabel: 'ENG▶',
      shiftAction: 'eng-right',
      variant: 'action',
      description: 'カーソルを1つ右へ移します。キー: →',
      altDescription: '8進モードにします。',
      shiftDescription: '答えの指数を3つ上げて表示します。',
    },
    {
      label: '⌦',
      action: 'del-forward',
      altLabel: 'BIN',
      altAction: 'base:BIN',
      shiftLabel: '▼次の式',
      shiftAction: 'history-down',
      variant: 'action',
      description: 'カーソルの位置にある1文字を消します。DELはカーソルの手前を消します。',
      altDescription: '2進モードにします。',
      shiftDescription: '1つ後に計算した式へ進みます。',
    },
  ],
  [
    {
      label: 'SHIFT',
      action: 'toggle-shift',
      altLabel: 'FSE',
      altAction: 'cycle-format',
      altDescription: '表示形式を Norm → Fix → Sci → Eng の順に切り替えます。',
      variant: 'mode',
      description: '青いドットが付いたボタンの副機能を有効にします。もう一度押すと解除します。',
    },
    {
      label: 'DEG',
      shiftLabel: 'RAD',
      action: 'toggle-angle',
      altLabel: 'DRG',
      altAction: 'cycle-angle',
      altDescription: '角度単位を DEG → RAD → GRAD の順に切り替えます。',
      variant: 'mode',
      description: '角度単位を度数法(DEG)とラジアン(RAD)で切り替えます。三角関数の結果に影響します。',
    },
    {
      label: '°′″',
      action: 'dms',
      altLabel: 'H:M:S',
      altAction: 'dms-view',
      altDescription: '答えを度分秒の形と十進の形で切り替えて表示します。',
      variant: 'mode',
      description:
        '度・分・秒を区切って入力します。押すたびに度→分→秒と進みます。例: 85 °′″ 29 °′″ 17 °′″ で 85度29分17秒',
    },
    {
      label: 'STAT',
      action: 'toggle-stats',
      altLabel: 'DIGS',
      altAction: 'digits',
      altDescription: '表示する桁数を決めます（Fixは小数点以下、Sci/Engは有効数字）。',
      variant: 'mode',
      description: '統計パネルを開閉します。データ数・平均・標準偏差を計算できます。',
    },
    {
      label: 'AC',
      action: 'ac',
      variant: 'action',
      description: '入力中の式と結果を全てクリアします。エラー表示も解除します。',
    },
  ],
  [
    {
      label: 'MC',
      action: 'mc',
      altLabel: 'Const',
      altAction: 'consts',
      variant: 'memory',
      description: 'メモリをクリアします。',
      altDescription: '光速や重力加速度などの物理定数を一覧から選んで入れます。',
    },
    {
      label: 'MR',
      action: 'mr',
      altLabel: 'M',
      altAction: 'm',
      variant: 'memory',
      description: 'メモリの値を呼び出して式に挿入します。',
      altDescription: 'メモリの値を「M」という記号のまま式に入れます。',
    },
    {
      label: 'M+',
      action: 'm+',
      variant: 'memory',
      description: '現在の結果をメモリへ加算します。例: 結果10のとき M+ でメモリに +10。',
    },
    {
      label: 'M-',
      action: 'm-',
      variant: 'memory',
      description: '現在の結果をメモリから減算します。例: 結果3のとき M- でメモリから -3。',
    },
    {
      label: 'DEL',
      action: 'del',
      altLabel: '(−)',
      altAction: 'neg',
      variant: 'action',
      description: 'カーソルの手前の1文字を削除します。キー: Backspace / Delete',
      altDescription: 'これから打つ数の符号をマイナスにします。例: (−)3 で −3',
    },
  ],
  [
    {
      label: 'sin',
      shiftLabel: 'sin⁻¹',
      action: 'sin(',
      shiftAction: 'asin(',
      variant: 'function',
      description: '正弦（サイン）を計算します。例: sin(30) = 0.5（DEGモード）',
      shiftDescription: '逆正弦（アークサイン）を計算します。例: sin⁻¹(0.5) = 30°',
    },
    {
      label: 'cos',
      shiftLabel: 'cos⁻¹',
      action: 'cos(',
      shiftAction: 'acos(',
      variant: 'function',
      description: '余弦（コサイン）を計算します。例: cos(60) = 0.5（DEGモード）',
      shiftDescription: '逆余弦（アークコサイン）を計算します。例: cos⁻¹(0.5) = 60°',
    },
    {
      label: 'tan',
      shiftLabel: 'tan⁻¹',
      action: 'tan(',
      shiftAction: 'atan(',
      variant: 'function',
      description: '正接（タンジェント）を計算します。例: tan(45) = 1（DEGモード）',
      shiftDescription: '逆正接（アークタンジェント）を計算します。例: tan⁻¹(1) = 45°',
    },
    {
      label: 'π',
      action: 'pi',
      variant: 'function',
      description: '円周率 π を入力します。例: 2×π ≈ 6.28318',
    },
    {
      label: 'e',
      action: 'e',
      variant: 'function',
      description: '自然対数の底 e を入力します。例: ln(e) = 1',
    },
  ],
  [
    {
      label: 'x²',
      shiftLabel: 'x³',
      action: '^2',
      shiftAction: '^3',
      altLabel: 'x⁻¹',
      altAction: 'inv(',
      altDescription: '逆数を計算します。例: 4 x⁻¹ = 0.25',
      variant: 'function',
      description: '2乗を入力します。例: 5 x² = 25',
      shiftDescription: '3乗を入力します。例: 2 x³ = 8',
    },
    {
      label: '√',
      shiftLabel: '∛',
      action: 'sqrt(',
      shiftAction: 'cbrt(',
      altLabel: 'Abs',
      altAction: 'abs(',
      altDescription: '絶対値を計算します。例: Abs((−)8) = 8',
      variant: 'function',
      description: '平方根を計算します。例: √(9) = 3',
      shiftDescription: '立方根を計算します。例: ∛(27) = 3',
    },
    {
      label: 'xʸ',
      shiftLabel: 'ʸ√x',
      action: '^(',
      shiftAction: 'xroot(',
      altLabel: 'Mod',
      altAction: 'mod(',
      altDescription: '割った余りを計算します。例: Mod(17,5) = 2',
      variant: 'function',
      description: 'べき乗を入力します。例: 2 xʸ 5 = 32',
      shiftDescription: 'y乗根を計算します。先に根の数を押します。例: 5 ʸ√x 32 = 2',
    },
    {
      label: 'log',
      shiftLabel: '10^x',
      action: 'log(',
      shiftAction: 'pow10(',
      altLabel: 'Pol',
      altAction: 'pol(',
      altDescription: '直交座標を極座標へ。例: Pol(3,4) → r=5、θ=53.13°',
      variant: 'function',
      description: '常用対数（log10）を計算します。例: log(1000) = 3',
      shiftDescription: '10のべき乗を計算します。例: 10^x(3) = 1000',
    },
    {
      label: 'ln',
      shiftLabel: 'eˣ',
      action: 'ln(',
      shiftAction: 'exp(',
      altLabel: 'Rec',
      altAction: 'rec(',
      altDescription: '極座標を直交座標へ。例: Rec(2,60) → x=1、y=1.732',
      variant: 'function',
      description: '自然対数を計算します。例: ln(e) = 1',
      shiftDescription: '指数関数 e^x を計算します。例: eˣ(1) ≈ 2.71828',
    },
  ],
  [
    {
      label: 'nPr',
      shiftLabel: 'nCr',
      action: 'nPr(',
      shiftAction: 'nCr(',
      variant: 'function',
      description: '順列（並べ方の数）を計算します。数の後ろに押します。例: 5 nPr 2 = 20',
      shiftDescription: '組合せ（選び方の数）を計算します。数の後ろに押します。例: 5 nCr 2 = 10',
    },
    {
      label: 'x!',
      shiftLabel: 'Ans',
      action: 'fact(',
      shiftAction: 'ans',
      variant: 'function',
      description: '階乗を計算します。数の後ろに押します。例: 5 x! = 120',
      shiftDescription: '直前の計算結果を式に入れます。',
    },
    {
      label: '×10ⁿ',
      action: 'exp10',
      variant: 'function',
      description: '科学的記数法の指数部分を入力します。例: 1.5×10³ = 1500',
    },
    {
      label: '(',
      action: '(',
      variant: 'operator',
      description: '左かっこを入力します。キー: (',
    },
    {
      label: ')',
      action: ')',
      variant: 'operator',
      description: '右かっこを入力します。キー: )',
    },
  ],
  [
    { label: '7', action: '7', variant: 'digit', description: '数字 7 を入力します。キー: 7' },
    { label: '8', action: '8', variant: 'digit', description: '数字 8 を入力します。キー: 8' },
    { label: '9', action: '9', variant: 'digit', description: '数字 9 を入力します。キー: 9' },
    { label: '÷', action: '/', variant: 'operator', description: '除算（割り算）。キー: /' },
    { label: '×', action: '*', variant: 'operator', description: '乗算（掛け算）。キー: * または x' },
  ],
  [
    {
      label: '4',
      action: '4',
      shiftLabel: 'D',
      shiftAction: 'D',
      variant: 'digit',
      description: '数字 4 を入力します。キー: 4',
      shiftDescription: '16進数の D を入力します（HEXモードのとき）。',
    },
    {
      label: '5',
      action: '5',
      shiftLabel: 'E',
      shiftAction: 'E',
      variant: 'digit',
      description: '数字 5 を入力します。キー: 5',
      shiftDescription: '16進数の E を入力します（HEXモードのとき）。',
    },
    {
      label: '6',
      action: '6',
      shiftLabel: 'F',
      shiftAction: 'F',
      variant: 'digit',
      description: '数字 6 を入力します。キー: 6',
      shiftDescription: '16進数の F を入力します（HEXモードのとき）。',
    },
    { label: '-', action: '-', variant: 'operator', description: '減算（引き算）。キー: -' },
    { label: '+', action: '+', variant: 'operator', description: '加算（足し算）。キー: +' },
  ],
  [
    {
      label: '1',
      action: '1',
      shiftLabel: 'A',
      shiftAction: 'A',
      variant: 'digit',
      description: '数字 1 を入力します。キー: 1',
      shiftDescription: '16進数の A を入力します（HEXモードのとき）。',
    },
    {
      label: '2',
      action: '2',
      shiftLabel: 'B',
      shiftAction: 'B',
      variant: 'digit',
      description: '数字 2 を入力します。キー: 2',
      shiftDescription: '16進数の B を入力します（HEXモードのとき）。',
    },
    {
      label: '3',
      action: '3',
      shiftLabel: 'C',
      shiftAction: 'C',
      variant: 'digit',
      description: '数字 3 を入力します。キー: 3',
      shiftDescription: '16進数の C を入力します（HEXモードのとき）。',
    },
    {
      label: '=',
      action: '=',
      variant: 'operator',
      wide: true,
      description: '計算を実行します。キー: Enter または =',
    },
  ],
  [
    { label: '0', action: '0', variant: 'digit', wide: true, description: '数字 0 を入力します。キー: 0' },
    {
      label: '±',
      action: 'negate',
      variant: 'action',
      wide: true,
      description: '最後の数値の符号を反転します。例: 5 → -5',
    },
    { label: '.', action: '.', variant: 'digit', description: '小数点を入力します。キー: .' },
  ],
];

interface CalcKeypadProps {
  shiftActive: boolean;
  /** ALT（第2機能）。ドリル側からは渡さないので既定は false。 */
  altActive?: boolean;
  /** 親の高さいっぱいにキーを広げる（全画面の電卓で使う）。既定は false。 */
  fill?: boolean;
  /** キーの配色。ドリル側からは渡さないので既定の「おちつき」になる。 */
  theme?: KeypadTheme;
  angleMode: AngleMode;
  onPress: (action: string) => void;
  highlightedAction?: string;
}

export default function CalcKeypad({
  shiftActive,
  altActive = false,
  fill = false,
  theme = DEFAULT_THEME,
  angleMode,
  onPress,
  highlightedAction,
}: CalcKeypadProps) {
  return (
    <div className={fill ? 'flex h-full min-h-0 flex-col gap-1.5' : 'space-y-1.5'}>
      {BUTTON_ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={
            fill
              ? 'grid min-h-11 flex-1 grid-cols-5 gap-1.5'
              : 'grid grid-cols-5 gap-1.5'
          }
        >
          {row.map((button, buttonIndex) => {
            const normalizedButton =
              button.action === 'toggle-angle'
                ? { ...button, label: angleMode, shiftLabel: undefined }
                : button;
            const tooltipText = altActive && button.altDescription
              ? button.altDescription
              : shiftActive && button.shiftDescription
                ? button.shiftDescription
                : button.description;

            return (
              <Tooltip key={`${rowIndex}-${buttonIndex}-${button.action}`} delayDuration={500}>
                <TooltipTrigger asChild>
                  <CalcButton
                    button={normalizedButton}
                    shiftActive={shiftActive}
                    altActive={altActive}
                    fill={fill}
                    theme={theme}
                    onPress={onPress}
                    highlighted={
                      // highlightedAction を渡さない使い方（単体の関数電卓）では
                      // どのキーも光らせない。この判定を省くと、SHIFT 中に
                      // 副機能を持たないキーの shiftAction(undefined) と
                      // highlightedAction(undefined) が一致して全部光る。
                      highlightedAction !== undefined &&
                      (normalizedButton.action === highlightedAction ||
                        (shiftActive && normalizedButton.shiftAction === highlightedAction))
                    }
                  />
                </TooltipTrigger>
                {tooltipText && (
                  <TooltipContent
                    side="top"
                    // ツールチップは1つ上の行のキーに重なる。pointer-events を切らないと、
                    // 上のキー(ALTなど)がクリックを受け取れなくなる。
                    // Radix が開いている間 style="pointer-events:auto" を直接書くので、
                    // クラスでは勝てない。インラインの style で上書きする。
                    style={{ pointerEvents: 'none' }}
                    className="max-w-[200px] text-center text-xs leading-snug"
                  >
                    {tooltipText}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      ))}
    </div>
  );
}
