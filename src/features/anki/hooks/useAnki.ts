import { useEffect, useState } from 'react';
import { useDB } from './useDB';
import { useStudySession } from './useStudySession';
import { useDeckLink } from './useDeckLink';
import type { AppSettings, Card, DashboardStats, Dataset, DatasetSummary } from '../types';
import { DEFAULT_SETTINGS } from '../types';

export function useAnki() {
  const db = useDB();
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [dashboard, setDashboard] = useState<DashboardStats>({
    due: { overdue: 0, today: 0 },
    avgRetrievability: null,
    topConfusions: [],
  });
  const [dueByDataset, setDueByDataset] = useState<Record<string, number>>({});
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = async () => {
    if (!db.ready) return;
    setLoading(true);
    try {
      const [list, currentSettings, due, avgRetrievability, topConfusions] = await Promise.all([
        db.listDatasets(),
        db.getSettings(),
        db.countDue(),
        db.computeAvgRetrievability(),
        db.listTopConfusions(undefined, 10),
      ]);

      const dueEntries = await Promise.all(
        list.map(async (dataset) => {
          const counts = await db.countDue(dataset.datasetId);
          return [dataset.datasetId, counts.overdue] as const;
        }),
      );

      setDatasets(list);
      setSettingsState(currentSettings);
      setDashboard({ due, avgRetrievability, topConfusions });
      setDueByDataset(Object.fromEntries(dueEntries));
      setSelectedDatasetId((prev) => (prev && list.some((d) => d.datasetId === prev) ? prev : list[0]?.datasetId ?? null));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    if (!db.ready) return;
    try {
      const [due, avgRetrievability, topConfusions] = await Promise.all([
        db.countDue(),
        db.computeAvgRetrievability(),
        db.listTopConfusions(undefined, 10),
      ]);
      setDashboard({ due, avgRetrievability, topConfusions });

      const dueEntries = await Promise.all(
        datasets.map(async (dataset) => {
          const counts = await db.countDue(dataset.datasetId);
          return [dataset.datasetId, counts.overdue] as const;
        }),
      );
      setDueByDataset(Object.fromEntries(dueEntries));
    } catch {
      // silent; main flow should continue
    }
  };

  useEffect(() => {
    if (!db.ready) return;
    void refreshAll();
  }, [db.ready]);

  const study = useStudySession(db, settings, refreshStats);

  // /tools/anki/?import=glossary で来たときに用語集を取り込む。
  // syncDataset を渡す(importDataset ではない)。読み直しで復習の履歴を消さないため
  const deckLink = useDeckLink(db.ready, db.syncDataset, refreshAll);

  const importDataset = async (rawText: string) => {
    await db.importDataset(rawText);
    await refreshAll();
  };

  // 試験の用語集を分野・優先度で切り出して入れるとき用。取り込み直しで進み具合を消さない
  const syncDataset = async (dataset: Dataset) => {
    await db.syncDataset(dataset);
    await refreshAll();
  };

  const deleteDataset = async (datasetId: string) => {
    await db.deleteDataset(datasetId);
    if (study.session.datasetId === datasetId) {
      study.resetSession();
    }
    await refreshAll();
  };

  const getCardsForDataset = async (datasetId: string) => {
    return db.getCardsByDataset(datasetId);
  };

  const addOrUpdateCard = async (datasetId: string, card: Card) => {
    await db.upsertCard(datasetId, card);
    await refreshAll();
  };

  const deleteCard = async (datasetId: string, cardId: string) => {
    await db.deleteCard(datasetId, cardId);
    await refreshAll();
  };

  const exportBackup = async () => {
    return db.exportAll();
  };

  const importBackup = async (rawText: string) => {
    await db.importAll(rawText);
    study.resetSession();
    await refreshAll();
  };

  const updateSettings = async (next: Partial<AppSettings>) => {
    const saved = await db.setSettings(next);
    setSettingsState(saved);
    await refreshStats();
    return saved;
  };

  return {
    dbReady: db.ready,
    dbError: db.error,
    loading,
    error,
    datasets,
    dueByDataset,
    dashboard,
    settings,
    selectedDatasetId,
    setSelectedDatasetId,
    session: study.session,
    startSession: study.startSession,
    submitAnswer: study.submitAnswer,
    submitGrade: study.submitGrade,
    revealHint: study.revealHint,
    resetSession: study.resetSession,
    importDataset,
    syncDataset,
    deleteDataset,
    getCardsForDataset,
    addOrUpdateCard,
    deleteCard,
    exportBackup,
    importBackup,
    updateSettings,
    refreshAll,
    deckLink,
  };
}
