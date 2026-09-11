// src/shared/utils.ts
function sanitizeObject(obj, keysToMask = ["apiKey", "Authorization", "authorization"]) {
  if (obj === null || typeof obj !== "object")
    return obj;
  if (Array.isArray(obj))
    return obj.map((v) => sanitizeObject(v, keysToMask));
  const sanitized = {};
  for (const [k, v] of Object.entries(obj)) {
    if (keysToMask.includes(k)) {
      sanitized[k] = "***";
    } else {
      sanitized[k] = sanitizeObject(v, keysToMask);
    }
  }
  return sanitized;
}
async function fetchWithTimeout(input, init = {}, timeoutMs = 15e3) {
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
export {
  fetchWithTimeout,
  sanitizeObject
};
//# sourceMappingURL=utils.js.map
