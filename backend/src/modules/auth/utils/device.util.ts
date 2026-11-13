export type ParsedDevice = {
  deviceLabel: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
};

export function parseUserAgent(userAgent?: string | null): ParsedDevice {
  const ua = (userAgent || '').trim();
  if (!ua) {
    return {
      deviceLabel: 'Unknown device',
      deviceType: 'unknown',
      browser: 'Unknown browser',
      os: 'Unknown OS',
    };
  }

  const os = /Windows NT/i.test(ua)
    ? 'Windows'
    : /Mac OS X|Macintosh/i.test(ua)
      ? 'macOS'
      : /Android/i.test(ua)
        ? 'Android'
        : /iPhone|iPad|iPod/i.test(ua)
          ? 'iOS'
          : /Linux/i.test(ua)
            ? 'Linux'
            : 'Unknown OS';

  const browser = /Edg\//i.test(ua)
    ? 'Edge'
    : /Chrome\//i.test(ua) && !/Edg\//i.test(ua)
      ? 'Chrome'
      : /Safari\//i.test(ua) && !/Chrome\//i.test(ua)
        ? 'Safari'
        : /Firefox\//i.test(ua)
          ? 'Firefox'
          : /OPR\//i.test(ua) || /Opera/i.test(ua)
            ? 'Opera'
            : 'Unknown browser';

  let deviceType: ParsedDevice['deviceType'] = 'desktop';
  if (/iPad|Tablet/i.test(ua)) deviceType = 'tablet';
  else if (/Mobile|Android.*Mobile|iPhone|iPod/i.test(ua))
    deviceType = 'mobile';

  const deviceLabel = `${browser} on ${os}`;
  return { deviceLabel, deviceType, browser, os };
}
