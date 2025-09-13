// Minimal helpers for OPFS (Origin Private File System).
// Falls back to in-memory / download if OPFS is not available.

export type FsSaveResult = { ok: true; url?: string } | { ok: false; error: string };

function hasOPFS() {
  return typeof (navigator as any).storage?.getDirectory === "function";
}

async function ensurePath(root: any, parts: string[]) {
  let dir = root;
  for (const p of parts) {
    dir = await dir.getDirectoryHandle(p, { create: true });
  }
  return dir;
}

export async function saveToOPFS(path: string, file: File): Promise<FsSaveResult> {
  try {
    if (!hasOPFS()) {
      // Fallback: allow user to download the file immediately
      const url = URL.createObjectURL(file);
      return { ok: true, url };
    }
    const root = await (navigator as any).storage.getDirectory();
    const parts = path.split("/").filter(Boolean);
    const fname = parts.pop()!;
    const dir = await ensurePath(root, parts);
    const fh = await dir.getFileHandle(fname, { create: true });
    const writable = await fh.createWritable();
    await writable.write(file);
    await writable.close();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "OPFS write failed" };
  }
}

export async function listOPFS(path: string): Promise<string[]> {
  try {
    if (!hasOPFS()) return [];
    const root = await (navigator as any).storage.getDirectory();
    const parts = path.split("/").filter(Boolean);
    const dir = await ensurePath(root, parts);
    const out: string[] = [];
    // @ts-ignore
    for await (const [name] of (dir as any).entries()) out.push(name);
    return out.sort();
  } catch {
    return [];
  }
}

// Create a temporary blob URL for a file in OPFS (for opening/downloading)
export async function getOPFSFileURL(path: string): Promise<string | undefined> {
  try {
    if (!hasOPFS()) return undefined;
    const root = await (navigator as any).storage.getDirectory();
    const parts = path.split("/").filter(Boolean);
    const fname = parts.pop();
    if (!fname) return undefined;
    let dir = root;
    for (const p of parts) {
      dir = await dir.getDirectoryHandle(p, { create: false });
    }
    const fh = await dir.getFileHandle(fname, { create: false });
    const file = await fh.getFile();
    return URL.createObjectURL(file);
  } catch {
    return undefined;
  }
}
