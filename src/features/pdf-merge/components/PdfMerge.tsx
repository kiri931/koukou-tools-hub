import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Trash2,
} from "lucide-react";

import { usePdfMerge } from "../hooks/usePdfMerge";
import type { PdfFile } from "../types";

function PreviewCanvas({ url, label }: { url: string | null; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!url || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = url;
  }, [url]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={label}
      className="h-44 w-full rounded-md bg-muted object-contain"
    />
  );
}

export function PdfMerge() {
  const {
    files,
    isMerging,
    totalPages,
    addFiles,
    removeFile,
    reorderFiles,
    changePage,
    merge,
    clear,
  } = usePdfMerge();

  const [outputName, setOutputName] = useState("merged.pdf");
  const [isDropActive, setIsDropActive] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileCountLabel = useMemo(() => {
    if (files.length === 0) return "PDFファイルを追加してください";
    return `${files.length}件のPDFが読み込まれています`;
  }, [files.length]);

  const handleSelectClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(event.target.files ?? []);
      if (selected.length > 0) {
        addFiles(selected);
      }
      event.target.value = "";
    },
    [addFiles]
  );

  const handleDropFiles = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDropActive(false);
      const dropped = Array.from(event.dataTransfer.files ?? []);
      if (dropped.length > 0) {
        addFiles(dropped);
      }
    },
    [addFiles]
  );

  const handleDragOverZone = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDropActive(true);
  }, []);

  const handleDragLeaveZone = useCallback(() => {
    setIsDropActive(false);
  }, []);

  const handleDragStart = useCallback(
    (index: number) => (event: React.DragEvent) => {
      setDraggingIndex(index);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
    },
    []
  );

  const handleDragOver = useCallback(
    (index: number) => (event: React.DragEvent) => {
      event.preventDefault();
      if (dragOverIndex !== index) {
        setDragOverIndex(index);
      }
    },
    [dragOverIndex]
  );

  const handleDrop = useCallback(
    (index: number) => (event: React.DragEvent) => {
      event.preventDefault();
      const fromIndex = Number(event.dataTransfer.getData("text/plain"));
      if (!Number.isNaN(fromIndex)) {
        reorderFiles(fromIndex, index);
      }
      setDraggingIndex(null);
      setDragOverIndex(null);
    },
    [reorderFiles]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleMerge = useCallback(() => {
    merge(outputName);
  }, [merge, outputName]);

  return (
    // ページの <main>・h1・説明と、幅・余白は pages/tools/pdf-merge.astro が持つ（kj の T4）。
    <div className="flex w-full flex-col gap-8">
      <p className="rounded-lg border border-border bg-card/60 px-4 py-3 text-base text-muted-foreground">
        すべての処理はブラウザ内で完結します。ファイルは外部へ送信されません。
      </p>

      <Card>
        <CardContent className="space-y-4">
          <div
            className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              isDropActive
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
            onDragOver={handleDragOverZone}
            onDragLeave={handleDragLeaveZone}
            onDrop={handleDropFiles}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-medium">PDFファイルをドラッグ&ドロップ</p>
              <p className="text-sm text-muted-foreground">またはボタンから選択</p>
            </div>
            <Button type="button" onClick={handleSelectClick} variant="secondary">
              ファイルを選択
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">{fileCountLabel}</p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">ファイル一覧</h2>
          <span className="text-base text-muted-foreground">
            ドラッグして並べ替えできます
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {files.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center text-base text-muted-foreground">
              まだPDFがありません。上のエリアから追加してください。
            </div>
          )}
          {files.map((file, index) => (
            <PdfCard
              key={file.id}
              file={file}
              isDragging={draggingIndex === index}
              isDragOver={dragOverIndex === index}
              onDragStart={handleDragStart(index)}
              onDragOver={handleDragOver(index)}
              onDrop={handleDrop(index)}
              onDragEnd={handleDragEnd}
              onRemove={() => removeFile(file.id)}
              onPrev={() => changePage(file.id, -1)}
              onNext={() => changePage(file.id, 1)}
            />
          ))}
        </div>
      </section>

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <label htmlFor="pdf-merge-output-name" className="text-base font-medium">出力ファイル名</label>
              <Input
                id="pdf-merge-output-name"
                value={outputName}
                onChange={(event) => setOutputName(event.target.value)}
                placeholder="merged.pdf"
              />
              <p className="text-xs text-muted-foreground">
                .pdfを省略すると自動で付与します。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleMerge}
                disabled={files.length === 0 || isMerging}
              >
                {isMerging ? "結合中..." : "PDFを結合する"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clear}
                disabled={files.length === 0 || isMerging}
              >
                クリア
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-base text-muted-foreground">
            <span>ファイル数: {files.length}</span>
            <span>合計ページ数: {totalPages}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PdfCard({
  file,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
  onPrev,
  onNext,
}: {
  file: PdfFile;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragEnd: () => void;
  onRemove: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className={`rounded-lg border bg-card p-4 transition-all ${
        isDragging ? "opacity-60" : "border-border"
      } ${isDragOver ? "border-primary" : ""}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="space-y-3">
        <PreviewCanvas
          url={file.previewUrl}
          label={`${file.name} page ${file.previewPage}`}
        />
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {file.previewPage} / {file.pageCount} ページ
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={onPrev}
              disabled={file.previewPage <= 1}
              aria-label="前のページ"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={onNext}
              disabled={file.previewPage >= file.pageCount}
              aria-label="次のページ"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={onRemove}
            aria-label="削除"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
