// このサイト(ツール集)に並ぶツールの一覧。
//
// **メインサイト(koukou-jouhou)の src/lib/site-links.ts が唯一の出どころで、
// ここはその写し。**　以前はここだけが独自の16件を持っていて、
// 覚える君を使っている生徒がヘッダーから他のツール(作戦盤・フローチャート・
// 漢字ドリル・なぞり書き等)に辿り着けなかった。両方を同じ中身にしてある。
//
// **メインサイトでツールを増やしたら、ここにも同じ1件を足すこと。**
// リンクはサイトのルート基準(`/flowchart/` など)で書く。同一ドメインなので
// 絶対URLにする必要はない。
//
// 色の持ち方の注意(メインサイト側と同じ):
// Tailwind のクラス名を `bg-${color}-500/10` のように動的に組み立てると
// 静的走査から漏れて CSS が出力されず、色が消える。だから16進1色を持つ。

export interface SiteLink {
	href: string;
	/** メニューとカードの見出し */
	label: string;
	/** カードの説明文。メニューには出ない */
	desc: string;
	/** アイコンのアクセント色(16進)。文字色は `.icon-chip` が color-mix で作る */
	accent: string;
	/** カードのアイコン(インラインSVG) */
	icon: string;
}

export interface SiteLinkSection {
	label: string;
	/** セクションの一行説明。見出しの下に出る */
	desc: string;
	items: SiteLink[];
}

export const sections: SiteLinkSection[] = [
	{
		label: 'まなぶ',
		desc: '生徒が自分で使う学習ツール',
		items: [
			{
				href: '/kanji-check/',
				label: '漢字ドリル（テストと練習）',
				desc: '出す漢字を選ぶと、小テストと練習用ドリルのQRがまとめてできます。手書きを自動採点し、テストの結果は先生に集まります。書き順のなぞり練習も。',
				accent: '#f43f5e',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>',
			},
			{
				href: '/kanji-check/eigo-test/',
				label: '英単語テスト（先生用）',
				desc: '英単語を1マス1文字ずつ手書きさせる小テスト。QRを配るだけで自動採点され、結果が先生に集まります。',
				bg: '#7c3aed',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>',
			},
			{
				href: '/tools/typing-japanese/',
				label: 'タイピング練習',
				desc: 'ひらがなのローマ字入力を練習するタイピングゲーム。',
				accent: '#0ea5e9',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="M6 8h.01" /><path d="M10 8h.01" /><path d="M14 8h.01" /><path d="M18 8h.01" /><path d="M5 12h.01" /><path d="M9 12h.01" /><path d="M13 12h.01" /><path d="M17 12h.01" /><path d="M6 16h12" /></svg>',
			},
			{
				href: '/tools/anki/',
				label: '覚える君',
				desc: '短答入力×分散復習で効率的に暗記できる学習ツール。復習の間隔を決める仕組み（FSRS）も中で解説しています。',
				accent: '#22c55e',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-3-3" /><path d="M19 5a3 3 0 1 0-3-3" /><path d="M5 11a3 3 0 1 0-3-3" /><path d="M12 11a3 3 0 1 0-3-3" /><path d="M19 11a3 3 0 1 0-3-3" /><path d="M5 17a3 3 0 1 0-3-3" /><path d="M12 17a3 3 0 1 0-3-3" /><path d="M19 17a3 3 0 1 0-3-3" /><path d="M12 23a3 3 0 1 0-3-3" /><path d="M6 8h3" /><path d="M15 8h1" /><path d="M6 14h10" /><path d="M12 20v-1" /></svg>',
			},
			{
				href: '/tools/calc-drill/',
				label: '計算技術検定ドリル',
				desc: '次に押すべきキーをガイドしながら、計算技術検定3級・4級の手順を練習できます。',
				accent: '#f59e0b',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2.5" width="16" height="19" rx="2" /><path d="M8 6.5h8" /><path d="M8 11.5h2" /><path d="M12 11.5h2" /><path d="M16 11.5h0.01" /><path d="M8 15.5h2" /><path d="M12 15.5h2" /><path d="M16 15.5h0.01" /><path d="M8 19h8" /></svg>',
			},
			{
				href: '/study/graphic-design/',
				label: 'グラフィックデザイン検定 対策',
				desc: '企画・写真・編集レイアウト・写真製版・印刷・製本の6分野の解説と用語辞典。級ごとの出題傾向も、実施結果をもとにまとめています。',
				bg: '#ec4899',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H13a2 2 0 0 1 0-4h4a4 4 0 0 0 4-4 6 6 0 0 0-6-6Z" /><circle cx="7.5" cy="10.5" r="1" /><circle cx="10.5" cy="6.5" r="1" /><circle cx="15" cy="7.5" r="1" /></svg>',
			},
			{
				href: '/tools/gd-kentei/',
				label: 'グラフィックデザイン検定ドリル',
				desc: '6分野の4択問題を、分野と級で絞って1問ずつ解けます。まちがえた問題だけをやり直せます。',
				bg: '#d946ef',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h4" /><path d="M7 13h6" /><path d="m15.5 15.5 2 2 3.5-3.5" /></svg>',
			},
			{
				href: '/study/equation-transformation/',
				label: '等式の変形テスト',
				desc: '等式の変形をランダム出題で練習できる択一式テスト。採点・解説・印刷に対応。',
				accent: '#10b981',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16" /><path d="M8 7h8" /><path d="M6 12h12" /><path d="M10 4v6" /><path d="M14 14v6" /></svg>',
			},
			{
				href: '/tools/scientific-calculator/',
				label: '関数電卓',
				desc: '検定向けの四則演算・三角関数・対数・nPr/nCr・統計処理をまとめた関数電卓。',
				accent: '#8b5cf6',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2.5" width="16" height="19" rx="2" /><path d="M8 6.5h8" /><path d="M8 10.5h2" /><path d="M12 10.5h2" /><path d="M16 10.5h0.01" /><path d="M8 14.5h2" /><path d="M12 14.5h2" /><path d="M16 14.5h0.01" /><path d="M8 18.5h8" /></svg>',
			},
			{
				href: '/network-rescue/',
				label: 'ネットワークレスキュー',
				desc: '学校ネットワークの障害を復旧しながら情報Iのネットワーク分野を学ぶシミュレーションゲーム。',
				accent: '#6366f1',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="9" y="14" width="6" height="6" rx="1" /><path d="M7 10v2a2 2 0 0 0 2 2h1" /><path d="M17 10v2a2 2 0 0 0-2 2h-1" /></svg>',
			},
			{
				href: '/shooting/',
				label: 'JavaScript シューティング',
				desc: 'シューティングゲーム形式でJavaScriptを楽しく学べる学習アプリ。',
				accent: '#eab308',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>',
			},
			{
				href: '/visualization-study/',
				label: '可視化スタディ',
				desc: 'データ可視化の考え方と作り方を学べる学習ページ。',
				accent: '#f43f5e',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 5-6" /><circle cx="7" cy="14" r="1.5" /><circle cx="11" cy="10" r="1.5" /><circle cx="14" cy="13" r="1.5" /><circle cx="19" cy="7" r="1.5" /></svg>',
			},
			{
				href: '/dncl-tracer/',
				label: 'プログラムのなぞり書き',
				desc: '共通テスト「情報I」のプログラムの書き方を、1行ずつ動かして変数の変化を確かめられます。',
				accent: '#6366f1',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 8 2 12 6 16" /><polyline points="18 8 22 12 18 16" /><line x1="14" y1="4" x2="10" y2="20" /></svg>',
			},
			{
				href: '/algo-cards/',
				label: 'てじゅんカード',
				desc: '探索や整列の手順を、コードを書かずに並べかえて覚えます。並べたとおりに箱が動く様子も見られます。',
				accent: '#14b8a6',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="4" rx="1" /><rect x="3" y="10" width="18" height="4" rx="1" /><rect x="3" y="16" width="18" height="4" rx="1" /><path d="M7 6h.01M7 12h.01M7 18h.01" /></svg>',
			},
			{
				href: '/graph-critique/',
				label: 'グラフのココがおかしい',
				desc: '軸の切り取りや3D円グラフなど、データの見せ方で印象が変わる例を8問で確かめます。',
				accent: '#f97316',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="13" y="6" width="3" height="12" /><path d="M18 3l3 3-3 3" /></svg>',
			},
		],
	},
	{
		label: '授業でつかう',
		desc: '先生が授業や校務で使う道具',
		items: [
			{
				href: '/tools/presentation/',
				label: 'プレゼンガイド',
				desc: 'タイマー・評価ルーブリック・印刷フォームをまとめた授業用ツール。',
				accent: '#f59e0b',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18v12H3z" /><path d="M8 20h8" /><path d="M12 16v4" /><path d="M7 8h10" /><path d="M7 11h6" /></svg>',
			},
			{
				href: '/tools/face-mosaic/',
				label: '顔モザイクツール',
				desc: '画像内の顔を自動検出し、モザイク・ぼかし・黒塗りで加工できます。',
				accent: '#6366f1',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>',
			},
			{
				href: '/sekigae/',
				label: '席替えアプリ',
				desc: '名簿作成から座席配置、席替え、PDF/CSVでの共有まで。iPhone・iPad向けアプリとブラウザ版があります。',
				accent: '#10b981',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="6" height="6" x="3" y="4" rx="1" /><rect width="6" height="6" x="15" y="4" rx="1" /><rect width="6" height="6" x="3" y="14" rx="1" /><rect width="6" height="6" x="15" y="14" rx="1" /></svg>',
			},
			{
				href: '/general-comments/',
				label: '所見作成ツール',
				desc: '通知表の行動所見・学習所見・総合所見を、クラス単位でまとめて作れます。入力内容は端末の中だけに残ります。',
				accent: '#06b6d4',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 10h8" /><path d="M8 14h6" /></svg>',
			},
			{
				href: '/tools/time-schedule/',
				label: 'タイムスケジューラ',
				desc: '円形クロックでタスクを時間配分し、タイマーで進行を管理できます。',
				accent: '#a855f7',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>',
			},
			{
				href: '/flowchart/',
				label: 'フローチャート・手順表エディタ',
				desc: 'Mermaidコードで業務フローチャート、簡易記法で手順表を作成し、PNG/SVG/PDFで書き出せます。',
				accent: '#6366f1',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="8" x="3" y="3" rx="1" /><path d="M7 11v4a2 2 0 0 0 2 2h4" /><rect width="8" height="8" x="13" y="13" rx="1" /></svg>',
			},
			{
				href: '/collision-checker/',
				label: '時間割衝突チェッカー(デモ版)',
				desc: '教員・クラス・教室の重複を自動検出する時間割作成ツールのブラウザデモ。入力内容はこの端末にのみ保存されます。',
				accent: '#f59e0b',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>',
			},
			{
				href: '/delay-camera/',
				label: '遅延カメラ(フォーム確認)',
				desc: 'カメラ映像を数十秒遅らせて表示し、自分の動作フォームを一人で確認できます。ループ再生・クリップ保存にも対応。',
				accent: '#0ea5e9',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>',
			},
			{
				href: '/tactics-board/',
				label: '作戦盤',
				desc: 'バスケ・サッカー・バレーなど13種のコートで使える作戦盤。選手の動きを1手ずつ記録して軌跡つきで再生でき、動画・GIF・共有リンクでチームに配れます。',
				accent: '#14b8a6',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M12 3v18" /><circle cx="12" cy="12" r="2.5" /><path d="M6 17c1.5-3 3-4.5 5-4.5" stroke-dasharray="2 2" /></svg>',
			},
		],
	},
	{
		label: 'PDF',
		desc: 'PDFを読む・つくる・まとめる',
		items: [
			{
				href: '/pdf-viewer/',
				label: 'PDF参照モード',
				desc: 'ITパスポート等の試験問題をPDFと照合して学習できます。',
				accent: '#3b82f6',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15h6" /><path d="M9 11h6" /></svg>',
			},
			{
				href: '/tools/pdf-merge/',
				label: 'PDFマージ',
				desc: '複数のPDFファイルを並び替えて1つに結合できます。',
				accent: '#f97316',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1" /><path d="M16 16a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1" /><path d="M21 6a2 2 0 0 0-.586-1.414l-2-2A2 2 0 0 0 17 2h-3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1z" /></svg>',
			},
			{
				href: '/large-format-printer/',
				label: '大判プリント PDF作成',
				desc: '大判プリンタ向けのPDFを作成・編集できるツール。',
				accent: '#14b8a6',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" /></svg>',
			},
		],
	},
	{
		label: 'しらべる',
		desc: '仕組みや学習法の解説',
		items: [
			{
				href: '/glossary/',
				label: '情報I用語集',
				desc: '1つの用語に全力解説。背景・歴史・なぜ使われるようになったかまで掘り下げます。',
				accent: '#14b8a6',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><path d="M9 7h6" /><path d="M9 11h4" /></svg>',
			},
			{
				href: '/guides/joho1-kyotsu-test/',
				label: '共通テスト「情報I」対策',
				desc: '2025年から必須科目になった情報Iの範囲と対策の進め方を整理します。',
				accent: '#8b5cf6',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15.5" /><path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h5" /><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /></svg>',
			},
			{
				href: '/guides/data-digitization/',
				label: 'データのデジタル化まとめ',
				desc: '標本化・量子化・符号化など、データがデジタルになる仕組みを整理します。',
				accent: '#06b6d4',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /><path d="M8 3v18" /><path d="M16 3v18" /></svg>',
			},
			{
				href: '/guides/it-passport-study-method/',
				label: 'ITパスポート学習法',
				desc: '過去問PDFの活用、復習の進め方、合格までの学習手順を整理します。',
				accent: '#3b82f6',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" /><path d="M8 6h8" /><path d="M8 10h8" /></svg>',
			},
			{
				href: '/guides/calc-drill-exam-guide/',
				label: '計算技術検定とは?',
				desc: '検定の概要、出題形式、電卓操作の練習ポイントをまとめています。',
				accent: '#f59e0b',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2.5" width="16" height="19" rx="2" /><path d="M8 6.5h8" /><path d="M8 11.5h2" /><path d="M12 11.5h2" /><path d="M16 11.5h0.01" /><path d="M8 15.5h2" /><path d="M12 15.5h2" /><path d="M16 15.5h0.01" /><path d="M8 19h8" /></svg>',
			},
			{
				href: '/guides/presentation-rubric-guide/',
				label: 'プレゼン評価ルーブリック',
				desc: '発表評価の観点やルーブリックの作り方を授業向けにまとめています。',
				accent: '#f43f5e',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18v12H3z" /><path d="M8 20h8" /><path d="M12 16v4" /><path d="m8 10 2 2 4-5" /><path d="M15 12h2" /></svg>',
			},
			{
				href: '/ai-kyouiku-lab/',
				label: 'AI×教育 研究まとめラボ',
				desc: '生成AIと教育に関する国内外の研究知見(効果・リスク・活用事例)を教育者向けに定期更新でまとめています。',
				accent: '#14b8a6',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>',
			},
		],
	},
	{
		label: 'サポート',
		desc: '使い方の案内と、ご意見の窓口',
		items: [
			{
				href: '/sekigae/support/',
				label: '席替えアプリ サポート',
				desc: '席替えアプリの使い方、よくある質問、利用規約。アプリ本体は「授業でつかう」から開けます。',
				accent: '#10b981',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16" /><path d="M7 20V8h10v12" /><path d="M9 8V4h6v4" /><path d="M9 12h6" /></svg>',
			},
			{
				href: '/support/feature-request/',
				label: '機能リクエスト',
				desc: '改善提案や追加してほしい機能をフォームから送信できます。',
				accent: '#0ea5e9',
				icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h8" /><path d="M8 13h5" /></svg>',
			},
		],
	},
];

/** 末尾スラッシュの有無でリンクが別物にならないようにそろえる */

// ---------------------------------------------------------------- 絞り込み用の属性
//
// 一覧から「自分向けか」「データが外に出るか」を見分けられるようにする。
// （画面くらべ 20260801-tools-index / 2026-08-01 採用）
//
// **送信するものにだけ印を付ける。** 32件すべてに「端末の中だけ」と書くと、
// 1つでも見落とせば嘘になる。印が無い＝端末の中だけ、を一覧の先頭で説明する。

/** 主にどちらが使うか。迷うものは 'both' にする（絞り込みで消えないほうが安全） */
export type Audience = 'student' | 'teacher' | 'both';

export const AUDIENCE_LABELS: Record<Audience, string> = {
	student: '生徒が使う',
	teacher: '先生が使う',
	both: '両方',
};

const teacherTools = new Set([
	'/tools/presentation/',
	'/tools/face-mosaic/',
	'/tools/time-schedule/',
	'/flowchart/',
	'/collision-checker/',
	'/delay-camera/',
	'/tactics-board/',
	'/large-format-printer/',
	'/sekigae/',
	'/general-comments/',
	'/guides/presentation-rubric-guide/',
]);

const bothTools = new Set([
	'/pdf-viewer/',
	'/tools/pdf-merge/',
	'/glossary/',
	'/support/feature-request/',
	'/ai-kyouiku-lab/',
	'/guides/spaced-repetition-fsrs/',
]);

/**
 * 使うときに通信するもの。**確かめられたものだけを true にしている。**
 * - 作戦盤・フローチャート: 共有リンクを作ると中身を預かる（KV）
 * - 漢字ドリル: 小テストの結果が先生に集まる
 * - 機能リクエスト: フォームの送信
 *
 * 所見作成ツールはここから外した。フォーム送信の道具だと取り違えて登録されていたが、
 * 実物は通知表の所見を作る道具で、内容は端末の中だけに残る。
 */
const sendsData = new Set([
	'/tactics-board/',
	'/flowchart/',
	'/kanji-check/',
	'/support/feature-request/',
]);

export function audienceOf(href: string): Audience {
	if (teacherTools.has(href)) return 'teacher';
	if (bothTools.has(href)) return 'both';
	return 'student';
}

export function sendsDataOf(href: string): boolean {
	return sendsData.has(href);
}
