// -- Types ------------------------------------------------------------------
export type ThemeType = 'dark' | 'light'

export interface ThemeVariables {
  '--w3m-font-family'?: string
  '--w3m-font-family-mono'?: string
  '--w3m-accent'?: string
  '--w3m-color-mix'?: string
  '--w3m-color-mix-strength'?: number
  '--w3m-font-size-master'?: string
  '--w3m-border-radius-master'?: string
  '--w3m-z-index'?: number
  '--w3m-qr-color'?: string
  '--apkt-font-family'?: string
  '--apkt-font-family-mono'?: string
  '--apkt-accent'?: string
  '--apkt-color-mix'?: string
  '--apkt-color-mix-strength'?: number
  '--apkt-font-size-master'?: string
  '--apkt-border-radius-master'?: string
  '--apkt-z-index'?: number
  '--apkt-qr-color'?: string
}

export interface W3mThemeVariables {
  '--w3m-accent': string
  '--w3m-background': string
}

// -- Utilities ---------------------------------------------------------------
export function getW3mThemeVariables(themeVariables?: ThemeVariables, themeType?: ThemeType) {
  // Priority: --apkt-accent > --w3m-accent > default
  const accent = themeVariables?.['--apkt-accent'] ?? themeVariables?.['--w3m-accent']

  if (themeType === 'light') {
    return {
      '--w3m-accent': accent || 'hsla(231, 100%, 70%, 1)',
      '--w3m-background': '#fff'
    }
  }

  return {
    '--w3m-accent': accent || 'hsla(230, 100%, 67%, 1)',
    '--w3m-background': '#202020'
  }
}
