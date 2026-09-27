import type { Meta, StoryObj } from "@storybook/react-vite";
import { LinkCard } from "./LinkCard";

const KEYBOARD_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="M6 8h.01" /><path d="M10 8h.01" /><path d="M14 8h.01" /><path d="M18 8h.01" /><path d="M6 16h12" /></svg>';

const meta = {
  title: "Site/LinkCard",
  component: LinkCard,
  args: {
    href: "/tools/typing-japanese/",
    label: "タイピング練習",
    desc: "ひらがなのローマ字入力を練習するタイピングゲーム。",
    icon: KEYBOARD_ICON,
    accent: "#0ea5e9",
  },
} satisfies Meta<typeof LinkCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** アイコンを渡さない場合はアイコン枠ごと出ない */
export const NoIcon: Story = {
  args: { icon: undefined },
};

/** 説明文が無いカード（ツール一覧などで使う） */
export const LabelOnly: Story = {
  args: { icon: undefined, desc: undefined },
};

/** accent を変えるとアイコンの下地と文字色が color-mix で追随する */
export const OtherAccent: Story = {
  args: { label: "顔モザイクツール", desc: "画像内の顔を自動検出して加工できます。", accent: "#6366f1" },
};

/** 明るい色（黄）でもアイコンの文字色が暗い側へ寄り、3:1 を保つ */
export const LightAccent: Story = {
  args: { label: "JavaScript シューティング", desc: "ゲーム形式でJavaScriptを学べます。", accent: "#eab308" },
};

/** 通信するツールには「共有・送信あり」の印（kj の注意の色：面は --kj-notice-bg、枠は --color-warning） */
export const WithBadge: Story = {
  args: { label: "作戦盤", desc: "共有リンクを作ると盤面を送信します。", badge: "共有・送信あり" },
};

/** ツール一覧の並び（kj-grid）で3枚並べたとき */
export const InGrid: Story = {
  render: (args) => (
    <div className="kj-grid">
      <LinkCard {...args} />
      <LinkCard {...args} label="顔モザイクツール" accent="#6366f1" />
      <LinkCard {...args} label="作戦盤" badge="共有・送信あり" icon={undefined} />
    </div>
  ),
};
