// Client-side cookie helper utilities for Next.js authentication

export function setCookie(name: string, value: string, days = 30) {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  // Use Lax same-site and root path for secure credential propagation
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const target = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const c = cookies[i].trim();
    if (c.indexOf(target) === 0) {
      return decodeURIComponent(c.substring(target.length));
    }
  }
  return null;
}

export function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`;
}
