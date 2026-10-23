import { useEffect, useState } from 'react';
import type { Dataset } from '../types';
import textDecks from '../lib/textDecks.json';

// URL から問題集を読み込む仕組み。
//
//   /tools/anki/?import=glossary
//
// 用語集(https://koukou-jouhou.org/glossary/)の各ページに置いた
// 「覚える君で覚える」ボタンから来る。先生が生徒にこのURLを配ることもできる。
//
// **クエリで任意のURLを受け取らない。** `?import=<URL>` の形にすると、
// 外部サイトのJSONを読み込ませる踏み台にできてしまう。
// ここでは合言葉→固定URLの対応表だけを持ち、表に無い値は黙って無視する。

// 読み物テキスト（/it-text/）の章ごとの問題集は scripts/build-exam-glossary.mjs が textDecks.json に書き出す。
// 合言葉は it-text-<単元>-<章>-ip（ITパスポートの範囲）/ -fe（基本情報まで）
const DECKS: Record<string, { url: string; label: string }> = {
	glossary: {
		url: '/glossary/anki-dataset.json',
		label: '情報I用語集',
	},
	...textDecks,
};

export type DeckKey = string;

export type DeckLinkState =
	| { status: 'idle' }
	| { status: 'loading'; label: string }
	| { status: 'done'; label: string; datasetId: string; cardCount: number }
	| { status: 'error'; label: string; message: string };

function readDeckKey(): DeckKey | null {
	if (typeof window === 'undefined') return null;
	const key = new URLSearchParams(window.location.search).get('import');
	return key && Object.hasOwn(DECKS, key) ? key : null;
}

/**
 * @param ready       IndexedDB の準備ができているか
 * @param syncDataset 進み具合を消さずに入れ替える版。**importDataset を渡さないこと。**
 *                    そちらは読み直すたびに復習の履歴を消してしまう
 * @param onDone      取り込み後に一覧を作り直す
 */
export function useDeckLink(
	ready: boolean,
	syncDataset: (input: Dataset | string) => Promise<{ datasetId: string; cardCount: number }>,
	onDone: () => Promise<void> | void
): DeckLinkState {
	const [state, setState] = useState<DeckLinkState>({ status: 'idle' });

	useEffect(() => {
		if (!ready) return;
		const key = readDeckKey();
		if (!key) return;

		const deck = DECKS[key];
		let cancelled = false;

		(async () => {
			setState({ status: 'loading', label: deck.label });
			try {
				const res = await fetch(deck.url);
				if (!res.ok) throw new Error(`読み込めませんでした（${res.status}）`);
				const summary = await syncDataset(await res.text());
				if (cancelled) return;
				await onDone();
				if (cancelled) return;
				setState({
					status: 'done',
					label: deck.label,
					datasetId: summary.datasetId,
					cardCount: summary.cardCount,
				});
			} catch (err) {
				if (cancelled) return;
				setState({
					status: 'error',
					label: deck.label,
					message: err instanceof Error ? err.message : '読み込みに失敗しました',
				});
			} finally {
				// 同じURLを再読み込みしても二重に取り込まないよう、印を消す。
				// 履歴を汚さないので戻るボタンの動きも変わらない
				if (!cancelled && typeof window !== 'undefined') {
					const url = new URL(window.location.href);
					url.searchParams.delete('import');
					window.history.replaceState({}, '', url.toString());
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [ready]);

	return state;
}
