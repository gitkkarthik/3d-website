"use client";

/**
 * Carries a recording made on the homepage into the wizard, so nobody has to record twice.
 * Stored only in this browser (IndexedDB) until they choose to use it.
 */
const DB = "pawsome";
const STORE = "handoff";
const KEY = "hero-sound";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export type HandoffSound = { file: Blob; name: string; peaks: number[]; duration: number; petName: string };

export async function saveHandoff(v: HandoffSound) {
  try {
    const db = await open();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(v, KEY);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch {}
}

export async function loadHandoff(): Promise<HandoffSound | null> {
  try {
    const db = await open();
    return await new Promise((res) => {
      const r = db.transaction(STORE).objectStore(STORE).get(KEY);
      r.onsuccess = () => res((r.result as HandoffSound) ?? null);
      r.onerror = () => res(null);
    });
  } catch {
    return null;
  }
}

export async function clearHandoff() {
  try {
    const db = await open();
    db.transaction(STORE, "readwrite").objectStore(STORE).delete(KEY);
  } catch {}
}
