import { SIGNER_WASM_BASE64 } from "../../../electron/signer";

// Browser port of electron/crypto.ts: same WASM signer, no Node APIs.

interface SignInput {
  method: string;
  path: string;
  body?: string | null;
  timestamp?: number;
}

interface WasmSignerExports {
  liner_alloc: (len: number) => number;
  liner_dealloc: (ptr: number, len: number) => void;
  liner_get_result_ptr: () => number;
  liner_get_result_len: () => number;
  liner_sign_cover_url: (ptr: number, len: number) => number;
  liner_sign_request: (...args: Array<number | bigint>) => number;
  liner_sign_monitor_request: (...args: Array<number | bigint>) => number;
  liner_sign_raw_payload: (ptr: number, len: number) => number;
  memory: WebAssembly.Memory;
}

let serverTimeOffsetMs = 0;
let wasm: WasmSignerExports | null = null;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function exports(): WasmSignerExports {
  if (wasm) return wasm;
  const binary = atob(SIGNER_WASM_BASE64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const instance = new WebAssembly.Instance(new WebAssembly.Module(bytes), {});
  wasm = instance.exports as unknown as WasmSignerExports;
  return wasm;
}

function pass(w: WasmSignerExports, bytes: Uint8Array) {
  const ptr = w.liner_alloc(bytes.length);
  new Uint8Array(w.memory.buffer, ptr, bytes.length).set(bytes);
  return { ptr, len: bytes.length, free: () => w.liner_dealloc(ptr, bytes.length) };
}

function result(w: WasmSignerExports): string {
  const ptr = w.liner_get_result_ptr();
  const len = w.liner_get_result_len();
  if (!ptr || len === 0) return "";
  return decoder.decode(new Uint8Array(w.memory.buffer, ptr, len).slice());
}

function nonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function adjustedTimestamp(): number {
  return Math.floor((Date.now() + serverTimeOffsetMs) / 1000);
}

function signWith(kind: "liner_sign_request" | "liner_sign_monitor_request", input: SignInput) {
  const w = exports();
  const timestamp = input.timestamp ?? adjustedTimestamp();
  const n = nonce();
  const bufs = [input.method, input.path, input.body ?? "", n].map((s) =>
    pass(w, encoder.encode(s)),
  );
  try {
    const [m, p, b, nn] = bufs;
    const code = w[kind](m.ptr, m.len, p.ptr, p.len, b.ptr, b.len, BigInt(timestamp), nn.ptr, nn.len);
    if (code !== 0) throw new Error(`wasm ${kind} failed with code ${code}`);
    return { signature: result(w), timestamp, nonce: n };
  } finally {
    bufs.forEach((buf) => buf.free());
  }
}

export const mobileSigner = {
  signRequest: async (input: SignInput) => signWith("liner_sign_request", input),
  signMonitorRequest: async (input: SignInput) => signWith("liner_sign_monitor_request", input),
  syncServerTime: async (value: string | number) => {
    const ms = typeof value === "number" ? value : Date.parse(value);
    if (!Number.isNaN(ms) && ms > 0) serverTimeOffsetMs = ms - Date.now();
    return serverTimeOffsetMs;
  },
  getServerTimeOffset: async () => serverTimeOffsetMs,
  signCoverUrl: async (payload: string) => {
    const w = exports();
    const buf = pass(w, encoder.encode(payload));
    try {
      const code = w.liner_sign_cover_url(buf.ptr, buf.len);
      if (code !== 0) throw new Error(`wasm sign_cover_url failed with code ${code}`);
      return result(w);
    } finally {
      buf.free();
    }
  },
  signRawPayload: async (payload: number[] | Uint8Array) => {
    const w = exports();
    const buf = pass(w, payload instanceof Uint8Array ? payload : Uint8Array.from(payload));
    try {
      const code = w.liner_sign_raw_payload(buf.ptr, buf.len);
      if (code !== 0) throw new Error(`wasm sign_raw_payload failed with code ${code}`);
      return result(w);
    } finally {
      buf.free();
    }
  },
};
