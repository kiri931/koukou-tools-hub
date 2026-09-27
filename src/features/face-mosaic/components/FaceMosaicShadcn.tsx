import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  ImageIcon,
  Upload,
  ScanFace,
  Loader2,
  Pencil,
  Trash2,
  RotateCcw,
  Download,
  RefreshCw,
  ShieldCheck,
  Grid3x3,
  Droplets,
  Square,
  CircleCheck,
  CircleAlert,
  LoaderCircle,
  FileImage,
} from "lucide-react";

import type { EffectType } from "../types";
import { useOpenCV } from "../hooks/useOpenCV";
import { useImageHandler } from "../hooks/useImageHandler";
import { useRectManager } from "../hooks/useRectManager";
import { useFaceDetection } from "../hooks/useFaceDetection";
import { useCanvasRenderer } from "../hooks/useCanvasRenderer";
import { useCanvasInteraction } from "../hooks/useCanvasInteraction";

export default function FaceMosaicShadcn() {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Drawing refs (shared between renderer and interaction)
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const drawCurrentRef = useRef<{ x: number; y: number } | null>(null);

  // Effect state
  const [effect, setEffect] = useState<EffectType>("mosaic");
  const [mosaicSize, setMosaicSize] = useState(15);
  const [blurKernel, setBlurKernel] = useState(21);

  // Hooks
  const { opencvStatus, statusText, opencvReadyRef, detectorRef, retry } = useOpenCV();

  const rectManager = useRectManager();
  const {
    detectedRects,
    setDetectedRects,
    detectedRectsRef,
    manualRects,
    setManualRects,
    manualRectsRef,
    selectedRect,
    setSelectedRect,
    selectedRectRef,
    drawMode,
    setDrawMode,
    drawModeRef,
    deleteSelected,
    resetRects,
  } = rectManager;

  const onImageLoaded = useCallback(() => {
    resetRects();
    setDetectStatus("");
  }, [resetRects]);

  const {
    imageLoaded,
    imageLoadedRef,
    fileName,
    fileError,
    isDragOver,
    originalImageRef,
    originalFileRef,
    fileInputRef,
    onDragOver,
    onDragLeave,
    onDrop,
    onDropZoneClick,
    onFileChange,
    resetImage,
  } = useImageHandler(canvasRef, overlayCanvasRef, onImageLoaded);

  const onDetected = useCallback((rects: typeof detectedRects) => {
    setDetectedRects(rects);
    setSelectedRect(null);
  }, [setDetectedRects, setSelectedRect]);

  const {
    isDetecting,
    detectStatus,
    setDetectStatus,
    scoreThreshold,
    setScoreThreshold,
    nmsThreshold,
    setNmsThreshold,
    handleDetect,
  } = useFaceDetection(opencvReadyRef, imageLoadedRef, canvasRef, detectorRef, onDetected);

  const { effectRef, mosaicSizeRef, blurKernelRef, renderOverlay } = useCanvasRenderer({
    canvasRef,
    overlayCanvasRef,
    originalImageRef,
    imageLoadedRef,
    detectedRectsRef,
    manualRectsRef,
    selectedRectRef,
    isDrawingRef,
    drawStartRef,
    drawCurrentRef,
    effect,
    mosaicSize,
    blurKernel,
    detectedRects,
    manualRects,
    imageLoaded,
  });

  const {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  } = useCanvasInteraction({
    overlayCanvasRef,
    imageLoadedRef,
    detectedRectsRef,
    manualRectsRef,
    selectedRectRef,
    drawModeRef,
    isDrawingRef,
    drawStartRef,
    drawCurrentRef,
    setManualRects,
    setSelectedRect,
    renderOverlay,
  });

  // ===== Save =====
  const handleSave = useCallback(async () => {
    if (!imageLoadedRef.current || !originalImageRef.current) return;
    const canvas = canvasRef.current!;

    const tmp = new OffscreenCanvas(canvas.width, canvas.height);
    const tmpCtx = tmp.getContext("2d")!;
    tmpCtx.drawImage(originalImageRef.current, 0, 0);

    const allRects = [...detectedRectsRef.current, ...manualRectsRef.current];
    allRects.forEach((rect) => {
      const { x, y, w, h } = rect;
      if (w <= 0 || h <= 0) return;
      switch (effectRef.current) {
        case "mosaic": {
          const blockSize = Math.max(1, mosaicSizeRef.current);
          const ix = Math.floor(x); const iy = Math.floor(y);
          const iw = Math.ceil(w); const ih = Math.ceil(h);
          for (let bx = ix; bx < ix + iw; bx += blockSize) {
            for (let by = iy; by < iy + ih; by += blockSize) {
              const bw2 = Math.min(blockSize, ix + iw - bx);
              const bh2 = Math.min(blockSize, iy + ih - by);
              const cx2 = Math.floor(bx + bw2 / 2);
              const cy2 = Math.floor(by + bh2 / 2);
              const pixel = tmpCtx.getImageData(cx2, cy2, 1, 1).data;
              tmpCtx.fillStyle = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
              tmpCtx.fillRect(bx, by, bw2, bh2);
            }
          }
          break;
        }
        case "blur": {
          const blurPx = blurKernelRef.current * 0.4;
          const sub = new OffscreenCanvas(w, h);
          const subCtx = sub.getContext("2d")!;
          subCtx.drawImage(tmp, x, y, w, h, 0, 0, w, h);
          tmpCtx.save();
          tmpCtx.filter = `blur(${blurPx}px)`;
          tmpCtx.drawImage(sub, x, y);
          tmpCtx.restore();
          break;
        }
        case "blackout":
          tmpCtx.fillStyle = "#000";
          tmpCtx.fillRect(x, y, w, h);
          break;
      }
    });

    const blob = await tmp.convertToBlob({ type: "image/png" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const baseName = originalFileRef.current ? originalFileRef.current.name.replace(/\.[^.]+$/, "") : "image";
    a.href = url;
    a.download = "face-mosaic_" + baseName + ".png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [imageLoadedRef, originalImageRef, detectedRectsRef, manualRectsRef, effectRef, mosaicSizeRef, blurKernelRef, originalFileRef]);

  // ===== Global Reset =====
  const handleGlobalReset = useCallback(() => {
    resetImage();
    resetRects();
    setDetectStatus("");
    setEffect("mosaic");
    setMosaicSize(15);
    setBlurKernel(21);
  }, [resetImage, resetRects, setDetectStatus]);

  const hasRects = detectedRects.length > 0 || manualRects.length > 0;

  const StepBadge = ({ n }: { n: number }) => (
    <Badge className="h-7 w-7 shrink-0 rounded-full bg-primary p-0 text-xs font-extrabold text-primary-foreground flex items-center justify-center">
      {n}
    </Badge>
  );

  return (
    // ページの <main>・h1・説明と、幅・余白は pages/tools/face-mosaic.astro が持つ（kj の T4）。
    <div className="flex flex-col gap-4">

        {/* Privacy Notice */}
        <Alert className="border-[var(--color-success)] bg-[var(--kj-success-soft)]">
          <ShieldCheck className="h-4 w-4 text-[var(--color-success)]" />
          <AlertTitle className="text-[var(--color-success)]">画像はサーバに送信されません</AlertTitle>
          <AlertDescription className="text-base text-[var(--color-text)]">
            アップロードした画像はすべてお使いのブラウザ内でのみ処理されます。インターネット経由でサーバに送信されることは一切ありません。
          </AlertDescription>
        </Alert>

        {/* OpenCV Status — Alert */}
        <Alert
          className={`border ${
            opencvStatus === "ready"
              ? "border-[var(--color-success)] bg-[var(--kj-success-soft)] text-[var(--color-success)]"
              : opencvStatus === "error"
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-primary/30 bg-primary/10 text-primary"
          }`}
        >
          {opencvStatus === "ready" ? (
            <CircleCheck className="h-4 w-4" />
          ) : opencvStatus === "error" ? (
            <CircleAlert className="h-4 w-4" />
          ) : (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          )}
          <AlertTitle>{statusText}</AlertTitle>
          {/*
            読み込みに失敗しても道具ごと止めない。
            自動検出（OpenCV.js 10.9MB）が要るのは「顔を自動で見つける」ところだけで、
            手動で囲む・モザイク・ぼかし・黒塗り・保存は Canvas だけで動く。
            学校のネットワークで大きいファイルが落ちてこないことは現実に起きるので、
            そのとき何ができるのかを、その場に書く。
          */}
          {opencvStatus === "error" && (
            <AlertDescription className="mt-2 text-base">
              <p>
                自動で顔を見つける機能だけが使えません。
                <strong>手動で囲めば、モザイク・ぼかし・黒塗りはこのまま使えます。</strong>
                （画像を選んでから「手動描画モード」を押してください）
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={retry}>
                もう一度読み込む
              </Button>
            </AlertDescription>
          )}
        </Alert>

        {/* Step 1: Image Selection */}
        <Card className="shadow-lg">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-3">
              <StepBadge n={1} />
              画像を選択
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              role="button"
              tabIndex={0}
              onClick={onDropZoneClick}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDropZoneClick(); } }}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/60 hover:bg-muted/40"
              }`}
            >
              <ImageIcon className="h-14 w-14 text-muted-foreground" />
              <p className="text-base font-semibold">画像をここにドラッグ＆ドロップ</p>
              <p className="text-sm text-muted-foreground">または</p>
              <Button
                variant="default"
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                <Upload className="h-4 w-4" />
                ファイルを選択
              </Button>
              <p className="text-xs text-muted-foreground">対応形式: JPEG / PNG / WebP / GIF（最大 20MB）</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
            {fileError && (
              <Alert variant="destructive" className="mt-3 border-destructive/30 bg-destructive/10">
                <CircleAlert className="h-4 w-4" />
                <AlertDescription>{fileError}</AlertDescription>
              </Alert>
            )}
            {fileName && !fileError && (
              <Badge variant="outline" className="mt-3 gap-1.5 px-2.5 py-1 text-muted-foreground">
                <FileImage className="h-3.5 w-3.5" />
                {fileName}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Face Detection */}
        <Card className="shadow-lg">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-3">
              <StepBadge n={2} />
              顔を検出
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* scoreThreshold */}
            <div className="flex flex-col gap-2">
              <Label>
                scoreThreshold
                <span className="ml-1 text-xs font-normal text-muted-foreground">（小さいほど多く検出・誤検出も増える）</span>
              </Label>
              <div className="flex items-center gap-3">
                <Slider
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  value={[scoreThreshold]}
                  onValueChange={(v) => setScoreThreshold(v[0])}
                  className="flex-1 [&_[data-slot=slider-track]]:bg-muted [&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:border-primary"
                />
                <Badge variant="secondary" className="min-w-[2.5rem] justify-center tabular-nums text-primary">
                  {scoreThreshold.toFixed(2)}
                </Badge>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* nmsThreshold */}
            <div className="flex flex-col gap-2">
              <Label>
                nmsThreshold
                <span className="ml-1 text-xs font-normal text-muted-foreground">（重なる検出枠を統合する強さ）</span>
              </Label>
              <div className="flex items-center gap-3">
                <Slider
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  value={[nmsThreshold]}
                  onValueChange={(v) => setNmsThreshold(v[0])}
                  className="flex-1 [&_[data-slot=slider-track]]:bg-muted [&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:border-primary"
                />
                <Badge variant="secondary" className="min-w-[2.5rem] justify-center tabular-nums text-primary">
                  {nmsThreshold.toFixed(2)}
                </Badge>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Detect Button + Status */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  disabled={!opencvReadyRef.current || !imageLoaded || isDetecting}
                  onClick={handleDetect}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                >
                  {isDetecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ScanFace className="h-4 w-4" />
                  )}
                  顔を検出
                </Button>
                {detectStatus && !detectStatus.startsWith("エラー:") && !detectStatus.startsWith("メモリ不足:") && (
                  <Badge
                    variant="outline"
                    className={`py-1 px-2.5 ${
                      detectedRects.length > 0
                        ? "border-[var(--color-success)] text-[var(--color-success)]"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {detectStatus}
                  </Badge>
                )}
              </div>
              {detectStatus && (detectStatus.startsWith("エラー:") || detectStatus.startsWith("メモリ不足:")) && (
                <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                  <CircleAlert className="h-4 w-4" />
                  <AlertTitle>検出に失敗しました</AlertTitle>
                  <AlertDescription className="text-sm">{detectStatus}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 3 + Canvas Grid */}
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[320px_1fr]">

          {/* Step 3: Effect Selection */}
          <Card className="shadow-lg">
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-3">
                <StepBadge n={3} />
                エフェクト選択
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Effect RadioGroup */}
              <RadioGroup
                value={effect}
                onValueChange={(v) => setEffect(v as EffectType)}
                className="grid grid-cols-3 gap-2"
              >
                {([
                  { value: "mosaic", icon: <Grid3x3 className="h-5 w-5" />, label: "モザイク" },
                  { value: "blur", icon: <Droplets className="h-5 w-5" />, label: "ぼかし" },
                  { value: "blackout", icon: <Square className="h-5 w-5" />, label: "黒塗り" },
                ] as const).map((item) => (
                  <Label
                    key={item.value}
                    htmlFor={`effect-${item.value}`}
                    className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 transition-colors ${
                      effect === item.value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    <RadioGroupItem
                      id={`effect-${item.value}`}
                      value={item.value}
                      className="sr-only"
                    />
                    {item.icon}
                    <span className="text-xs font-medium">{item.label}</span>
                  </Label>
                ))}
              </RadioGroup>

              {/* Effect Params — Card inner */}
              {effect === "mosaic" && (
                <Card className="border-border bg-muted/30 shadow-none">
                  <CardContent className="flex flex-col gap-2 p-3">
                    <Label className="text-sm">ピクセルサイズ</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        min={5}
                        max={40}
                        step={1}
                        value={[mosaicSize]}
                        onValueChange={(v) => setMosaicSize(v[0])}
                        className="flex-1 [&_[data-slot=slider-track]]:bg-muted [&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:border-primary"
                      />
                      <Badge variant="secondary" className="min-w-[3rem] justify-center tabular-nums text-primary">
                        {mosaicSize}px
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {effect === "blur" && (
                <Card className="border-border bg-muted/30 shadow-none">
                  <CardContent className="flex flex-col gap-2 p-3">
                    <Label className="text-sm">ぼかし強度</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        min={5}
                        max={51}
                        step={2}
                        value={[blurKernel]}
                        onValueChange={(v) => setBlurKernel(v[0])}
                        className="flex-1 [&_[data-slot=slider-track]]:bg-muted [&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:border-primary"
                      />
                      <Badge variant="secondary" className="min-w-[2.5rem] justify-center tabular-nums text-primary">
                        {blurKernel}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator className="bg-border" />

              {/* Draw Controls */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={drawMode ? "default" : "outline"}
                  size="sm"
                  disabled={!imageLoaded}
                  onClick={() => {
                    setDrawMode((prev) => !prev);
                    setSelectedRect(null);
                    selectedRectRef.current = null;
                  }}
                  className={
                    drawMode
                      ? "border border-primary bg-primary/10 text-primary hover:bg-primary/20"
                      : "border-border bg-transparent text-muted-foreground hover:border-primary/60 hover:text-foreground"
                  }
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {drawMode ? "描画モード ON" : "手動描画モード"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!selectedRect}
                  onClick={deleteSelected}
                  className="disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  削除
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasRects}
                  onClick={resetRects}
                  className="border-border bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  全リセット
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Canvas — Card */}
          <Card className="relative flex min-h-[260px] items-center justify-center overflow-hidden p-0 shadow-lg">
            <CardContent className="relative flex w-full items-center justify-center p-0">
              <canvas
                ref={canvasRef}
                className={`block max-w-full h-auto ${imageLoaded ? "" : "hidden"}`}
              />
              <canvas
                ref={overlayCanvasRef}
                className={`absolute top-0 left-0 max-w-full h-auto ${imageLoaded ? "" : "hidden"} ${drawMode ? "cursor-crosshair" : "cursor-default"}`}
                onMouseDown={onPointerDown}
                onMouseMove={onPointerMove}
                onMouseUp={onPointerUp}
                onMouseLeave={onPointerLeave}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              />
              {!imageLoaded && (
                <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                  <ImageIcon className="h-10 w-10" />
                  <p className="text-sm">画像を選択するとここに表示されます</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Step 4: Save / Reset */}
        <Card className="shadow-lg">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-3">
              <StepBadge n={4} />
              保存 / リセット
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                disabled={!imageLoaded}
                onClick={handleSave}
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                画像を保存（PNG）
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleGlobalReset}
                className="border-border bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              >
                <RefreshCw className="h-4 w-4" />
                全体リセット
              </Button>
            </div>
          </CardContent>
        </Card>

    </div>
  );
}
