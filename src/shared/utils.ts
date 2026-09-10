export function escapeHTML(str: string): string {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function redactSensitiveInfo(text: string): string {
  const sensitivePatterns = [
    /(api[_-]?key)[:=]\s*["']?([a-zA-Z0-9_\-]{10,})["']?/gi,
    /(auth[_-]?token)[:=]\s*["']?([a-zA-Z0-9_\-]{10,})["']?/gi,
    /(bearer\s+)[a-zA-Z0-9_\-]{10,}/gi,
    /(password)[:=]\s*["']?([a-zA-Z0-9_\-]{10,})["']?/gi,
  ];

  let redacted = text;
  for (const pattern of sensitivePatterns) {
    redacted = redacted.replace(pattern, (match, p1, p2) => {
      if (p2) return `${p1}[REDACTED]`;
      return match.replace(/[a-zA-Z0-9_\-]{10,}/, '[REDACTED]');
    });
  }
  return redacted;
}
