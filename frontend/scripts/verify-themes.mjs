import assert from 'node:assert';

// 1. Mock minimal DOM environment for applyEcommerceTheme test
const styleProperties = new Map();
const attributes = new Map();
const classList = new Set();

globalThis.document = {
  documentElement: {
    classList: {
      toggle(cls, force) {
        if (force === undefined) {
          if (classList.has(cls)) classList.delete(cls);
          else classList.add(cls);
        } else if (force) {
          classList.add(cls);
        } else {
          classList.delete(cls);
        }
      },
      contains(cls) {
        return classList.has(cls);
      },
      add(cls) {
        classList.add(cls);
      },
      remove(cls) {
        classList.delete(cls);
      },
    },
    setAttribute(name, val) {
      attributes.set(name, String(val));
    },
    getAttribute(name) {
      return attributes.get(name);
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    style: {
      setProperty(prop, val) {
        styleProperties.set(prop, String(val));
      },
      getPropertyValue(prop) {
        return styleProperties.get(prop) || '';
      },
      removeProperty(prop) {
        styleProperties.delete(prop);
      },
    },
  },
};

// 2. Import modules dynamically
const {
  ECOMMERCE_THEMES,
  getEcommerceThemePreset,
  applyEcommerceTheme,
  DEFAULT_DARK_THEME_ID,
  DEFAULT_LIGHT_THEME_ID,
  findMatchingPresetId,
  presetToTenantTokens,
} = await import('../src/components/dashboard/theme/ecommerce-themes.ts');

console.log('--- STARTING VERIFICATION: E-COMMERCE THEMES ENGINE ---');

// Test 1: Count and unique IDs
console.log('1. Checking preset counts and uniqueness...');
assert.strictEqual(ECOMMERCE_THEMES.length, 16, 'Expected exactly 16 curated e-commerce presets');

const ids = new Set();
let darkCount = 0;
let lightCount = 0;

for (const preset of ECOMMERCE_THEMES) {
  assert(!ids.has(preset.id), `Duplicate preset id found: ${preset.id}`);
  ids.add(preset.id);

  assert(preset.name && preset.name.length > 0, `Missing name for preset: ${preset.id}`);
  assert(preset.concept && preset.concept.length > 0, `Missing concept for preset: ${preset.id}`);
  assert(['light', 'dark'].includes(preset.mode), `Invalid mode for preset ${preset.id}: ${preset.mode}`);
  assert(['gradient', 'solid'].includes(preset.style), `Invalid style for preset ${preset.id}: ${preset.style}`);
  assert(preset.previewGradient.includes('linear-gradient'), `Invalid preview gradient for preset ${preset.id}`);
  assert(preset.accentDot.startsWith('#'), `Invalid accent dot hex for preset ${preset.id}: ${preset.accentDot}`);

  if (preset.mode === 'dark') darkCount++;
  if (preset.mode === 'light') lightCount++;

  // Verify all required color tokens
  const { colors } = preset;
  const requiredColors = [
    'accent',
    'accentForeground',
    'background',
    'foreground',
    'card',
    'cardForeground',
    'border',
    'muted',
    'mutedForeground',
    'sidebar',
    'sidebarForeground',
    'sidebarBorder',
  ];

  for (const key of requiredColors) {
    assert(
      typeof colors[key] === 'string' && colors[key].length > 0,
      `Preset ${preset.id} missing color token: ${key}`
    );
  }
}

assert.strictEqual(darkCount, 8, 'Expected exactly 8 dark mode e-commerce presets');
assert.strictEqual(lightCount, 8, 'Expected exactly 8 light mode e-commerce presets');
console.log(`✓ 16 presets verified: ${darkCount} Dark (Midnight), ${lightCount} Light (Daylight).`);

// Test 2: Verify Defaults
console.log('2. Checking default theme presets...');
assert.strictEqual(DEFAULT_DARK_THEME_ID, 'harbor-midnight');
assert.strictEqual(DEFAULT_LIGHT_THEME_ID, 'tanti-heritage');

const darkDefault = getEcommerceThemePreset(DEFAULT_DARK_THEME_ID);
assert.strictEqual(darkDefault.id, 'harbor-midnight');
assert.strictEqual(darkDefault.mode, 'dark');

const lightDefault = getEcommerceThemePreset(DEFAULT_LIGHT_THEME_ID);
assert.strictEqual(lightDefault.id, 'tanti-heritage');
assert.strictEqual(lightDefault.mode, 'light');

const fallback = getEcommerceThemePreset('non-existent-theme-xyz');
assert(fallback !== undefined, 'Fallback preset must not be undefined');
assert.strictEqual(fallback.id, ECOMMERCE_THEMES[8].id);
console.log('✓ Default presets and fallbacks verified.');

// Test 3: applyEcommerceTheme DOM injection
console.log('3. Checking applyEcommerceTheme DOM injection...');
styleProperties.clear();
attributes.clear();
classList.clear();

const testPreset = getEcommerceThemePreset('emerald-vault');
applyEcommerceTheme(testPreset, 'gradient');

assert.strictEqual(classList.has('dark'), true, 'Root element should have .dark class for dark preset');
assert.strictEqual(attributes.get('data-theme-style'), 'gradient', 'Root element should have data-theme-style="gradient"');
assert.strictEqual(styleProperties.get('--primary'), testPreset.colors.accent);
assert.strictEqual(styleProperties.get('--background'), testPreset.colors.background);
assert.strictEqual(styleProperties.get('--card'), testPreset.colors.card);
assert.strictEqual(styleProperties.get('--foreground'), testPreset.colors.foreground);
assert.strictEqual(styleProperties.get('--sidebar'), testPreset.colors.sidebar);
assert(styleProperties.has('--clay'), 'Must inject RGB --clay for Tanti brand components');
assert(styleProperties.has('--canvas'), 'Must inject RGB --canvas for Tanti brand components');
assert(styleProperties.has('--surface'), 'Must inject RGB --surface for Tanti brand components');
assert(styleProperties.has('--ink'), 'Must inject RGB --ink for Tanti brand components');
console.log('✓ Dark preset CSS properties and attributes successfully applied to document root.');

// Test 4: Daylight mode switch
console.log('4. Checking light theme DOM application...');
applyEcommerceTheme(lightDefault, 'solid');
assert.strictEqual(classList.has('dark'), false, 'Root element should not have .dark class for light preset');
assert.strictEqual(attributes.get('data-theme-style'), 'solid', 'Root element should have data-theme-style="solid"');
assert.strictEqual(styleProperties.get('--primary'), lightDefault.colors.accent);
console.log('✓ Light preset successfully removed .dark and updated styles.');

// Test 5: findMatchingPresetId and presetToTenantTokens
console.log('5. Checking preset mapping functions...');
const matchedDark = findMatchingPresetId(darkDefault.colors.accent, darkDefault.colors.background);
assert.strictEqual(matchedDark, 'harbor-midnight');

const tokens = presetToTenantTokens(darkDefault);
assert.strictEqual(tokens.primaryColor, darkDefault.colors.accent);
assert.strictEqual(tokens.canvasColor, darkDefault.colors.background);
assert.strictEqual(tokens.surfaceColor, darkDefault.colors.card);
assert.strictEqual(tokens.inkColor, darkDefault.colors.foreground);
console.log('✓ Preset tokens and color matcher verified.');

console.log('--- ALL E-COMMERCE THEME TESTS PASSED SUCCESSFULLY! ---');

