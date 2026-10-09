// Standard default design tokens for new store provisioning
export const DEFAULT_THEME_TOKENS = {
  primaryColor: '#B5562F',
  secondaryColor: '#2E3A67',
  accentColor: '#5C6B4E',
  canvasColor: '#F7F4EF',
  surfaceColor: '#FFFFFF',
  inkColor: '#1C1A17',
  fontHeading: 'Fraunces',
  fontBody: 'Inter',
  borderRadius: '0.5rem',
  cardStyle: 'portrait-hover',
};

// Standard fixed landing page sections
export const DEFAULT_LANDING_SECTIONS = [
  { sectionType: 'HERO_BANNER', label: 'Hero banner', isVisible: true },
  { sectionType: 'CATEGORY_GRID', label: 'Shop by category', isVisible: true },
  { sectionType: 'BESTSELLERS', label: 'Best sellers', isVisible: true },
  { sectionType: 'SUMMER_SPOTLIGHT', label: 'Spotlight banner', isVisible: true },
  { sectionType: 'NEW_ARRIVALS', label: 'New arrivals', isVisible: true },
  { sectionType: 'TRUST_POINTS', label: 'Brand trust points', isVisible: true },
  { sectionType: 'TESTIMONIALS', label: 'Customer reviews', isVisible: true },
  { sectionType: 'RECOMMENDED', label: 'Recommended products', isVisible: true },
];
