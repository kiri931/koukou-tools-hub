import type { NewCardBudget } from './lib/newCardLimit';

export type Grade = 1 | 2 | 3 | 4; // Unknown / Hard / Good / Easy
export type TabId = 'home' | 'study' | 'dashboard' | 'data' | 'settings';

export interface Card {
  id: string;
  topic?: string;
  question: string;
  answers: string[];
  explanation?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Dataset {
  schema: string;
  datasetId: string;
  title: string;
  description?: string;
  tags?: string[];
  cards: Card[];
}

export interface CardState {
  cardId: string;
  datasetId: string;
  stability: number;
  difficulty: number;
  lastReviewAt: number | null;
  dueAt: number;
  reps: number;
  lapses: number;
}

export interface Review {
  cardId: string;
  datasetId: string;
  grade: Grade;
  responseMs: number;
  reviewedAt: number;
}

export interface Confusion {
  pairKey: string;
  cardIdA: string;
  cardIdB: string;
  count: number;
  datasetId: string;
}

export interface AppSettings {
  targetRetentionRate: number;
  examDate: string | null;
  /** 新しいカード（まだ一度も答えていないカード）を1問題集あたり1日に出す枚数。0なら復習だけ */
  newCardsPerDay: number;
}

export interface DatasetSummary {
  schema: string;
  datasetId: string;
  title: string;
  description?: string;
  tags?: string[];
  cardCount: number;
  updatedAt: number;
}

export interface DueCount {
  /** いま出せる枚数（期日の来た復習＋今日の上限内の新しいカード） */
  overdue: number;
  today: number;
  /** overdue のうち、新しいカード（上限で切ったあと） */
  newCards: number;
}

export interface StudyQueueItem {
  card: Card;
  cardState: CardState | null;
}

export interface AnswerCheckResult {
  isCorrect: boolean;
  matchedAnswer: string | null;
  normalizedInput: string;
}

export interface TopConfusionRow {
  datasetId: string;
  pairKey: string;
  cardIdA: string;
  cardIdB: string;
  count: number;
  labelA: string;
  labelB: string;
}

export interface DashboardStats {
  due: DueCount;
  avgRetrievability: number | null;
  topConfusions: TopConfusionRow[];
}

export interface AppBackup {
  version: 1;
  exportedAt: string;
  datasets: DatasetSummary[];
  cards: Array<Card & { datasetId: string; dbKey: string }>;
  cardState: Array<CardState & { id: string }>;
  reviews: Array<Review & { id?: number }>;
  confusions: Array<Confusion & { id: string }>;
  settings: { id: string; value: AppSettings }[];
}

export type StudySessionStatus = 'idle' | 'loading' | 'question' | 'reviewing' | 'done';

export interface StudySessionState {
  status: StudySessionStatus;
  datasetId: string | null;
  queue: StudyQueueItem[];
  /** 選択肢の誤答を作るための候補。データセット全体のカード（期限切れに限らない） */
  choicePool: StudyQueueItem[];
  index: number;
  total: number;
  correctCount: number;
  incorrectCount: number;
  current: StudyQueueItem | null;
  /** いまの問題の出題モード。初めて解くカードは選択、2回目以降は記述 */
  mode: 'choice' | 'input';
  /** 選択モードのときの選択肢（表示ラベル）。記述なら空 */
  choices: string[];
  /** 出題用の問題文。答えが混ざっていれば伏せ字にしたもの */
  maskedQuestion: string;
  /** この問で開いたヒントの段階数。問題が変わるたび 0 に戻る */
  hintLevel: number;
  /** ヒントを1段階でも開いたか（採点の上限に使う） */
  usedHint: boolean;
  userAnswer: string;
  isCorrect: boolean | null;
  matchedAnswer: string | null;
  responseMs: number | null;
  submittedAt: number | null;
  error: string | null;
  /** 新しいカードの今日の枠。取れないとき（古い呼び出し方）は null */
  newBudget: NewCardBudget | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  targetRetentionRate: 0.9,
  examDate: null,
  newCardsPerDay: 20,
};
