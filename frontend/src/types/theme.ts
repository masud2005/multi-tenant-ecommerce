export type ThemeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ThemeTokens {
  primaryColor: string;
  secondaryColor?: string;
  accentColor: string;
  canvasColor: string;
  surfaceColor: string;
  inkColor: string;
  fontHeading: string;
  fontBody: string;
  borderRadius: string;
  cardStyle: string;
  customCss?: string;
}

export interface ThemeSection {
  id: string;
  themeId?: string;
  sectionType: string;
  label: string;
  orderIndex: number;
  isVisible: boolean;
  settings?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ThemeVersion {
  id: string;
  themeId: string;
  version: string;
  label?: string;
  snapshot: {
    tokens: ThemeTokens;
    sections: ThemeSection[];
  };
  publishedBy?: string;
  createdAt: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  slug: string;
  description?: string;
  previewImage?: string;
  defaultTokens: ThemeTokens;
  defaultSections: Array<{
    sectionType: string;
    label: string;
    isVisible?: boolean;
    settings?: Record<string, any>;
  }>;
  isActive: boolean;
}

export interface TenantTheme extends ThemeTokens {
  id: string;
  tenantId: string;
  presetId?: string;
  name: string;
  status: ThemeStatus;
  isLive: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  preset?: ThemePreset;
  sections: ThemeSection[];
  versions?: ThemeVersion[];
}
