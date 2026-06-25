type RateLimitInfo = {
  count: number;
  lastReset: number;
};

const rateLimits = new Map<string, RateLimitInfo>();

export function checkRateLimit(ip: string, limit: number = 5, windowMs: number = 5 * 60 * 1000): boolean {
  const now = Date.now();
  const info = rateLimits.get(ip) ?? { count: 0, lastReset: now };

  // Reset the window if enough time has passed
  if (now - info.lastReset > windowMs) {
    info.count = 0;
    info.lastReset = now;
  }

  // If over limit, block
  if (info.count >= limit) {
    return false;
  }

  // Increment and save
  info.count += 1;
  rateLimits.set(ip, info);

  // Periodic cleanup of old entries to prevent memory leaks over months of uptime
  if (Math.random() < 0.05) { // ~5% chance to trigger cleanup on a check
    rateLimits.forEach((val, key) => {
      if (now - val.lastReset > windowMs) {
        rateLimits.delete(key);
      }
    });
  }

  return true;
}

export function resetRateLimit(ip: string) {
  rateLimits.delete(ip);
}
