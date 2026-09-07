グラフィックデザイン検定 1級 実技 練習課題
テーマ「日本の伝統色」

■ 何のための一式か
　1級の実技試験は、支給された文字・イラスト・写真を、指示書と指示図のとおりに
　A4へ配置する課題です。これはその練習用に作った類題です。
　過去問そのものではありません。文章・図・画像はすべて書き下ろし・自作です。

■ 配布物
　shijisho.pdf   指示書（2ページ）
　shijizu.pdf    指示図（1ページ）
　checklist.pdf  自己採点チェックリスト（1ページ）
　text/          1.txt 2.txt 3.txt 4.txt data1.txt data2.txt
　illust/        aizome / asanoha / seigaiha / kikkou / hyou / logo （svg と png）
　image/         A.jpg B.jpg C.jpg D.jpg E.jpg F.jpg

■ 本番との違い
　・本番の支給データは illust が jpg と eps、image が tif と jpg です。
　　ここでは svg / png / jpg にしています。**練習の中身（配置と文字組版）は変わりません。**
　・書体は本番では会場ごとに指定されます。ここでは手元にある明朝体とゴシック体を
　　1つずつ選び、作品全体で統一してください。
　・主催団体名は本番の団体名ではなく、練習用の名前を使っています。

■ 進め方の目安
　1. 指示書を15分で読む（読むだけ。まだ作らない）
　2. 90分で作る
　3. 原寸・カラー・トンボ付きで出力する
　4. checklist.pdf で自己採点する

■ 素材について
　image/ と illust/ は、この課題のために自動生成した自作の画像です。
　写真は使っていません。自由に使って構いません。

■ 作り直し方
　tools/gd-jitsugi/make-data.mjs   支給データを作る（macOS の qlmanage と sips を使う）
　tools/gd-jitsugi/make-pdf.sh     PDFを作る（Chrome のヘッドレスに印刷させる）
