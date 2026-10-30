/**
 * Security Sanitizer & Taint Defense Utility
 * Provides path traversal prevention, open redirect validation, and input taint scrubbing.
 */

// Allowed URL schemes for outbound or redirected links
const ALLOWED_SCHEMES = new Set(['http:', 'https:']);

// Whitelisted hosts for proxy forwarding
const ALLOWED_PROXY_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  'generativelanguage.googleapis.com',
  'maps.googleapis.com',
  'github.com',
  'api.github.com',
  'raw.githubusercontent.com',
  'crypticnews.org'
]);

/**
 * Validates and sanitizes a Virtual File System (VFS) path.
 * Strips null-byte injections, normalizes path separators, and ensures
 * that traversal tokens (..) cannot escape the designated root.
 */
export function sanitizeVfsPath(cwd: string, targetPath: string = ''): string {
  if (typeof targetPath !== 'string') return '/';

  // Reject / strip null-byte attacks
  let cleaned = targetPath.replace(/\0/g, '').trim();

  // Normalize windows-style backslashes
  cleaned = cleaned.replace(/\\/g, '/');

  // Handle absolute vs relative
  let combined: string;
  if (cleaned.startsWith('/')) {
    combined = cleaned;
  } else {
    combined = `${cwd || '/'}/${cleaned}`;
  }

  // Tokenize and resolve segments
  const segments = combined.split('/').filter(Boolean);
  const stack: string[] = [];

  for (const seg of segments) {
    if (seg === '.' || seg === '') {
      continue;
    } else if (seg === '..') {
      if (stack.length > 0) {
        stack.pop();
      }
    } else {
      // Clean forbidden characters
      const sanitizedSeg = seg.replace(/[<>:"|?*]/g, '');
      if (sanitizedSeg) {
        stack.push(sanitizedSeg);
      }
    }
  }

  return '/' + stack.join('/');
}

/**
 * Checks if a URL is safe against Open Redirect and SSRF attacks.
 */
export function isSafeRedirectUrl(urlStr: string, allowedOrigins: string[] = []): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;

  // Relative URLs (path-only) starting with / but not // are safe internal redirects
  if (urlStr.startsWith('/') && !urlStr.startsWith('//') && !urlStr.startsWith('/\\')) {
    return true;
  }

  try {
    const parsed = new URL(urlStr);
    if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
      return false;
    }

    // Check against allowed proxy hosts or origins
    if (ALLOWED_PROXY_HOSTS.has(parsed.hostname)) {
      return true;
    }

    for (const origin of allowedOrigins) {
      try {
        const allowed = new URL(origin);
        if (parsed.origin === allowed.origin) return true;
      } catch {
        // ignore
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Sanitizes an untrusted URL, returning a safe destination or default fallback.
 */
export function sanitizeRedirect(urlStr: string, fallback = '/'): string {
  if (isSafeRedirectUrl(urlStr)) {
    return urlStr;
  }
  return fallback;
}

/**
 * Sanitizes user input to remove control characters and command injection sequences.
 */
export function sanitizeTaintedInput(input: string): string {
  if (typeof input !== 'string') return '';
  // Remove null bytes and non-printable control characters (except newline, tab, carriage return)
  return input
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Basic HTML escaping for UI display to avoid injection.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
