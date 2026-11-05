export type ThemeMode = "light" | "dark";
export type ThemeStyle = "gradient" | "solid";

export interface EcommerceThemePreset {
  id: string;
  name: string;
  concept: string; // Retail / brand concept niche
  mode: ThemeMode;
  style: ThemeStyle;
  /** CSS gradient representation for the preview pill in the modal */
  previewGradient: string;
  accentDot: string;
  fontHeading: string;
  fontBody: string;
  borderRadius: string;
  cardStyle: 'portrait-hover' | 'square-minimal' | 'portrait-quickadd';
  colors: {
    accent: string;
    accentForeground: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    border: string;
    muted: string;
    mutedForeground: string;
    sidebar: string;
    sidebarForeground: string;
    sidebarBorder: string;
  };
}

export const ECOMMERCE_THEMES: EcommerceThemePreset[] = [
  // ==================== DARK MOODS (Midnight / Luxury / Artisanal / Street) ====================
  {
    id: "harbor-midnight",
    name: "Harbor & Midnight",
    concept: "Modern Artisanal, Handloom & Heritage Fashion",
    mode: "dark",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #04121f 0%, #0b2236 60%, #154261 100%)",
    accentDot: "#38bdf8",
    fontHeading: "Fraunces",
    fontBody: "Inter",
    borderRadius: "0.5rem",
    cardStyle: "portrait-hover",
    colors: {
      accent: "#38bdf8",
      accentForeground: "#04121f",
      background: "#04121f",
      foreground: "#e6f4ff",
      card: "#0b2236",
      cardForeground: "#e6f4ff",
      border: "rgba(56, 189, 248, 0.25)",
      muted: "#071b2b",
      mutedForeground: "#8bb2d1",
      sidebar: "#030e18",
      sidebarForeground: "#d6ecfb",
      sidebarBorder: "rgba(56, 189, 248, 0.15)",
    },
  },
  {
    id: "onyx-gold",
    name: "Onyx & Royal Gold",
    concept: "Luxury Haute Couture, High-End Watches & Fine Jewelry",
    mode: "dark",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #0f0a02 0%, #1c1507 60%, #3a2b0c 100%)",
    accentDot: "#f59e0b",
    fontHeading: "Playfair Display",
    fontBody: "Inter",
    borderRadius: "0.25rem",
    cardStyle: "portrait-hover",
    colors: {
      accent: "#f59e0b",
      accentForeground: "#120a02",
      background: "#0c0904",
      foreground: "#fef3c7",
      card: "#1a1308",
      cardForeground: "#fef3c7",
      border: "rgba(245, 158, 11, 0.28)",
      muted: "#140e06",
      mutedForeground: "#d4af37",
      sidebar: "#080602",
      sidebarForeground: "#fde68a",
      sidebarBorder: "rgba(245, 158, 11, 0.18)",
    },
  },
  {
    id: "midnight-terracotta",
    name: "Midnight Terracotta",
    concept: "Contemporary Kurtas, Jamdani Sarees & Crafted Silks",
    mode: "dark",
    style: "solid",
    previewGradient: "linear-gradient(135deg, #140702 0%, #260f04 60%, #4a1906 100%)",
    accentDot: "#e06d53",
    fontHeading: "Fraunces",
    fontBody: "Plus Jakarta Sans",
    borderRadius: "0.5rem",
    cardStyle: "portrait-hover",
    colors: {
      accent: "#e06d53",
      accentForeground: "#ffffff",
      background: "#100603",
      foreground: "#fcedea",
      card: "#220e06",
      cardForeground: "#fcedea",
      border: "rgba(224, 109, 83, 0.25)",
      muted: "#180a04",
      mutedForeground: "#d1a59b",
      sidebar: "#0a0402",
      sidebarForeground: "#fcdad4",
      sidebarBorder: "rgba(224, 109, 83, 0.16)",
    },
  },
  {
    id: "cyber-neon",
    name: "Cyber & Flagship Tech",
    concept: "Smart Electronics, High-Fidelity Audio & Gaming Gear",
    mode: "dark",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #030712 0%, #08162b 60%, #0e2a4d 100%)",
    accentDot: "#06b6d4",
    fontHeading: "Plus Jakarta Sans",
    fontBody: "Inter",
    borderRadius: "0.75rem",
    cardStyle: "square-minimal",
    colors: {
      accent: "#06b6d4",
      accentForeground: "#030712",
      background: "#030712",
      foreground: "#f0fdfa",
      card: "#0c1527",
      cardForeground: "#f0fdfa",
      border: "rgba(6, 182, 212, 0.25)",
      muted: "#08101e",
      mutedForeground: "#94a3b8",
      sidebar: "#02040a",
      sidebarForeground: "#ccfbf1",
      sidebarBorder: "rgba(6, 182, 212, 0.15)",
    },
  },
  {
    id: "street-noir",
    name: "Street Noir & Drops",
    concept: "Urban Streetwear, Sneakerheads & Exclusive Merch",
    mode: "dark",
    style: "solid",
    previewGradient: "linear-gradient(135deg, #09090b 0%, #18181b 60%, #27272a 100%)",
    accentDot: "#84cc16",
    fontHeading: "Inter",
    fontBody: "Inter",
    borderRadius: "0px",
    cardStyle: "portrait-quickadd",
    colors: {
      accent: "#84cc16",
      accentForeground: "#09090b",
      background: "#09090b",
      foreground: "#f4f4f5",
      card: "#18181b",
      cardForeground: "#f4f4f5",
      border: "rgba(255, 255, 255, 0.14)",
      muted: "#121215",
      mutedForeground: "#a1a1aa",
      sidebar: "#09090b",
      sidebarForeground: "#e4e4e7",
      sidebarBorder: "rgba(255, 255, 255, 0.08)",
    },
  },
  {
    id: "crimson-velvet",
    name: "Crimson Velvet & Bloom",
    concept: "Luxury Fragrances, Cosmetics & Evening Wear",
    mode: "dark",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #160309 0%, #310714 60%, #500720 100%)",
    accentDot: "#fb7185",
    fontHeading: "Playfair Display",
    fontBody: "Inter",
    borderRadius: "0.75rem",
    cardStyle: "portrait-hover",
    colors: {
      accent: "#fb7185",
      accentForeground: "#160309",
      background: "#130207",
      foreground: "#ffe4e6",
      card: "#260610",
      cardForeground: "#ffe4e6",
      border: "rgba(251, 113, 133, 0.24)",
      muted: "#1c040c",
      mutedForeground: "#f472b6",
      sidebar: "#0d0105",
      sidebarForeground: "#fecdd3",
      sidebarBorder: "rgba(251, 113, 133, 0.16)",
    },
  },
  {
    id: "emerald-vault",
    name: "Emerald Vault & Leather",
    concept: "Bespoke Leather Goods, Luggage & Luxury Watches",
    mode: "dark",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #021a12 0%, #063525 60%, #0a523a 100%)",
    accentDot: "#10b981",
    fontHeading: "Playfair Display",
    fontBody: "Inter",
    borderRadius: "0.375rem",
    cardStyle: "portrait-hover",
    colors: {
      accent: "#10b981",
      accentForeground: "#021a12",
      background: "#02150e",
      foreground: "#ecfdf5",
      card: "#062b1e",
      cardForeground: "#ecfdf5",
      border: "rgba(16, 185, 129, 0.24)",
      muted: "#041f15",
      mutedForeground: "#6ee7b7",
      sidebar: "#01100b",
      sidebarForeground: "#d1fae5",
      sidebarBorder: "rgba(16, 185, 129, 0.15)",
    },
  },
  {
    id: "tokyo-neon",
    name: "Tokyo Neon Arcade",
    concept: "Anime Merch, Pop Culture Collectibles & Neon Apparel",
    mode: "dark",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #120324 0%, #27074e 60%, #4a0d8e 100%)",
    accentDot: "#c084fc",
    fontHeading: "Plus Jakarta Sans",
    fontBody: "Inter",
    borderRadius: "1rem",
    cardStyle: "square-minimal",
    colors: {
      accent: "#c084fc",
      accentForeground: "#120324",
      background: "#0f021e",
      foreground: "#f5f3ff",
      card: "#20063f",
      cardForeground: "#f5f3ff",
      border: "rgba(192, 132, 252, 0.25)",
      muted: "#17042f",
      mutedForeground: "#d8b4fe",
      sidebar: "#0b0116",
      sidebarForeground: "#ede9fe",
      sidebarBorder: "rgba(192, 132, 252, 0.16)",
    },
  },

  // ==================== LIGHT MOODS (Daylight / Clean / Warm / Organic) ====================
  {
    id: "tanti-heritage",
    name: "Tanti Heritage & Clay",
    concept: "Artisanal Handloom, Pure Linen & Heritage Lifestyle",
    mode: "light",
    style: "solid",
    previewGradient: "linear-gradient(135deg, #fdfbf7 0%, #f7f3ec 60%, #ece5d8 100%)",
    accentDot: "#c85a38",
    fontHeading: "Fraunces",
    fontBody: "Inter",
    borderRadius: "0.5rem",
    cardStyle: "portrait-hover",
    colors: {
      accent: "#c85a38",
      accentForeground: "#ffffff",
      background: "#faf8f5",
      foreground: "#1c1a17",
      card: "#ffffff",
      cardForeground: "#1c1a17",
      border: "#e8e3d8",
      muted: "#f2ece1",
      mutedForeground: "#786d5e",
      sidebar: "#f4eee4",
      sidebarForeground: "#1c1a17",
      sidebarBorder: "#e4dcce",
    },
  },
  {
    id: "nordic-minimal",
    name: "Nordic Minimalist",
    concept: "Scandinavian Furniture, Modern Ceramics & Homeware",
    mode: "light",
    style: "solid",
    previewGradient: "linear-gradient(135deg, #ffffff 0%, #f8fafc 60%, #e2e8f0 100%)",
    accentDot: "#2563eb",
    fontHeading: "Inter",
    fontBody: "Inter",
    borderRadius: "0.25rem",
    cardStyle: "square-minimal",
    colors: {
      accent: "#2563eb",
      accentForeground: "#ffffff",
      background: "#f8fafc",
      foreground: "#0f172a",
      card: "#ffffff",
      cardForeground: "#0f172a",
      border: "#e2e8f0",
      muted: "#f1f5f9",
      mutedForeground: "#64748b",
      sidebar: "#f1f5f9",
      sidebarForeground: "#0f172a",
      sidebarBorder: "#cbd5e1",
    },
  },
  {
    id: "blush-ivory",
    name: "Blush Ivory & Silk",
    concept: "Clean Skincare, Bridal Couture & Delicate Essentials",
    mode: "light",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #fff5f5 0%, #ffe4e6 60%, #fecdd3 100%)",
    accentDot: "#f43f5e",
    fontHeading: "Playfair Display",
    fontBody: "Plus Jakarta Sans",
    borderRadius: "0.75rem",
    cardStyle: "portrait-hover",
    colors: {
      accent: "#f43f5e",
      accentForeground: "#ffffff",
      background: "#fffbfb",
      foreground: "#2e0f18",
      card: "#ffffff",
      cardForeground: "#2e0f18",
      border: "#fecdd3",
      muted: "#ffe4e6",
      mutedForeground: "#9f1239",
      sidebar: "#fff0f2",
      sidebarForeground: "#2e0f18",
      sidebarBorder: "#fda4af",
    },
  },
  {
    id: "matcha-botanica",
    name: "Matcha Botanica",
    concept: "Eco-Friendly Fashion, Herbal Wellness & Organic Living",
    mode: "light",
    style: "solid",
    previewGradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%)",
    accentDot: "#16a34a",
    fontHeading: "Plus Jakarta Sans",
    fontBody: "Inter",
    borderRadius: "0.5rem",
    cardStyle: "portrait-hover",
    colors: {
      accent: "#16a34a",
      accentForeground: "#ffffff",
      background: "#f6fbf6",
      foreground: "#14532d",
      card: "#ffffff",
      cardForeground: "#14532d",
      border: "#bbf7d0",
      muted: "#dcfce7",
      mutedForeground: "#15803d",
      sidebar: "#ebfaee",
      sidebarForeground: "#14532d",
      sidebarBorder: "#86efac",
    },
  },
  {
    id: "amber-pantry",
    name: "Amber Pantry & Roastery",
    concept: "Specialty Coffee Roasters, Organic Honey & Artisanal Deli",
    mode: "light",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 60%, #fde68a 100%)",
    accentDot: "#d97706",
    fontHeading: "Fraunces",
    fontBody: "Inter",
    borderRadius: "0.5rem",
    cardStyle: "portrait-hover",
    colors: {
      accent: "#d97706",
      accentForeground: "#ffffff",
      background: "#fdfbf5",
      foreground: "#451a03",
      card: "#ffffff",
      cardForeground: "#451a03",
      border: "#fde68a",
      muted: "#fef3c7",
      mutedForeground: "#92400e",
      sidebar: "#fef9c3",
      sidebarForeground: "#451a03",
      sidebarBorder: "#fcd34d",
    },
  },
  {
    id: "azure-sport",
    name: "Azure Athletics",
    concept: "Activewear, Athletic Footwear & Outdoor Performance",
    mode: "light",
    style: "solid",
    previewGradient: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 60%, #bae6fd 100%)",
    accentDot: "#0284c7",
    fontHeading: "Plus Jakarta Sans",
    fontBody: "Inter",
    borderRadius: "1.5rem",
    cardStyle: "square-minimal",
    colors: {
      accent: "#0284c7",
      accentForeground: "#ffffff",
      background: "#f8fafc",
      foreground: "#082f49",
      card: "#ffffff",
      cardForeground: "#082f49",
      border: "#bae6fd",
      muted: "#e0f2fe",
      mutedForeground: "#0369a1",
      sidebar: "#e0f2fe",
      sidebarForeground: "#082f49",
      sidebarBorder: "#7dd3fc",
    },
  },
  {
    id: "provence-lavender",
    name: "Provence Lavender & Bath",
    concept: "Natural Bath & Body, Aromatherapy & French Living",
    mode: "light",
    style: "solid",
    previewGradient: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 60%, #e9d5ff 100%)",
    accentDot: "#9333ea",
    fontHeading: "Playfair Display",
    fontBody: "Plus Jakarta Sans",
    borderRadius: "0.75rem",
    cardStyle: "portrait-hover",
    colors: {
      accent: "#9333ea",
      accentForeground: "#ffffff",
      background: "#fbf8fe",
      foreground: "#3b0764",
      card: "#ffffff",
      cardForeground: "#3b0764",
      border: "#e9d5ff",
      muted: "#f5ecfd",
      mutedForeground: "#7e22ce",
      sidebar: "#f6eeff",
      sidebarForeground: "#3b0764",
      sidebarBorder: "#d8b4fe",
    },
  },
  {
    id: "monochrome-studio",
    name: "Monochrome Studio",
    concept: "High-Fashion Monochrome, Photography Prints & Modernist Architecture",
    mode: "light",
    style: "solid",
    previewGradient: "linear-gradient(135deg, #ffffff 0%, #f4f4f5 60%, #e4e4e7 100%)",
    accentDot: "#18181b",
    fontHeading: "Inter",
    fontBody: "Inter",
    borderRadius: "0px",
    cardStyle: "square-minimal",
    colors: {
      accent: "#18181b",
      accentForeground: "#ffffff",
      background: "#fafafa",
      foreground: "#09090b",
      card: "#ffffff",
      cardForeground: "#09090b",
      border: "#e4e4e7",
      muted: "#f4f4f5",
      mutedForeground: "#71717a",
      sidebar: "#f4f4f5",
      sidebarForeground: "#09090b",
      sidebarBorder: "#d4d4d8",
    },
  },
];

export const DEFAULT_DARK_THEME_ID = "harbor-midnight";
export const DEFAULT_LIGHT_THEME_ID = "tanti-heritage";

export function getEcommerceThemePreset(id: string): EcommerceThemePreset {
  return ECOMMERCE_THEMES.find((t) => t.id === id) ?? ECOMMERCE_THEMES[8]!;
}

/**
 * Converts a hex color string to space-separated RGB numbers ("r g b").
 */
function hexToRgb(hex?: string): string | null {
  if (!hex) return null;
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r} ${g} ${b}`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `${r} ${g} ${b}`;
  }
  return null;
}

/**
 * Finds the closest matching preset ID given current theme tokens (hex colors).
 */
export function findMatchingPresetId(
  primaryColor?: string,
  canvasColor?: string
): string {
  if (!primaryColor) return DEFAULT_LIGHT_THEME_ID;
  const pNorm = primaryColor.toLowerCase();
  const cNorm = canvasColor?.toLowerCase() || "";

  // Check exact accent or background matches
  const match = ECOMMERCE_THEMES.find(
    (t) =>
      t.colors.accent.toLowerCase() === pNorm ||
      (cNorm && t.colors.background.toLowerCase() === cNorm)
  );
  if (match) return match.id;

  // Check if dark canvas
  if (cNorm && (cNorm.startsWith("#0") || cNorm.startsWith("#1"))) {
    return DEFAULT_DARK_THEME_ID;
  }
  return DEFAULT_LIGHT_THEME_ID;
}

/**
 * Maps an EcommerceThemePreset to TenantTheme fields for drafting or saving.
 */
export function presetToTenantTokens(
  preset: EcommerceThemePreset,
  styleOverride?: ThemeStyle
) {
  return {
    name: preset.name,
    primaryColor: preset.colors.accent,
    secondaryColor: preset.colors.accentForeground,
    accentColor: preset.colors.accent,
    canvasColor: preset.colors.background,
    surfaceColor: preset.colors.card,
    inkColor: preset.colors.foreground,
    fontHeading: preset.fontHeading,
    fontBody: preset.fontBody,
    borderRadius: preset.borderRadius,
    cardStyle: preset.cardStyle,
  };
}

export const THEME_CSS_STORAGE_KEY = "tanti_theme_css";

const THEME_CSS_KEYS = [
  "--primary",
  "--primary-foreground",
  "--primary-soft",
  "--ring",
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--border",
  "--input",
  "--muted",
  "--muted-foreground",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-border",
  "--sidebar-primary",
  "--sidebar-accent",
  "--radius",
  "--clay",
  "--clay-dark",
  "--clay-soft",
  "--canvas",
  "--subtle",
  "--line",
  "--line-strong",
  "--surface",
  "--ink",
  "--ink-soft",
  "--ink-muted",
  "--font-display",
  "--font-heading",
  "--font-sans",
];

function ensureThemeFonts(...families: Array<string | undefined>) {
  families.forEach((family) => {
    if (!family || family === "Inter" || family === "Fraunces") return;
    const id = `theme-font-${family.replace(/\s+/g, "-").toLowerCase()}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  });
}

function snapshotThemeCss(root: HTMLElement) {
  try {
    const vars: Record<string, string> = {};
    THEME_CSS_KEYS.forEach((key) => {
      const value = root.style.getPropertyValue(key).trim();
      if (value) vars[key] = value;
    });
    localStorage.setItem(
      THEME_CSS_STORAGE_KEY,
      JSON.stringify({
        dark: root.classList.contains("dark"),
        style: root.getAttribute("data-theme-style") || "solid",
        card: root.getAttribute("data-card-style") || "",
        vars,
      })
    );
  } catch {
    // ignore quota or private-mode errors
  }
}

/**
 * Applies all CSS variables of the given theme preset into the document root.
 * Sets standard Tailwind/shadcn tokens, background gradients, and space-separated RGB tokens.
 */
export function applyEcommerceTheme(
  preset: EcommerceThemePreset,
  styleOverride?: ThemeStyle
) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const isDark = preset.mode === "dark";
  const activeStyle = styleOverride ?? preset.style;

  // Toggle .dark class on <html>
  root.classList.toggle("dark", isDark);

  // Set style attribute (gradient vs solid)
  root.setAttribute("data-theme-style", activeStyle);

  // Set card layout ratio attribute
  if (preset.cardStyle) {
    root.setAttribute("data-card-style", preset.cardStyle);
  }

  // 1. Core primary and accent variables
  root.style.setProperty("--primary", preset.colors.accent);
  root.style.setProperty("--primary-foreground", preset.colors.accentForeground);
  root.style.setProperty(
    "--primary-soft",
    `color-mix(in srgb, ${preset.colors.accent} 15%, transparent)`
  );
  root.style.setProperty("--ring", preset.colors.accent);

  // 2. Background and surface
  root.style.setProperty("--background", preset.colors.background);
  root.style.setProperty("--foreground", preset.colors.foreground);

  root.style.setProperty("--card", preset.colors.card);
  root.style.setProperty("--card-foreground", preset.colors.cardForeground);

  root.style.setProperty("--popover", preset.colors.card);
  root.style.setProperty("--popover-foreground", preset.colors.cardForeground);

  // 3. Borders, inputs, and muted states
  root.style.setProperty("--border", preset.colors.border);
  root.style.setProperty("--input", preset.colors.border);

  root.style.setProperty("--muted", preset.colors.muted);
  root.style.setProperty("--muted-foreground", preset.colors.mutedForeground);

  // 4. Sidebar variables
  root.style.setProperty("--sidebar", preset.colors.sidebar);
  root.style.setProperty("--sidebar-foreground", preset.colors.sidebarForeground);
  root.style.setProperty("--sidebar-border", preset.colors.sidebarBorder);
  root.style.setProperty("--sidebar-primary", preset.colors.accent);
  root.style.setProperty("--sidebar-accent", preset.colors.muted);

  // 5. Border radius
  if (preset.borderRadius) {
    root.style.setProperty("--radius", preset.borderRadius);
  }

  // 6. Space-separated RGB variables for Tanti / Orvio components (--clay, --canvas, --surface, --ink, --line, --subtle)
  const clayRgb = hexToRgb(preset.colors.accent);
  const canvasRgb = hexToRgb(preset.colors.background);
  const surfaceRgb = hexToRgb(preset.colors.card);
  const inkRgb = hexToRgb(preset.colors.foreground);

  if (clayRgb) {
    root.style.setProperty("--clay", clayRgb);
    // Darker and softer shades of primary
    const clean = preset.colors.accent.replace("#", "").trim();
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        const dr = Math.max(0, Math.round(r * 0.8));
        const dg = Math.max(0, Math.round(g * 0.8));
        const db = Math.max(0, Math.round(b * 0.8));
        root.style.setProperty("--clay-dark", `${dr} ${dg} ${db}`);

        const sr = Math.min(255, Math.round(r + (255 - r) * 0.85));
        const sg = Math.min(255, Math.round(g + (255 - g) * 0.85));
        const sb = Math.min(255, Math.round(b + (255 - b) * 0.85));
        root.style.setProperty("--clay-soft", `${sr} ${sg} ${sb}`);
      }
    }
  }

  if (canvasRgb) {
    root.style.setProperty("--canvas", canvasRgb);
    // Derive line and subtle from canvas
    const clean = preset.colors.background.replace("#", "").trim();
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        const subR = isDark ? Math.min(255, Math.round(r + 14)) : Math.max(0, Math.round(r * 0.96));
        const subG = isDark ? Math.min(255, Math.round(g + 14)) : Math.max(0, Math.round(g * 0.96));
        const subB = isDark ? Math.min(255, Math.round(b + 14)) : Math.max(0, Math.round(b * 0.96));
        root.style.setProperty("--subtle", `${subR} ${subG} ${subB}`);

        const lineR = isDark ? Math.min(255, Math.round(r + 28)) : Math.max(0, Math.round(r * 0.91));
        const lineG = isDark ? Math.min(255, Math.round(g + 28)) : Math.max(0, Math.round(g * 0.91));
        const lineB = isDark ? Math.min(255, Math.round(b + 28)) : Math.max(0, Math.round(b * 0.91));
        root.style.setProperty("--line", `${lineR} ${lineG} ${lineB}`);
      }
    }
  }

  if (surfaceRgb) {
    root.style.setProperty("--surface", surfaceRgb);
  }

  if (inkRgb) {
    root.style.setProperty("--ink", inkRgb);
    const clean = preset.colors.foreground.replace("#", "").trim();
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        const softR = isDark ? Math.max(0, Math.round(r * 0.8)) : Math.round(r * 0.7 + 255 * 0.3);
        const softG = isDark ? Math.max(0, Math.round(g * 0.8)) : Math.round(g * 0.7 + 255 * 0.3);
        const softB = isDark ? Math.max(0, Math.round(b * 0.8)) : Math.round(b * 0.7 + 255 * 0.3);
        root.style.setProperty("--ink-soft", `${softR} ${softG} ${softB}`);

        const mutedR = isDark ? Math.max(0, Math.round(r * 0.6)) : Math.round(r * 0.45 + 255 * 0.55);
        const mutedG = isDark ? Math.max(0, Math.round(g * 0.6)) : Math.round(g * 0.45 + 255 * 0.55);
        const mutedB = isDark ? Math.max(0, Math.round(b * 0.6)) : Math.round(b * 0.45 + 255 * 0.55);
        root.style.setProperty("--ink-muted", `${mutedR} ${mutedG} ${mutedB}`);
      }
    }
  }

  const line = root.style.getPropertyValue("--line");
  if (line) {
    const parts = line.trim().split(/\s+/).map((n) => Number(n));
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
      const [r, g, b] = parts;
      const strong = isDark
        ? [r, g, b].map((n) => Math.min(255, Math.round(n + 18)))
        : [r, g, b].map((n) => Math.max(0, Math.round(n * 0.92)));
      root.style.setProperty("--line-strong", strong.join(" "));
    }
  }

  if (preset.fontHeading) {
    root.style.setProperty("--font-display", `'${preset.fontHeading}', 'Fraunces', Georgia, serif`);
    root.style.setProperty("--font-heading", `'${preset.fontHeading}', 'Fraunces', Georgia, serif`);
  }
  if (preset.fontBody) {
    root.style.setProperty("--font-sans", `'${preset.fontBody}', 'Inter', system-ui, sans-serif`);
  }

  ensureThemeFonts(preset.fontHeading, preset.fontBody);
  snapshotThemeCss(root);
}
