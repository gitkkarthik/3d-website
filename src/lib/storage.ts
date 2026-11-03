import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { AwsClient } from "aws4fetch";

/**
 * Private object storage. Files are NEVER served from a public bucket or /public:
 * every read goes through /api/files/[id], which checks authorisation first.
 */
export interface StorageDriver {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

class LocalStorage implements StorageDriver {
  constructor(private root: string) {}
  private resolve(key: string) {
    if (!/^[a-zA-Z0-9/_.-]+$/.test(key) || key.includes("..")) throw new Error("Bad storage key");
    return path.join(this.root, key);
  }
  async put(key: string, body: Buffer) {
    const p = this.resolve(key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, body);
  }
  async get(key: string) {
    try {
      return await fs.readFile(this.resolve(key));
    } catch {
      return null;
    }
  }
  async delete(key: string) {
    await fs.rm(this.resolve(key), { force: true });
  }
}

/** S3-compatible: AWS S3, Cloudflare R2, Supabase Storage (S3 protocol). Bucket must be private. */
class S3Storage implements StorageDriver {
  private client: AwsClient;
  private base: string;
  constructor() {
    const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION } = process.env;
    if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
      throw new Error("S3 storage selected but S3_* environment variables are missing");
    }
    this.client = new AwsClient({
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
      region: S3_REGION || "auto",
      service: "s3",
    });
    this.base = `${S3_ENDPOINT.replace(/\/$/, "")}/${S3_BUCKET}`;
  }
  async put(key: string, body: Buffer, contentType: string) {
    const res = await this.client.fetch(`${this.base}/${key}`, {
      method: "PUT",
      body: new Uint8Array(body),
      headers: { "content-type": contentType },
    });
    if (!res.ok) throw new Error(`Storage put failed: ${res.status}`);
  }
  async get(key: string) {
    const res = await this.client.fetch(`${this.base}/${key}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Storage get failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  async delete(key: string) {
    await this.client.fetch(`${this.base}/${key}`, { method: "DELETE" });
  }
}

let driver: StorageDriver | null = null;
export function storage(): StorageDriver {
  if (!driver) {
    driver =
      process.env.STORAGE_DRIVER === "s3"
        ? new S3Storage()
        : new LocalStorage(path.resolve(process.env.STORAGE_DIR || "./storage"));
  }
  return driver;
}
