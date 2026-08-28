export type LicenseState = 'free' | 'checking' | 'unlocked' | 'invalid' | 'offline';

const PRODUCT = 'tour-route-intent';
const TOKEN_KEY = `sb_license:${PRODUCT}`;
const VERDICT_KEY = `${TOKEN_KEY}:verdict`;
const DAY = 86_400_000;

interface CachedVerdict { valid: boolean; checkedAt: number; }

export function captureReturnedLicense(): string | null {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('license');
  if (!token) return localStorage.getItem(TOKEN_KEY);
  localStorage.setItem(TOKEN_KEY, token.trim());
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return token.trim();
}

export function storeLicense(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export function removeLicense(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VERDICT_KEY);
}

export function optimisticLicenseState(token: string | null): LicenseState {
  if (!token) return 'free';
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '') as CachedVerdict;
    return cached.valid ? 'unlocked' : 'invalid';
  } catch {
    return 'checking';
  }
}

export async function verifyLicense(token: string): Promise<LicenseState> {
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '') as CachedVerdict;
    if (Date.now() - cached.checkedAt < DAY) return cached.valid ? 'unlocked' : 'invalid';
  } catch { /* first verification */ }
  try {
    const response = await fetch(`https://api.sociobot.in/api/v1/products/${PRODUCT}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('verification unavailable');
    const data = await response.json() as { valid: boolean };
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: data.valid, checkedAt: Date.now() } satisfies CachedVerdict));
    return data.valid ? 'unlocked' : 'invalid';
  } catch {
    return optimisticLicenseState(token) === 'unlocked' ? 'unlocked' : 'offline';
  }
}
