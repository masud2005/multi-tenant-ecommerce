export const LANDING_STORAGE_KEY = 'orvio_landing_config';
export const LANDING_CHANGE_EVENT = 'orvio-landing-changed';

export const LANDING_SECTION_IDS = [
  'hero',
  'categories',
  'featured',
  'promo',
  'picks',
  'trust',
  'reviews',
  'newsletter',
] as const;

export type LandingSectionId = (typeof LANDING_SECTION_IDS)[number];

export interface LandingDesignOption {
  id: string;
  name: string;
  summary: string;
}

export interface LandingSectionSetting {
  visible: boolean;
  design: string;
}

export type LandingDesigns = Record<LandingSectionId, LandingSectionSetting>;

export interface LandingHeroSlide {
  id: string;
  image: string;
  alt: string;
}

export const MAX_HERO_SLIDES = 5;

export interface LandingConfig {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  heroScript: string;
  /** Custom hero carousel images. Empty = fall back to collections/products. */
  heroSlides: LandingHeroSlide[];
  featuredEyebrow: string;
  featuredTitle: string;
  featuredSubtitle: string;
  featuredCta: string;
  promoEyebrow: string;
  promoTitle: string;
  promoSubtitle: string;
  promoCta: string;
  promoScript: string;
  /** Custom offer/promo image. Empty = fall back to first collection/product image. */
  promoImage: string;
  promoImageAlt: string;
  picksEyebrow: string;
  picksTitle: string;
  picksSubtitle: string;
  reviewsEyebrow: string;
  reviewsTitle: string;
  reviewsSubtitle: string;
  newsletterEyebrow: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
  designs: LandingDesigns;
}

export const SECTION_DESIGNS: Record<LandingSectionId, LandingDesignOption[]> = {
  hero: [
    { id: 'band', name: 'Band', summary: 'Full-bleed photo. Copy sits on the image, and the header rests on top until you scroll.' },
    { id: 'panel', name: 'Panel', summary: 'Photo and copy in two separate panels.' },
  ],
  categories: [
    { id: 'grid', name: 'Grid', summary: 'Category name and image in a wrapping grid.' },
    { id: 'strip', name: 'Strip', summary: 'The same name and image in a horizontal row.' },
  ],
  featured: [
    { id: 'row', name: 'Row', summary: 'Intro beside three equal collection cards.' },
    { id: 'feature', name: 'Feature', summary: 'Intro above one large card and two smaller cards.' },
  ],
  promo: [
    { id: 'pair', name: 'Pair', summary: 'Offer copy beside the offer image.' },
    { id: 'aside', name: 'Aside', summary: 'Offer image on the left, copy on the right.' },
  ],
  picks: [
    { id: 'grid', name: 'Grid', summary: 'Four products in an even row.' },
    { id: 'feature', name: 'Feature', summary: 'One lead product beside the rest.' },
  ],
  trust: [
    { id: 'row', name: 'Row', summary: 'Promises in one bordered row.' },
    { id: 'cards', name: 'Cards', summary: 'Each promise in its own card.' },
  ],
  reviews: [
    { id: 'cards', name: 'Cards', summary: 'Three review cards side by side.' },
    { id: 'quotes', name: 'Quotes', summary: 'Heading beside a stack of quotes.' },
  ],
  newsletter: [
    { id: 'ink', name: 'Ink', summary: 'Dark band using the theme ink colour.' },
    { id: 'surface', name: 'Surface', summary: 'Light card on the page background.' },
  ],
};

export const SECTION_LABELS: Record<LandingSectionId, string> = {
  hero: 'Hero',
  categories: 'Categories',
  featured: 'Featured looks',
  promo: 'Offer',
  picks: 'Top picks',
  trust: 'Promises',
  reviews: 'Reviews',
  newsletter: 'Newsletter',
};

function defaultDesigns(): LandingDesigns {
  return LANDING_SECTION_IDS.reduce((map, id) => {
    map[id] = { visible: true, design: SECTION_DESIGNS[id][0].id };
    return map;
  }, {} as LandingDesigns);
}

const COPY_DEFAULTS = {
  heroEyebrow: 'Style meets comfort',
  heroTitle: 'Fashion That Fits Your Story',
  heroSubtitle:
    'Discover timeless styles, modern trends and premium quality — all in one place. Dress better, feel better.',
  heroCta: 'Shop Now',
  heroScript: 'Your Style, Our Passion',
  featuredEyebrow: 'Featured collection',
  featuredTitle: 'New Arrivals Just for You',
  featuredSubtitle: 'Explore the latest trends and handpicked styles that bring out the best in you.',
  featuredCta: 'Shop Collection',
  promoEyebrow: 'Limited time offer',
  promoTitle: 'Flat 20% Off',
  promoSubtitle: 'On selected styles',
  promoCta: 'Shop Now',
  promoScript: 'More Style, Less Spend',
  picksEyebrow: 'Best sellers',
  picksTitle: 'Our Top Picks',
  picksSubtitle: 'Loved by many, styled by you.',
  reviewsEyebrow: 'What our customers say',
  reviewsTitle: 'Real People, Real Stories',
  reviewsSubtitle: "We're proud to be part of your style journey.",
  newsletterEyebrow: 'Stay in style',
  newsletterTitle: 'Subscribe to Our Newsletter',
  newsletterSubtitle: 'Get the latest updates, new arrivals and exclusive offers.',
};

export const DEFAULT_LANDING_CONFIG: LandingConfig = {
  ...COPY_DEFAULTS,
  heroSlides: [],
  promoImage: '',
  promoImageAlt: '',
  designs: defaultDesigns(),
};

function asText(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 220) : fallback;
}

function asImageUrl(value: unknown, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function readHeroSlides(value: unknown): LandingHeroSlide[] {
  if (!Array.isArray(value)) return [];
  const slides: LandingHeroSlide[] = [];
  for (let i = 0; i < value.length; i += 1) {
    const item = value[i];
    if (!item || typeof item !== 'object') continue;
    const record = item as Partial<LandingHeroSlide>;
    const image = asImageUrl(record.image);
    if (!image) continue;
    slides.push({
      id: typeof record.id === 'string' && record.id.trim() ? record.id.trim() : `slide-${i + 1}`,
      image,
      alt:
        typeof record.alt === 'string' && record.alt.trim()
          ? record.alt.trim().slice(0, 120)
          : `Hero slide ${slides.length + 1}`,
    });
    if (slides.length >= MAX_HERO_SLIDES) break;
  }
  return slides;
}

export function resolveDesign(sectionId: LandingSectionId, selected: string) {
  const options = SECTION_DESIGNS[sectionId];
  return options.some((option) => option.id === selected) ? selected : options[0].id;
}

function readDesigns(value: unknown, legacyTemplate: unknown): LandingDesigns {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const useSecond = legacyTemplate === 'atelier';

  return LANDING_SECTION_IDS.reduce((map, id) => {
    const entry = source[id];
    const options = SECTION_DESIGNS[id];
    if (entry && typeof entry === 'object') {
      const record = entry as Partial<LandingSectionSetting>;
      map[id] = {
        visible: typeof record.visible === 'boolean' ? record.visible : true,
        design: resolveDesign(id, String(record.design || '')),
      };
      return map;
    }

    map[id] = {
      visible: typeof entry === 'boolean' ? entry : true,
      design: useSecond ? options[1].id : options[0].id,
    };
    return map;
  }, {} as LandingDesigns);
}

function isDesignMap(value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const hero = (value as Record<string, unknown>).hero;
  return !!hero && typeof hero === 'object' && 'design' in hero;
}

export function normalizeLandingConfig(value: unknown): LandingConfig {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const storedDesigns = isDesignMap(source.designs)
    ? source.designs
    : isDesignMap(source.sections)
      ? source.sections
      : source.sections;
  const base = DEFAULT_LANDING_CONFIG;

  return {
    heroEyebrow: asText(source.heroEyebrow, base.heroEyebrow),
    heroTitle: asText(source.heroTitle, base.heroTitle),
    heroSubtitle: asText(source.heroSubtitle, base.heroSubtitle),
    heroCta: asText(source.heroCta, base.heroCta),
    heroScript: asText(source.heroScript, base.heroScript),
    heroSlides: readHeroSlides(source.heroSlides),
    featuredEyebrow: asText(source.featuredEyebrow, base.featuredEyebrow),
    featuredTitle: asText(source.featuredTitle, base.featuredTitle),
    featuredSubtitle: asText(source.featuredSubtitle, base.featuredSubtitle),
    featuredCta: asText(source.featuredCta, base.featuredCta),
    promoEyebrow: asText(source.promoEyebrow, base.promoEyebrow),
    promoTitle: asText(source.promoTitle, base.promoTitle),
    promoSubtitle: asText(source.promoSubtitle, base.promoSubtitle),
    promoCta: asText(source.promoCta, base.promoCta),
    promoScript: asText(source.promoScript, base.promoScript),
    promoImage: asImageUrl(source.promoImage),
    promoImageAlt: asText(source.promoImageAlt, ''),
    picksEyebrow: asText(source.picksEyebrow, base.picksEyebrow),
    picksTitle: asText(source.picksTitle, base.picksTitle),
    picksSubtitle: asText(source.picksSubtitle, base.picksSubtitle),
    reviewsEyebrow: asText(source.reviewsEyebrow, base.reviewsEyebrow),
    reviewsTitle: asText(source.reviewsTitle, base.reviewsTitle),
    reviewsSubtitle: asText(source.reviewsSubtitle, base.reviewsSubtitle),
    newsletterEyebrow: asText(source.newsletterEyebrow, base.newsletterEyebrow),
    newsletterTitle: asText(source.newsletterTitle, base.newsletterTitle),
    newsletterSubtitle: asText(source.newsletterSubtitle, base.newsletterSubtitle),
    designs: readDesigns(storedDesigns, source.templateId),
  };
}

export function readLandingConfig(): LandingConfig {
  if (typeof window === 'undefined') return DEFAULT_LANDING_CONFIG;
  try {
    const raw = window.localStorage.getItem(LANDING_STORAGE_KEY);
    if (!raw) return DEFAULT_LANDING_CONFIG;
    return normalizeLandingConfig(JSON.parse(raw));
  } catch {
    return DEFAULT_LANDING_CONFIG;
  }
}

export function writeLandingConfig(config: LandingConfig) {
  if (typeof window === 'undefined') return;
  const next = normalizeLandingConfig(config);
  window.localStorage.setItem(LANDING_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(LANDING_CHANGE_EVENT));
}
