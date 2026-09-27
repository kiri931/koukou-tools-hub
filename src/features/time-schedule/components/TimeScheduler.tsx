import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useTaskManager } from '../hooks/useTaskManager';
import { useTimer } from '../hooks/useTimer';
import { DEFAULT_COLORS } from '../types';

// --- SVG Helpers ---

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  // Clamp so we don't render a full 360° arc (SVG path degenerates)
  const clampedEnd = Math.min(endDeg, startDeg + 359.99);
  const start = polarToCartesian(cx, cy, r, clampedEnd);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const largeArc = clampedEnd - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

// --- Clock SVG ---

interface ClockProps {
  tasks: { name: string; duration: number; color: string }[];
  totalTime: number;
  elapsedMs: number;
  isRunning: boolean;
}

function Clock({ tasks, totalTime, elapsedMs, isRunning }: ClockProps) {
  const CX = 150;
  const CY = 150;
  const R = 115;
  const STROKE = 28;

  // Current wall-clock time
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  // Build task arcs
  const arcs: { startDeg: number; endDeg: number; color: string }[] = [];
  let accumulated = 0;
  for (const task of tasks) {
    const startDeg = (accumulated / totalTime) * 360;
    accumulated = Math.min(accumulated + task.duration, totalTime);
    const endDeg = (accumulated / totalTime) * 360;
    arcs.push({ startDeg, endDeg, color: task.color });
  }

  // Remaining arc
  const usedDeg = (Math.min(accumulated, totalTime) / totalTime) * 360;
  const hasRemaining = usedDeg < 359.99;

  // Progress arc
  const elapsedMin = elapsedMs / 60000;
  const progressDeg = Math.min((elapsedMin / totalTime) * 360, 360);

  // Tick marks every 5 minutes
  const ticks: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
  const tickIntervalDeg = (5 / totalTime) * 360;
  if (tickIntervalDeg >= 2) {
    for (let deg = 0; deg < 360; deg += tickIntervalDeg) {
      const isMajor = Math.round((deg / 360) * totalTime) % 15 === 0;
      const outerR = R + STROKE / 2 + 2;
      const innerR = R + STROKE / 2 + (isMajor ? 8 : 4);
      const p1 = polarToCartesian(CX, CY, outerR, deg);
      const p2 = polarToCartesian(CX, CY, innerR, deg);
      ticks.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, major: isMajor });
    }
  }

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[300px]">
      {/* Background ring */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="#1e293b"
        strokeWidth={STROKE}
      />

      {/* Task arcs */}
      {arcs.map((arc, i) => (
        <path
          key={i}
          d={describeArc(CX, CY, R, arc.startDeg, arc.endDeg)}
          fill="none"
          stroke={arc.color}
          strokeWidth={STROKE}
          strokeLinecap="butt"
          opacity={0.85}
        />
      ))}

      {/* Remaining / unallocated arc */}
      {hasRemaining && (
        <path
          d={describeArc(CX, CY, R, usedDeg, 360)}
          fill="none"
          stroke="#334155"
          strokeWidth={STROKE}
          strokeLinecap="butt"
        />
      )}

      {/* Progress arc (elapsed) */}
      {(isRunning || elapsedMs > 0) && progressDeg > 0.1 && (
        <path
          d={describeArc(CX, CY, R, 0, progressDeg)}
          fill="none"
          stroke="white"
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.6}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          style={{ stroke: 'var(--color-text-muted)' }}
          strokeWidth={t.major ? 1.5 : 1}
        />
      ))}

      {/* Center clock */}
      <circle cx={CX} cy={CY} r={R - STROKE / 2 - 2} fill="#0f172a" />
      <text
        x={CX} y={CY - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#f1f5f9"
        fontSize="28"
        fontWeight="600"
        fontFamily="monospace"
      >
        {hh}:{mm}
      </text>
      <text
        x={CX} y={CY + 20}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#94a3b8"
        fontSize="12"
        fontFamily="sans-serif"
      >
        {totalTime}分
      </text>
    </svg>
  );
}

// --- Main Component ---

export default function TimeScheduler() {
  const { tasks, totalTime, addTask, deleteTask, updateTask, moveTask, setTotalTime } = useTaskManager();
  const { isRunning, isPaused, elapsedMs, currentTaskIndex, start, pause, reset } = useTimer(tasks, totalTime);

  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const currentTask = currentTaskIndex >= 0 ? tasks[currentTaskIndex] : null;
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);

  return (
    // ページの <main>・h1 と、幅・余白は pages/tools/time-schedule.astro が持つ（kj の T4）。
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-4">
          <span className="text-base text-[var(--color-text-muted)] whitespace-nowrap">合計時間: {totalTime}分</span>
          <div className="w-40">
            <Slider
              min={10}
              max={480}
              step={5}
              value={[totalTime]}
              onValueChange={([v]) => setTotalTime(v)}
              disabled={isRunning && !isPaused}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Left: Clock + Controls */}
        <div className="flex flex-col items-center gap-4">
          <Clock
            tasks={tasks}
            totalTime={totalTime}
            elapsedMs={elapsedMs}
            isRunning={isRunning && !isPaused}
          />

          {/* Elapsed display */}
          <div className="text-center">
            <span className="font-mono text-3xl font-bold text-slate-900 dark:text-slate-100">
              {String(elapsedMin).padStart(2, '0')}:{String(elapsedSec).padStart(2, '0')}
            </span>
            {currentTask && (
              <div className="mt-1">
                <Badge variant="outline" className="gap-1.5 text-base">
                  <span
                    aria-hidden="true"
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: currentTask.color }}
                  />
                  {currentTask.name}
                </Badge>
              </div>
            )}
            {!currentTask && (isRunning || elapsedMs > 0) && (
              <div className="mt-1">
                <Badge variant="secondary">完了</Badge>
              </div>
            )}
          </div>

          {/* Timer controls */}
          <div className="flex gap-2">
            {(!isRunning || isPaused) && (
              <Button onClick={start} size="sm">
                ▶ {isPaused ? '再開' : '開始'}
              </Button>
            )}
            {isRunning && !isPaused && (
              <Button onClick={pause} size="sm" variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                ⏸ 一時停止
              </Button>
            )}
            <Button onClick={reset} size="sm" variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
              🔄 リセット
            </Button>
          </div>
        </div>

        <Separator className="bg-slate-300 dark:bg-slate-700" />

        {/* Right: Task list */}
        <Card className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-800 dark:text-slate-200">タスク一覧</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.length === 0 && (
              <p className="text-base text-[var(--color-text-muted)] py-4 text-center">
                タスクを追加してください
              </p>
            )}

            {tasks.map((task, index) => (
              <div
                key={task.id}
                className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${
                  index === currentTaskIndex && isRunning
                    ? 'border-[var(--color-accent)] bg-[var(--color-surface-strong)]'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                } ${
                  dragOverId === task.id ? 'ring-2 ring-[var(--color-accent)] bg-slate-100 dark:bg-slate-800/80' : ''
                } ${
                  draggingId === task.id
                    ? 'opacity-80 scale-[0.99] shadow-lg shadow-indigo-500/10 border-[var(--color-accent)]'
                    : ''
                }`}
                onDragOver={(e) => {
                  if (isRunning && !isPaused) return;
                  e.preventDefault();
                  if (dragOverId !== task.id) setDragOverId(task.id);
                }}
                onDragLeave={() => {
                  if (dragOverId === task.id) setDragOverId(null);
                }}
                onDrop={(e) => {
                  if (isRunning && !isPaused) return;
                  e.preventDefault();
                  const fromId = e.dataTransfer.getData('text/plain') || draggingId;
                  if (fromId) moveTask(fromId, task.id);
                  setDragOverId(null);
                  setDraggingId(null);
                }}
              >
                {/* Drag handle */}
                <button
                  type="button"
                  className={`cursor-grab select-none text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 active:cursor-grabbing ${
                    draggingId === task.id ? 'text-[var(--color-accent)]' : ''
                  }`}
                  draggable={!(isRunning && !isPaused)}
                  onDragStart={(e) => {
                    if (isRunning && !isPaused) return;
                    e.dataTransfer.setData('text/plain', task.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggingId(task.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  title="ドラッグで並べ替え"
                  aria-label="ドラッグで並べ替え"
                >
                  <span className="block h-[2px] w-4 rounded-full bg-current" />
                  <span className="block h-[2px] w-4 rounded-full bg-current mt-1" />
                  <span className="block h-[2px] w-4 rounded-full bg-current mt-1" />
                </button>
                {/* Color picker */}
                <div className="relative">
                  <button
                    className="h-6 w-6 rounded-full border-2 border-slate-300 dark:border-slate-700 flex-shrink-0 transition-transform hover:scale-110"
                    style={{ backgroundColor: task.color }}
                    onClick={() => setColorPickerOpen(colorPickerOpen === task.id ? null : task.id)}
                    title="色を変更"
                    aria-label="色を変更"
                  />
                  {colorPickerOpen === task.id && (
                    <div className="absolute left-0 top-8 z-10 flex flex-wrap gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-xl w-[112px]">
                      {DEFAULT_COLORS.map((c) => (
                        <button
                          key={c}
                          className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                          style={{
                            backgroundColor: c,
                            borderColor: task.color === c ? 'var(--color-text)' : 'transparent',
                          }}
                          aria-label={`色 ${c}`}
                          aria-pressed={task.color === c}
                          onClick={() => {
                            updateTask(task.id, { color: c });
                            setColorPickerOpen(null);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Task name */}
                <Input
                  value={task.name}
                  onChange={(e) => updateTask(task.id, { name: e.target.value })}
                  className="h-7 flex-1 border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 text-sm focus-visible:ring-[var(--color-accent)]"
                  disabled={isRunning && !isPaused}
                />

                {/* Duration */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <input
                    type="number"
                    min={1}
                    max={480}
                    value={task.duration}
                    onChange={(e) => updateTask(task.id, { duration: Math.max(1, Number(e.target.value)) })}
                    className="w-14 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-1.5 py-1 text-center text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    disabled={isRunning && !isPaused}
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">分</span>
                </div>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-slate-600 dark:text-slate-400 hover:text-[var(--color-danger)] flex-shrink-0"
                  onClick={() => deleteTask(task.id)}
                  disabled={isRunning && !isPaused}
                  title="削除"
                >
                  ✕
                </Button>
              </div>
            ))}

            <Separator className="my-2 bg-slate-300 dark:bg-slate-700" />

            {/* Total bar */}
            {tasks.length > 0 && (
              <div className="space-y-1 px-1">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>割り当て済み</span>
                  <span>
                    {tasks.reduce((s, t) => s + t.duration, 0)}分 / {totalTime}分
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                    style={{
                      width: `${Math.min(100, (tasks.reduce((s, t) => s + t.duration, 0) / totalTime) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={addTask}
              variant="outline"
              size="sm"
              className="mt-2 w-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[var(--color-accent)] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              disabled={isRunning && !isPaused}
            >
              + タスク追加
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
