import { type CSSResultGroup, css as litCSS, unsafeCSS } from 'lit'

import type { ThemeType } from '@reown/appkit-common'

import { styles as allStyles, tokens } from './ThemeConstantsUtil.js'
import type { ThemeVariables } from './TypeUtil.js'

const PREFIX_VAR = '--apkt'

function normalizeThemeVariables(themeVariables?: ThemeVariables): Record<string, string | number> {
  if (!themeVariables) {
    return {}
  }

  const normalized: Record<string, string | number> = {}

  normalized['font-family'] =
    themeVariables['--apkt-font-family'] ?? themeVariables['--w3m-font-family'] ?? 'KHTeka'

  // Fall back to the base font (so one --apkt-font-family styles mono too), then the mono default.
  normalized['font-family-mono'] =
    themeVariables['--apkt-font-family-mono'] ??
    themeVariables['--w3m-font-family-mono'] ??
    themeVariables['--apkt-font-family'] ??
    themeVariables['--w3m-font-family'] ??
    'KHTekaMono'

  normalized['accent'] =
    themeVariables['--apkt-accent'] ?? themeVariables['--w3m-accent'] ?? '#0988F0'

  normalized['color-mix'] =
    themeVariables['--apkt-color-mix'] ?? themeVariables['--w3m-color-mix'] ?? '#000'

  normalized['color-mix-strength'] =
    themeVariables['--apkt-color-mix-strength'] ?? themeVariables['--w3m-color-mix-strength'] ?? 0

  normalized['font-size-master'] =
    themeVariables['--apkt-font-size-master'] ?? themeVariables['--w3m-font-size-master'] ?? '10px'

  normalized['border-radius-master'] =
    themeVariables['--apkt-border-radius-master'] ??
    themeVariables['--w3m-border-radius-master'] ??
    '4px'

  if (themeVariables['--apkt-z-index'] !== undefined) {
    normalized['z-index'] = themeVariables['--apkt-z-index']
  } else if (themeVariables['--w3m-z-index'] !== undefined) {
    normalized['z-index'] = themeVariables['--w3m-z-index']
  }

  return normalized
}

export const ThemeHelperUtil = {
  /**
   * Recursively transforms a nested styles object into a new object with CSS variable strings.
   * @param styles - The original styles object to transform.
   */
  createCSSVariables<styles extends Record<string, unknown>>(styles: styles) {
    const cssVariables = {} as styles
    const cssVariablesVarPrefix = {} as styles

    function createVars(
      _styles: Record<string, unknown>,
      parent: Record<string, unknown>,
      currentVar = ''
    ) {
      for (const [styleKey, styleValue] of Object.entries(_styles)) {
        const variable = currentVar ? `${currentVar}-${styleKey}` : styleKey

        if (styleValue && typeof styleValue === 'object' && Object.keys(styleValue).length) {
          parent[styleKey] = {}
          createVars(
            styleValue as Record<string, unknown>,
            parent[styleKey] as Record<string, unknown>,
            variable
          )
        } else if (typeof styleValue === 'string') {
          parent[styleKey] = `${PREFIX_VAR}-${variable}`
        }
      }
    }

    function addVarsPrefix(_styles: Record<string, unknown>, parent: Record<string, unknown>) {
      for (const [key, value] of Object.entries(_styles)) {
        if (value && typeof value === 'object') {
          parent[key] = {}
          addVarsPrefix(value as Record<string, unknown>, parent[key] as Record<string, unknown>)
        } else if (typeof value === 'string') {
          parent[key] = `var(${value})`
        }
      }
    }

    createVars(styles, cssVariables)
    addVarsPrefix(cssVariables, cssVariablesVarPrefix)

    return { cssVariables, cssVariablesVarPrefix }
  },
  /**
   * Assigns CSS variables to the values in a styles object.
   * @param vars - The variables object to transform.
   * @param styles - The mapping of style keys to CSS variable names.
   */
  assignCSSVariables<vars extends Record<string, unknown>, styles extends Record<string, unknown>>(
    vars: vars,
    styles: styles
  ): Record<string, string> {
    const assignedCSSVariables: Record<string, string> = {}

    function assignVars(
      _vars: Record<string, unknown>,
      _styles: Record<string, unknown>,
      variable?: string
    ) {
      for (const [varKey, varValue] of Object.entries(_vars)) {
        const nextVariable = variable ? `${variable}-${varKey}` : varKey

        const styleValues = _styles[varKey]

        if (varValue && typeof varValue === 'object') {
          assignVars(
            varValue as Record<string, unknown>,
            styleValues as Record<string, unknown>,
            nextVariable
          )
        } else if (typeof styleValues === 'string') {
          assignedCSSVariables[`${PREFIX_VAR}-${nextVariable}`] = styleValues
        }
      }
    }

    assignVars(vars, styles)

    return assignedCSSVariables
  },
  /**
   * Creates a string of CSS variables for the root element.
   * @param theme - The theme type (light/dark)
   * @param themeVariables - Optional theme variables for customization
   */
  createRootStyles(theme: ThemeType, themeVariables?: ThemeVariables) {
    const styles = {
      ...allStyles,
      tokens: { ...allStyles.tokens, theme: theme === 'light' ? tokens.light : tokens.dark }
    }

    const { cssVariables } = ThemeHelperUtil.createCSSVariables(styles)
    const assignedCSSVariables = ThemeHelperUtil.assignCSSVariables(cssVariables, styles)

    const w3mVariables = ThemeHelperUtil.generateW3MVariables(themeVariables)
    const w3mOverrides = ThemeHelperUtil.generateW3MOverrides(themeVariables)
    const scaledVariables = ThemeHelperUtil.generateScaledVariables(themeVariables)

    // Generate base variants for specific tokens
    const baseVariables = ThemeHelperUtil.generateBaseVariables(assignedCSSVariables)

    const allVariables = {
      ...assignedCSSVariables,
      ...baseVariables,
      ...w3mVariables,
      ...w3mOverrides,
      ...scaledVariables
    }

    // Apply color-mix transformations to main variables
    const colorMixVariables = ThemeHelperUtil.applyColorMixToVariables(themeVariables, allVariables)

    const finalVariables = {
      ...allVariables,
      ...colorMixVariables
    }

    const rootStyles = Object.entries(finalVariables)
      .map(([key, style]) => `${key}:${style.replace('/[:;{}</>]/g', '')};`)
      .join('')

    return `:root {${rootStyles}}`
  },

  /**
   * Generates the --w3m-* variables from ThemeVariables
   */
  generateW3MVariables(themeVariables?: ThemeVariables): Record<string, string> {
    if (!themeVariables) {
      return {}
    }

    const normalized = normalizeThemeVariables(themeVariables)
    const variables: Record<string, string> = {}

    // Set default values and user overrides (keep --w3m-* names for backwards compatibility)
    variables['--w3m-font-family'] = normalized['font-family'] as string
    variables['--w3m-font-family-mono'] = normalized['font-family-mono'] as string
    variables['--w3m-accent'] = normalized['accent'] as string
    variables['--w3m-color-mix'] = normalized['color-mix'] as string
    variables['--w3m-color-mix-strength'] = `${normalized['color-mix-strength']}%`
    variables['--w3m-font-size-master'] = normalized['font-size-master'] as string
    variables['--w3m-border-radius-master'] = normalized['border-radius-master'] as string

    return variables
  },

  /**
   * Generates overrides for --apkt-* variables based on --w3m-* values
   */
  generateW3MOverrides(themeVariables?: ThemeVariables): Record<string, string> {
    if (!themeVariables) {
      return {}
    }

    const normalized = normalizeThemeVariables(themeVariables)
    const overrides: Record<string, string> = {}

    // Map accent to accent-related --apkt variables (check both prefixes)
    if (themeVariables['--apkt-accent'] || themeVariables['--w3m-accent']) {
      const accentColor = normalized['accent'] as string
      overrides['--apkt-tokens-core-iconAccentPrimary'] = accentColor
      overrides['--apkt-tokens-core-borderAccentPrimary'] = accentColor
      overrides['--apkt-tokens-core-textAccentPrimary'] = accentColor
      overrides['--apkt-tokens-core-backgroundAccentPrimary'] = accentColor
    }

    if (themeVariables['--apkt-font-family'] || themeVariables['--w3m-font-family']) {
      overrides['--apkt-fontFamily-regular'] = normalized['font-family'] as string
    }

    if (
      themeVariables['--apkt-font-family-mono'] ||
      themeVariables['--w3m-font-family-mono'] ||
      themeVariables['--apkt-font-family'] ||
      themeVariables['--w3m-font-family']
    ) {
      overrides['--apkt-fontFamily-mono'] = normalized['font-family-mono'] as string
    }

    if (normalized['z-index'] !== undefined) {
      overrides['--apkt-tokens-core-zIndex'] = `${normalized['z-index']}`
    }

    return overrides
  },

  /**
   * Generates scaled variables for typography and border radius
   */
  generateScaledVariables(themeVariables?: ThemeVariables): Record<string, string> {
    if (!themeVariables) {
      return {}
    }

    const normalized = normalizeThemeVariables(themeVariables)
    const scaledVars: Record<string, string> = {}

    if (themeVariables['--apkt-font-size-master'] || themeVariables['--w3m-font-size-master']) {
      const masterSize = parseFloat((normalized['font-size-master'] as string).replace('px', ''))

      // 50px default
      scaledVars['--apkt-textSize-h1'] = `${Number(masterSize) * 5}px`
      // 44px default
      scaledVars['--apkt-textSize-h2'] = `${Number(masterSize) * 4.4}px`
      // 38px default
      scaledVars['--apkt-textSize-h3'] = `${Number(masterSize) * 3.8}px`
      // 32px default
      scaledVars['--apkt-textSize-h4'] = `${Number(masterSize) * 3.2}px`
      // 26px default
      scaledVars['--apkt-textSize-h5'] = `${Number(masterSize) * 2.6}px`
      // 20px default
      scaledVars['--apkt-textSize-h6'] = `${Number(masterSize) * 2}px`
      // 16px default
      scaledVars['--apkt-textSize-large'] = `${Number(masterSize) * 1.6}px`
      // 14px default
      scaledVars['--apkt-textSize-medium'] = `${Number(masterSize) * 1.4}px`
      // 12px default
      scaledVars['--apkt-textSize-small'] = `${Number(masterSize) * 1.2}px`
    }

    // Scale border radius based on --apkt-border-radius-master or --w3m-border-radius-master
    if (
      themeVariables['--apkt-border-radius-master'] ||
      themeVariables['--w3m-border-radius-master']
    ) {
      const masterRadius = parseFloat(
        (normalized['border-radius-master'] as string).replace('px', '')
      )

      // 4px default
      scaledVars['--apkt-borderRadius-1'] = `${Number(masterRadius)}px`
      // 8px default
      scaledVars['--apkt-borderRadius-2'] = `${Number(masterRadius) * 2}px`
      // 12px default
      scaledVars['--apkt-borderRadius-3'] = `${Number(masterRadius) * 3}px`
      // 16px default
      scaledVars['--apkt-borderRadius-4'] = `${Number(masterRadius) * 4}px`
      // 20px default
      scaledVars['--apkt-borderRadius-5'] = `${Number(masterRadius) * 5}px`
      // 24px default
      scaledVars['--apkt-borderRadius-6'] = `${Number(masterRadius) * 6}px`
      // 32px default
      scaledVars['--apkt-borderRadius-8'] = `${Number(masterRadius) * 8}px`
      // 64px default
      scaledVars['--apkt-borderRadius-16'] = `${Number(masterRadius) * 16}px`
      // 80px default
      scaledVars['--apkt-borderRadius-20'] = `${Number(masterRadius) * 20}px`
      // 128px default
      scaledVars['--apkt-borderRadius-32'] = `${Number(masterRadius) * 32}px`
      // 256px default
      scaledVars['--apkt-borderRadius-64'] = `${Number(masterRadius) * 64}px`
      // 512px default
      scaledVars['--apkt-borderRadius-128'] = `${Number(masterRadius) * 128}px`
    }

    return scaledVars
  },

  /**
   * Generates CSS with color-mix functionality and @supports fallbacks
   */
  generateColorMixCSS(
    themeVariables?: ThemeVariables,
    allVariables?: Record<string, string>
  ): string {
    if (!themeVariables?.['--w3m-color-mix'] || !themeVariables['--w3m-color-mix-strength']) {
      return ''
    }

    const colorMix = themeVariables['--w3m-color-mix']
    const strength = themeVariables['--w3m-color-mix-strength']

    if (!strength || strength === 0) {
      return ''
    }

    const colorVariables = Object.keys(allVariables || {}).filter(key => {
      const isColorToken =
        key.includes('-tokens-core-background') ||
        key.includes('-tokens-core-text') ||
        key.includes('-tokens-core-border') ||
        key.includes('-tokens-core-foreground') ||
        key.includes('-tokens-core-icon') ||
        key.includes('-tokens-theme-background') ||
        key.includes('-tokens-theme-text') ||
        key.includes('-tokens-theme-border') ||
        key.includes('-tokens-theme-foreground') ||
        key.includes('-tokens-theme-icon')

      // Skip spacing, fontFamily, fontWeight, typography, duration, ease, path, width, height, etc
      const isDimensional =
        key.includes('-borderRadius-') ||
        key.includes('-spacing-') ||
        key.includes('-textSize-') ||
        key.includes('-fontFamily-') ||
        key.includes('-fontWeight-') ||
        key.includes('-typography-') ||
        key.includes('-duration-') ||
        key.includes('-ease-') ||
        key.includes('-path-') ||
        key.includes('-width-') ||
        key.includes('-height-') ||
        key.includes('-visual-size-') ||
        key.includes('-modal-width') ||
        key.includes('-cover')

      return isColorToken && !isDimensional
    })

    if (colorVariables.length === 0) {
      return ''
    }

    // Generate the @supports rule with color-mix
    const colorMixVariables = colorVariables
      .map(key => {
        const originalValue = allVariables?.[key] || ''

        if (
          originalValue.includes('color-mix') ||
          originalValue.startsWith('#') ||
          originalValue.startsWith('rgb')
        ) {
          return `${key}: color-mix(in srgb, ${colorMix} ${strength}%, ${originalValue});`
        }

        return `${key}: color-mix(in srgb, ${colorMix} ${strength}%, var(${key}-base, ${originalValue}));`
      })
      .join('')

    return ` @supports (background: color-mix(in srgb, white 50%, black)) {
      :root {
        ${colorMixVariables}
      }
    }`
  },

  /**
   * Generates base variants for specific tokens.
   */
  generateBaseVariables(assignedCSSVariables: Record<string, string>): Record<string, string> {
    const baseVariables: Record<string, string> = {}

    const themeBackgroundPrimary = assignedCSSVariables['--apkt-tokens-theme-backgroundPrimary']
    if (themeBackgroundPrimary) {
      baseVariables['--apkt-tokens-theme-backgroundPrimary-base'] = themeBackgroundPrimary
    }

    const coreBackgroundAccentPrimary =
      assignedCSSVariables['--apkt-tokens-core-backgroundAccentPrimary']
    if (coreBackgroundAccentPrimary) {
      baseVariables['--apkt-tokens-core-backgroundAccentPrimary-base'] = coreBackgroundAccentPrimary
    }

    return baseVariables
  },

  /**
   * Applies color-mix transformations to variables.
   */
  applyColorMixToVariables(
    themeVariables?: ThemeVariables,
    allVariables?: Record<string, string>
  ): Record<string, string> {
    const colorMixVariables: Record<string, string> = {}

    if (allVariables?.['--apkt-tokens-theme-backgroundPrimary']) {
      colorMixVariables['--apkt-tokens-theme-backgroundPrimary'] =
        'var(--apkt-tokens-theme-backgroundPrimary-base)'
    }

    if (allVariables?.['--apkt-tokens-core-backgroundAccentPrimary']) {
      colorMixVariables['--apkt-tokens-core-backgroundAccentPrimary'] =
        'var(--apkt-tokens-core-backgroundAccentPrimary-base)'
    }

    // Use normalized values to respect --apkt-* precedence
    const normalized = normalizeThemeVariables(themeVariables)
    const colorMix = normalized['color-mix']
    const strength = normalized['color-mix-strength']

    if (!strength || strength === 0) {
      return colorMixVariables
    }

    const colorVariables = Object.keys(allVariables || {}).filter(key => {
      const isColorToken =
        key.includes('-tokens-core-background') ||
        key.includes('-tokens-core-text') ||
        key.includes('-tokens-core-border') ||
        key.includes('-tokens-core-foreground') ||
        key.includes('-tokens-core-icon') ||
        key.includes('-tokens-theme-background') ||
        key.includes('-tokens-theme-text') ||
        key.includes('-tokens-theme-border') ||
        key.includes('-tokens-theme-foreground') ||
        key.includes('-tokens-theme-icon') ||
        key.includes('-tokens-theme-overlay')

      const isDimensional =
        key.includes('-borderRadius-') ||
        key.includes('-spacing-') ||
        key.includes('-textSize-') ||
        key.includes('-fontFamily-') ||
        key.includes('-fontWeight-') ||
        key.includes('-typography-') ||
        key.includes('-duration-') ||
        key.includes('-ease-') ||
        key.includes('-path-') ||
        key.includes('-width-') ||
        key.includes('-height-') ||
        key.includes('-visual-size-') ||
        key.includes('-modal-width') ||
        key.includes('-cover')

      return isColorToken && !isDimensional
    })

    if (colorVariables.length === 0) {
      return colorMixVariables
    }

    colorVariables.forEach(key => {
      const originalValue = allVariables?.[key] || ''

      if (key.endsWith('-base')) {
        return
      }

      if (
        key === '--apkt-tokens-theme-backgroundPrimary' ||
        key === '--apkt-tokens-core-backgroundAccentPrimary'
      ) {
        colorMixVariables[key] = `color-mix(in srgb, ${colorMix} ${strength}%, var(${key}-base))`
      } else if (
        originalValue.includes('color-mix') ||
        originalValue.startsWith('#') ||
        originalValue.startsWith('rgb')
      ) {
        colorMixVariables[key] = `color-mix(in srgb, ${colorMix} ${strength}%, ${originalValue})`
      } else {
        colorMixVariables[key] =
          `color-mix(in srgb, ${colorMix} ${strength}%, var(${key}-base, ${originalValue}))`
      }
    })

    return colorMixVariables
  }
}

// Creates all CSS variables with var() strings
const { cssVariablesVarPrefix: vars } = ThemeHelperUtil.createCSSVariables(allStyles)

/**
 * Utility to define Lit CSS styles with variables.
 * @param  strings - Template literal strings used to define the CSS.
 * @param values - Functions that return CSS variables from design system.
 */
function css(
  strings: TemplateStringsArray,
  ...values: ((_vars: typeof vars) => CSSResultGroup | number | string)[]
) {
  return litCSS(
    strings,
    ...values.map(value =>
      typeof value === 'function' ? unsafeCSS(value(vars)) : unsafeCSS(value)
    )
  )
}

export { css, vars }
