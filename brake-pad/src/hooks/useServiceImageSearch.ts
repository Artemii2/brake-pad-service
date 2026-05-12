import { useEffect, useMemo, useRef, useState } from "react";
import { cosineSimilarity } from "../modules/math";

export type ClipSearchItem = {
  id: number;
  description: string;
};

export type ProcessedClipItem = ClipSearchItem & {
  score: number;
  isVisible: boolean;
  embedding?: number[];
};

const CLIP_THRESHOLD = 0.45;
const CLIP_TOP_K = 5;

function normalizeProgress(raw: unknown): number | null {
  if (raw === null || typeof raw !== "object") return null;
  const msg = raw as { progress?: number };
  if (typeof msg.progress !== "number") return null;
  return msg.progress <= 1 ? Math.round(msg.progress * 100) : Math.min(100, Math.round(msg.progress));
}

export function useServiceImageSearch(initialItems: ClipSearchItem[], enabled: boolean) {
  const [items, setItems] = useState<ProcessedClipItem[]>([]);
  const [imageEmbedding, setImageEmbedding] = useState<number[] | null>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [workerError, setWorkerError] = useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const embeddingsReadyRef = useRef(false);
  const pendingFileRef = useRef<File | null>(null);
  const lastUploadedImageNameRef = useRef<string | null>(null);
  const itemsRef = useRef(initialItems);
  itemsRef.current = initialItems;

  const itemsKey = useMemo(() => initialItems.map((item) => `${item.id}:${item.description}`).join("|"), [initialItems]);

  useEffect(() => {
    setWorkerError(null);
    embeddingsReadyRef.current = false;
    pendingFileRef.current = null;

    if (!enabled) {
      workerRef.current?.terminate();
      workerRef.current = null;
      setItems([]);
      setReady(false);
      setProgress(0);
      setImageEmbedding(null);
      setImageProcessing(false);
      setUploadedImageName(null);
      return;
    }

    const snapshot = itemsRef.current;
    if (snapshot.length === 0) {
      setItems([]);
      setReady(true);
      setProgress(100);
      setImageEmbedding(null);
      setImageProcessing(false);
      setUploadedImageName(null);
      return;
    }

    setItems(snapshot.map((item) => ({ ...item, score: 0, isVisible: true })));
    setReady(false);
    setProgress(0);
    setImageEmbedding(null);
    setImageProcessing(false);
    setUploadedImageName(null);

    workerRef.current = new Worker(new URL("../workers/clipSearch.worker.ts", import.meta.url), { type: "module" });

    workerRef.current.onerror = (event) => {
      setWorkerError(event.message || "Не удалось запустить CLIP worker");
      setReady(true);
      pendingFileRef.current = null;
    };

    workerRef.current.onmessage = (event: MessageEvent) => {
      const { type, data } = event.data as { type: string; data: unknown };

      switch (type) {
        case "progress": {
          const p = normalizeProgress(data);
          if (p !== null) setProgress(p);
          break;
        }
        case "text_embeddings_ready": {
          embeddingsReadyRef.current = true;
          setItems((prev) =>
            prev.map((item) => ({
              ...item,
              embedding: (data as Record<number, number[] | undefined>)[item.id],
            })),
          );
          setReady(true);
          setProgress(100);

          const pending = pendingFileRef.current;
          if (pending && workerRef.current) {
            pendingFileRef.current = null;
            workerRef.current.postMessage({ type: "image", data: pending });
          }
          break;
        }
        case "image_embedding_ready":
          setImageEmbedding(data as number[]);
          setImageProcessing(false);
          break;
        case "error":
          setWorkerError(typeof data === "string" ? data : "Ошибка CLIP worker");
          setReady(true);
          setImageProcessing(false);
          pendingFileRef.current = null;
          break;
        default:
          break;
      }
    };

    workerRef.current.postMessage({ type: "init", data: snapshot });

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [itemsKey, enabled]);

  useEffect(() => {
    if (!imageEmbedding) return;

    setItems((prevItems) => {
      const processed = prevItems.map((item) => {
        const score = item.embedding ? cosineSimilarity(imageEmbedding, item.embedding) : 0;
        return { ...item, score, isVisible: false };
      });

      processed.sort((a, b) => b.score - a.score);

      let visibleCount = 0;
      for (const item of processed) {
        if (visibleCount >= CLIP_TOP_K) break;
        if (item.score >= CLIP_THRESHOLD) {
          item.isVisible = true;
          visibleCount += 1;
        }
      }

      if (visibleCount === 0) {
        for (const item of processed.slice(0, CLIP_TOP_K)) item.isVisible = true;
      }

      console.groupCollapsed(`[CLIP brake pad search] ${lastUploadedImageNameRef.current ?? "uploaded image"}`);
      console.info("Порог сходства:", CLIP_THRESHOLD, "| TopK:", CLIP_TOP_K);
      console.table(
        processed.map((item) => ({
          id: item.id,
          description: item.description,
          score: Number(item.score.toFixed(4)),
          visible: item.isVisible,
        })),
      );
      console.groupEnd();

      return processed;
    });
  }, [imageEmbedding]);

  const searchByImage = (file: File) => {
    lastUploadedImageNameRef.current = file.name || "uploaded image";
    setUploadedImageName(file.name || "uploaded image");
    setImageEmbedding(null);
    setImageProcessing(true);
    if (!workerRef.current || !embeddingsReadyRef.current) {
      pendingFileRef.current = file;
      return;
    }
    workerRef.current.postMessage({ type: "image", data: file });
  };

  const resetSearch = () => {
    setImageEmbedding(null);
    setImageProcessing(false);
    setUploadedImageName(null);
    setWorkerError(null);
    pendingFileRef.current = null;
    setItems((prev) =>
      [...prev]
        .sort((a, b) => a.id - b.id)
        .map((item) => ({
          ...item,
          score: 0,
          isVisible: true,
        })),
    );
  };

  return {
    items,
    ready,
    progress,
    imageEmbedding,
    imageProcessing,
    uploadedImageName,
    workerError,
    threshold: CLIP_THRESHOLD,
    topK: CLIP_TOP_K,
    searchByImage,
    resetSearch,
  };
}
