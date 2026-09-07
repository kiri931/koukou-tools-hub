import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormStatus = "idle" | "submitting" | "success" | "error";

// 送る値は今までのまま（受け取り側の集計を壊さない）。
// **画面に出す言葉だけを、使う人の言い方に変える。**
// 「バグ報告」と言われても、生徒は自分の状況がそれに当たるか判断できない。
// （画面くらべ 20260801-request-form / 2026-08-01 採用）
const categories = [
  { value: "バグ報告", label: "うまく動かない" },
  { value: "機能追加リクエスト", label: "こんな機能がほしい" },
  { value: "改善提案", label: "記事の間違い・分かりにくい" },
  { value: "その他", label: "その他" },
] as const;

// 選んだ内容で、書いてほしいことが変わる
const placeholders: Record<string, string> = {
  バグ報告:
    "例：顔モザイクツールで、iPadで撮った写真を選んだら、顔が見つからないまま止まりました",
  機能追加リクエスト: "例：覚える君で、問題の順番を自分で並べ替えられると嬉しいです",
  改善提案: "例：用語集の「標本化」の説明で、単位の書き方が違うように思います",
  その他: "気づいたことを自由に書いてください",
};

export function SupportForm() {
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    // 用語集の「誤りを報告する」は #ref= で対象ページを渡す。
    // クエリ(?ref=)だと用語ごとに別URLが生まれ、Google に重複ページとして
    // 積み上がるため hash に移した。すでに拾われている古い ?ref= 付きリンクも
    // 動くように、hash を優先しつつクエリも読む。
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const ref =
      new URLSearchParams(hash).get("ref") ??
      new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      setContent(`対象ページ: ${ref}\n\n### 気になった点\n(ここに具体的な誤り・分かりにくい点を書いてください)\n`);
    }
  }, []);

  const isSubmitting = status === "submitting";

  const resetFeedback = () => {
    if (status !== "submitting") {
      setStatus("idle");
      setMessage("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!category) {
      setStatus("error");
      setMessage("上の4つから、どれに近いかを選んでください。");
      return;
    }

    if (!content.trim()) {
      setStatus("error");
      setMessage("リクエスト内容を入力してください。");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          content: content.trim(),
          email: email.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "送信に失敗しました。");
      }

      setStatus("success");
      setMessage("機能リクエストを送信しました。ありがとうございます。");
      setCategory("");
      setContent("");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "送信に失敗しました。時間をおいて再度お試しください。"
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          こうだったらいいのに、を教えてください
        </h1>
        <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-400">
          使っていて困ったこと、あったらいいもの、記事の間違い。どれでもかまいません。
          名前もメールアドレスも要りません。
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <fieldset className="space-y-2">
          <legend className="text-base font-semibold text-slate-900 dark:text-slate-100">
            どれに近いですか？
          </legend>
          {/* 選択肢はボタンで出す。開いた瞬間に4つとも見えるほうが、
              閉じたプルダウンより選びやすい（1タップ減る） */}
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => {
              const selected = category === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setCategory(item.value);
                    resetFeedback();
                  }}
                  className={`min-h-11 rounded-lg border px-4 text-sm font-semibold transition-colors ${
                    selected
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {selected ? "✓ " : ""}
                  {item.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="support-content">内容</Label>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            「どのツールで」「何をしたら」「どうなったか」の3つがあると直しやすいです。
          </p>
          <textarea
            id="support-content"
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              resetFeedback();
            }}
            rows={8}
            required
            aria-invalid={status === "error" && !content.trim()}
            placeholder={placeholders[category] ?? "気づいたことを書いてください（先に上の4つから選ぶと、書き方の例が出ます）"}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 flex min-h-32 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="support-email">返信用メール（任意）</Label>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            書かなければ匿名のままです。返事が要るときだけ入れてください。
          </p>
          <Input
            id="support-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              resetFeedback();
            }}
            placeholder="you@example.com"
          />
        </div>

        {/* 送る前の不安をその場でなくす。誰が読むのか、送ったあとどうなるのか */}
        <div className="rounded-lg border border-slate-300 border-l-4 border-l-indigo-600 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:border-l-indigo-400 dark:bg-slate-900/50 dark:text-slate-300">
          送られた内容は、このサイトを作っている担当者だけが読みます。
          直したものは、変更があった日にサイトへ反映されます。すぐ直せるものと、時間がかかるものがあります。
        </div>

        {status === "success" && (
          <Alert>
            <AlertTitle>送信完了</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive">
            <AlertTitle>送信エラー</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "送信中..." : "送信する"}
          </Button>
        </div>
      </form>
    </div>
  );
}
