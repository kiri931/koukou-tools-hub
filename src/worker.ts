interface Env {
  ASSETS: Fetcher;
  RESEND_API_KEY: string;
  RESEND_TO_EMAIL: string;
  RESEND_FROM_EMAIL?: string;
}

interface SupportRequestBody {
  email?: string;
  content?: string;
  category?: string;
}

const SUPPORT_PATH = "/api/support";

async function handleSupportRequest(request: Request, env: Env): Promise<Response> {
  let body: SupportRequestBody;

  try {
    body = (await request.json()) as SupportRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const category = body.category?.trim() ?? "";
  const content = body.content?.trim() ?? "";
  const email = body.email?.trim() ?? "";

  if (!category) {
    return Response.json({ error: "category is required" }, { status: 400 });
  }

  if (!content) {
    return Response.json({ error: "content is required" }, { status: 400 });
  }

  const fromEmail = env.RESEND_FROM_EMAIL?.trim() || "noreply@resend.dev";

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `機能リクエスト <${fromEmail}>`,
      to: env.RESEND_TO_EMAIL,
      reply_to: email || undefined,
      subject: `問い合わせフォームより：${category}`,
      text: [
        `カテゴリ: ${category}`,
        `返信先: ${email || "（未入力）"}`,
        "",
        "--- 内容 ---",
        content,
      ].join("\n"),
    }),
  });

  if (!resendResponse.ok) {
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }

  return Response.json({ success: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === SUPPORT_PATH) {
      return handleSupportRequest(request, env);
    }

    // /support/ 自体にページは無い。放っておくと404になり、Search Console に
    // 「見つかりませんでした(404)」として残るので、実体のあるフォームへ送る。
    if (url.pathname === "/support/") {
      return Response.redirect(
        new URL("/support/feature-request/", url).toString(),
        301,
      );
    }

    // /study/ 自体にもページは無い。配下にあるのは /study/equation-transformation/ だけ。
    // Google は /study/equation-transformation をクロールした流れで親の /study も試すため、
    // Search Console に「見つかりませんでした(404)」として残っていた。/support/ と同じ扱いで、
    // 実体のあるページへ送る。
    // （末尾スラッシュ無しの /study は route "koukou-jouhou.org/study/*" にマッチせず
    //   この worker に届かないので、そちらは koukou-jouhou 側の public/_redirects で処理する。）
    if (url.pathname === "/study/") {
      return Response.redirect(
        new URL("/study/equation-transformation/", url).toString(),
        301,
      );
    }

    // 用語集の「誤りを報告する」は以前 ?ref=<用語ページURL> というクエリを付けていた。
    // 用語ごとに別URLが1本生まれるため、Search Console に
    // 「代替ページ(適切な canonical タグあり)」が70件以上積み上がった。
    // リンク側は #ref= に直したが、**すでに Google が拾ったURLは canonical だけでは消えない。**
    // canonical は「こちらが正規」と伝えるだけで、元のURLは索引対象として残り続けるため。
    // 301 を返すと Google はそのURLを正規ではないものとして扱い、最終的に一覧から落とす。
    // 送り先を #ref= にしてあるので、古いリンクを踏んだ人の入力補完も従来どおり効く。
    if (
      (url.pathname === "/support/feature-request/" ||
        url.pathname === "/support/feature-request") &&
      url.searchParams.has("ref")
    ) {
      const ref = url.searchParams.get("ref") ?? "";
      return Response.redirect(
        new URL(
          `/support/feature-request/#ref=${encodeURIComponent(ref)}`,
          url,
        ).toString(),
        301,
      );
    }

    // ASSETS バインディングが外れていても 500 ではなく 404 を返す(検索エンジン対策)
    if (!env.ASSETS) {
      return new Response("Not Found", { status: 404 });
    }

    // 末尾スラッシュ無しのURLを 301 で正規化する。
    // Cloudflare Workers Assets はこの正規化を **307(一時的)** で行うが、307 は
    // 「今だけ別の場所にある」という意味なので Google はリダイレクト元URLを索引に残し続け、
    // Search Console の「ページにリダイレクトがあります」から消えない。
    // 301 を返して初めて Google はそのURLを手放す。
    // 実体があるかどうかは ASSETS に末尾スラッシュ付きで問い合わせて確かめるので、
    // 実体の無いパスは 301 を挟まずそのまま 404 になる。
    if (
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname !== "/" &&
      !url.pathname.endsWith("/") &&
      !/\.[a-zA-Z0-9]+$/.test(url.pathname)
    ) {
      const withSlash = new URL(url);
      withSlash.pathname = `${url.pathname}/`;
      const probe = await env.ASSETS.fetch(
        new Request(withSlash.toString(), { method: "HEAD" }),
      );
      if (probe.status === 200) {
        return Response.redirect(withSlash.toString(), 301);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
