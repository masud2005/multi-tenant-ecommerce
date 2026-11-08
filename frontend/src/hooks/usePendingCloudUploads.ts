'use client';

import { useCallback, useRef, useState } from 'react';

export type CloudUploadResourceType = 'image' | 'raw' | 'video';

export type PendingCloudUpload = {
  key: string;
  url: string;
  publicId: string;
  mimeType: string;
  name?: string;
  resourceType: CloudUploadResourceType;
  size?: number;
};

/**
 * Shared pending Cloudinary upload list with discard/rollback on remove.
 * Use wherever files are uploaded to storage before the parent form/message is submitted.
 */
export function usePendingCloudUploads({
  max = 4,
  discardRemote,
}: {
  max?: number;
  /** Delete the remote asset (Cloudinary). Best-effort; UI still removes locally. */
  discardRemote: (item: PendingCloudUpload) => Promise<void>;
}) {
  const [items, setItems] = useState<PendingCloudUpload[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const discardRef = useRef(discardRemote);
  discardRef.current = discardRemote;

  const add = useCallback(
    (upload: Omit<PendingCloudUpload, 'key'> & { key?: string }) => {
      let added: PendingCloudUpload | null = null;
      setItems((prev) => {
        if (prev.length >= max) return prev;
        added = {
          ...upload,
          key: upload.key || `${upload.publicId}-${Date.now()}`,
        };
        return [...prev, added];
      });
      return added;
    },
    [max],
  );

  const remove = useCallback(async (key: string) => {
    const item = itemsRef.current.find((i) => i.key === key);
    setItems((prev) => prev.filter((i) => i.key !== key));
    if (!item) return;
    try {
      await discardRef.current(item);
    } catch {
      // Local remove already applied; remote cleanup is best-effort.
    }
  }, []);

  /** After successful submit — keep remote files, clear local pending only. */
  const commit = useCallback(() => {
    setItems([]);
  }, []);

  /** Restore pending list after a failed submit (do not re-delete remotes). */
  const restore = useCallback((next: PendingCloudUpload[]) => {
    setItems(next);
  }, []);

  /** Discard every pending remote asset (e.g. conversation switch / cancel). */
  const discardAll = useCallback(async () => {
    const snapshot = [...itemsRef.current];
    setItems([]);
    await Promise.allSettled(snapshot.map((item) => discardRef.current(item)));
  }, []);

  const urls = items.map((i) => i.url);

  return {
    items,
    urls,
    count: items.length,
    atLimit: items.length >= max,
    add,
    remove,
    commit,
    restore,
    discardAll,
  };
}
