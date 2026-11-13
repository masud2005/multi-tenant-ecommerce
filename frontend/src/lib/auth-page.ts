export interface AuthPageContent {
  signInTitle: string;
  signInSubtitle: string;
  signUpTitle: string;
  signUpSubtitle: string;
  imageUrl: string;
  caption: string;
}

export const EMPTY_AUTH_PAGE: AuthPageContent = {
  signInTitle: '',
  signInSubtitle: '',
  signUpTitle: '',
  signUpSubtitle: '',
  imageUrl: '',
  caption: '',
};

export function parseAuthPage(raw: unknown): AuthPageContent {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const text = (key: keyof AuthPageContent) => {
    const value = source[key];
    return typeof value === 'string' ? value.trim() : '';
  };
  return {
    signInTitle: text('signInTitle'),
    signInSubtitle: text('signInSubtitle'),
    signUpTitle: text('signUpTitle'),
    signUpSubtitle: text('signUpSubtitle'),
    imageUrl: text('imageUrl'),
    caption: text('caption'),
  };
}
