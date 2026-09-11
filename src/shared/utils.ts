export function sanitizeObject(obj: any, keysToMask: string[] = ["apiKey", "Authorization", "authorization"]): any {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((v) => sanitizeObject(v, keysToMask));
  const sanitized: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (keysToMask.includes(k)) {
      sanitized[k] = "***";
    } else {
      sanitized[k] = sanitizeObject(v, keysToMask);
    }
  }
  return sanitized;
}

export async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}
