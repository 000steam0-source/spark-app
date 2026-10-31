import { CapacitorHttp } from "@capacitor/core";

// Android WebView enforces CORS and forbids Origin/Referer/User-Agent headers.
// Electron solved that in the main process; here every cross-origin request is
// sent through Capacitor's native HTTP stack instead.

const YOUTUBE_HOST = /(^|\.)(youtube\.com|googlevideo\.com|youtube-nocookie\.com)$/i;
const APPLE_HOST = /(^|\.)music\.apple\.com$/i;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function shouldGoNative(url: URL): boolean {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.origin === window.location.origin) return false;
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return false;
  return true;
}

function rewriteHeaders(url: URL, headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  let uaOverride: string | undefined;
  headers.forEach((value, name) => {
    const lower = name.toLowerCase();
    if (lower === "x-liner-user-agent") uaOverride = value;
    else out[lower] = value;
  });
  const host = url.hostname;
  if (YOUTUBE_HOST.test(host) || APPLE_HOST.test(host)) {
    const origin = APPLE_HOST.test(host)
      ? "https://music.apple.com"
      : url.href.includes("://www.youtube.com/")
        ? "https://www.youtube.com"
        : "https://music.youtube.com";
    out["origin"] = origin;
    out["referer"] = `${origin}/`;
  }
  if (uaOverride) out["user-agent"] = uaOverride;
  return out;
}

async function readBody(
  body: BodyInit | null | undefined,
): Promise<{ data?: string; dataType?: string; contentType?: string }> {
  if (body == null) return {};
  if (typeof body === "string") return { data: body, dataType: "text" };
  if (body instanceof URLSearchParams)
    return {
      data: body.toString(),
      dataType: "text",
      contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    };
  let bytes: Uint8Array;
  let contentType: string | undefined;
  if (body instanceof Blob) {
    bytes = new Uint8Array(await body.arrayBuffer());
    contentType = body.type || undefined;
  } else if (body instanceof ArrayBuffer) {
    bytes = new Uint8Array(body);
  } else if (ArrayBuffer.isView(body)) {
    bytes = new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
  } else if (body instanceof FormData) {
    const encoded = new Response(body);
    bytes = new Uint8Array(await encoded.arrayBuffer());
    contentType = encoded.headers.get("content-type") ?? undefined;
  } else {
    return { data: String(body), dataType: "text" };
  }
  return { data: toBase64(bytes), dataType: "file", contentType };
}

export function installNativeFetch(): void {
  const originalFetch = window.fetch.bind(window);

  const nativeFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const request =
      input instanceof Request ? input : new Request(String(input), init);
    let url: URL;
    try {
      url = new URL(
        input instanceof Request ? input.url : String(input),
        window.location.href,
      );
    } catch {
      return originalFetch(input, init);
    }
    if (!shouldGoNative(url)) return originalFetch(input, init);

    const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const method = (init?.method ?? request.method ?? "GET").toUpperCase();
    const headers = rewriteHeaders(
      url,
      new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)),
    );
    let rawBody: BodyInit | null | undefined = init?.body;
    if (rawBody === undefined && input instanceof Request && method !== "GET" && method !== "HEAD") {
      rawBody = await input.clone().arrayBuffer();
    }
    const body = await readBody(rawBody);
    if (body.data !== undefined && !headers["content-type"]) {
      headers["content-type"] = body.contentType ?? "text/plain;charset=UTF-8";
    }

    const run = CapacitorHttp.request({
      url: url.href,
      method,
      headers,
      data: body.data,
      dataType: body.dataType as never,
      responseType: "arraybuffer",
      connectTimeout: 20000,
      readTimeout: 60000,
    });

    const result = await new Promise<Awaited<typeof run>>((resolve, reject) => {
      const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
      signal?.addEventListener("abort", onAbort, { once: true });
      run.then(resolve, (error: unknown) =>
        reject(new TypeError(`Network request failed: ${String((error as Error)?.message ?? error)}`)),
      ).finally(() => signal?.removeEventListener("abort", onAbort));
    });

    const responseHeaders = new Headers();
    for (const [name, value] of Object.entries(result.headers ?? {})) {
      try {
        responseHeaders.append(name, String(value));
      } catch {
        // skip headers the Fetch API refuses
      }
    }
    const contentType = responseHeaders.get("content-type") ?? "";
    let payload: BodyInit | null = null;
    const data = result.data as unknown;
    if (result.status === 204 || result.status === 304 || method === "HEAD") {
      payload = null;
    } else if (typeof data === "string") {
      const looksJson = /json/i.test(contentType);
      const isError = result.status >= 400;
      if (looksJson || isError) payload = data;
      else {
        try {
          payload = fromBase64(data) as unknown as BodyInit;
        } catch {
          payload = data;
        }
      }
    } else if (data != null) {
      payload = JSON.stringify(data);
    }

    const response = new Response(payload, {
      status: result.status < 200 || result.status > 599 ? 200 : result.status,
      headers: responseHeaders,
    });
    Object.defineProperty(response, "url", { value: result.url || url.href });
    return response;
  };

  window.fetch = nativeFetch as typeof window.fetch;
  globalThis.fetch = nativeFetch as typeof globalThis.fetch;
}
