import { describe, expect, it } from 'vitest'

import { ThemeHelperUtil } from '../src/utils/ThemeHelperUtil.js'

// -- Tests --------------------------------------------------------------------
describe('ThemeHelperUtil', () => {
  it('should create css variables for styles', () => {
    const styles = {
      background: 'red',
      theme: {
        dark: {
          accent: '#000'
        },
        light: {
          accent: '#fff'
        }
      }
    }

    expect(ThemeHelperUtil.createCSSVariables(styles).cssVariables).toStrictEqual({
      background: '--apkt-background',
      theme: {
        dark: {
          accent: '--apkt-theme-dark-accent'
        },
        light: {
          accent: '--apkt-theme-light-accent'
        }
      }
    })
    expect(
      ThemeHelperUtil.createCSSVariables({ ...styles, background: undefined }).cssVariables
    ).toStrictEqual({
      theme: {
        dark: {
          accent: '--apkt-theme-dark-accent'
        },
        light: {
          accent: '--apkt-theme-light-accent'
        }
      }
    })
    expect(
      ThemeHelperUtil.createCSSVariables({ ...styles, background: {} }).cssVariables
    ).toStrictEqual({
      theme: {
        dark: {
          accent: '--apkt-theme-dark-accent'
        },
        light: {
          accent: '--apkt-theme-light-accent'
        }
      }
    })
    expect(
      ThemeHelperUtil.createCSSVariables({ ...styles, background: {} }).cssVariables
    ).toStrictEqual({
      theme: {
        dark: {
          accent: '--apkt-theme-dark-accent'
        },
        light: {
          accent: '--apkt-theme-light-accent'
        }
      }
    })

    expect(ThemeHelperUtil.createCSSVariables(styles).cssVariablesVarPrefix).toStrictEqual({
      background: 'var(--apkt-background)',
      theme: {
        dark: {
          accent: 'var(--apkt-theme-dark-accent)'
        },
        light: {
          accent: 'var(--apkt-theme-light-accent)'
        }
      }
    })
    expect(
      ThemeHelperUtil.createCSSVariables({ ...styles, background: undefined }).cssVariablesVarPrefix
    ).toStrictEqual({
      theme: {
        dark: {
          accent: 'var(--apkt-theme-dark-accent)'
        },
        light: {
          accent: 'var(--apkt-theme-light-accent)'
        }
      }
    })
    expect(
      ThemeHelperUtil.createCSSVariables({ ...styles, background: {} }).cssVariablesVarPrefix
    ).toStrictEqual({
      theme: {
        dark: {
          accent: 'var(--apkt-theme-dark-accent)'
        },
        light: {
          accent: 'var(--apkt-theme-light-accent)'
        }
      }
    })
    expect(
      ThemeHelperUtil.createCSSVariables({ ...styles, background: {} }).cssVariablesVarPrefix
    ).toStrictEqual({
      theme: {
        dark: {
          accent: 'var(--apkt-theme-dark-accent)'
        },
        light: {
          accent: 'var(--apkt-theme-light-accent)'
        }
      }
    })
  })

  it('should assign css variables based on style object', () => {
    const styles = {
      background: 'red',
      theme: {
        dark: {
          accent: '#000'
        },
        light: {
          accent: '#fff'
        }
      }
    }

    const { cssVariables } = ThemeHelperUtil.createCSSVariables(styles)

    expect(ThemeHelperUtil.assignCSSVariables(cssVariables, styles)).toStrictEqual({
      '--apkt-background': styles.background,
      '--apkt-theme-dark-accent': styles.theme.dark.accent,
      '--apkt-theme-light-accent': styles.theme.light.accent
    })
    expect(
      ThemeHelperUtil.assignCSSVariables(cssVariables, { ...styles, background: undefined })
    ).toStrictEqual({
      '--apkt-theme-dark-accent': styles.theme.dark.accent,
      '--apkt-theme-light-accent': styles.theme.light.accent
    })
    expect(
      ThemeHelperUtil.assignCSSVariables(cssVariables, { ...styles, background: undefined })
    ).toStrictEqual({
      '--apkt-theme-dark-accent': styles.theme.dark.accent,
      '--apkt-theme-light-accent': styles.theme.light.accent
    })
  })

  it('should handle z-index values correctly in generateW3MOverrides', () => {
    const themeVariablesWithZIndex = {
      '--w3m-z-index': 999
    }

    const customZIndexOverrides = ThemeHelperUtil.generateW3MOverrides(themeVariablesWithZIndex)
    expect(customZIndexOverrides['--apkt-tokens-core-zIndex']).toBe('999')

    const themeVariablesWithoutZIndex = {
      '--w3m-accent': '#ff0000'
    }

    const defaultZIndexOverrides = ThemeHelperUtil.generateW3MOverrides(themeVariablesWithoutZIndex)
    expect(defaultZIndexOverrides['--apkt-tokens-core-zIndex']).toBeUndefined()

    const undefinedOverrides = ThemeHelperUtil.generateW3MOverrides(undefined)
    expect(undefinedOverrides).toStrictEqual({})

    const emptyOverrides = ThemeHelperUtil.generateW3MOverrides({})
    expect(emptyOverrides['--apkt-tokens-core-zIndex']).toBeUndefined()
  })

  it('should override both regular and mono font families for a custom font', () => {
    const apktOverrides = ThemeHelperUtil.generateW3MOverrides({
      '--apkt-font-family': "'Comic Sans MS', cursive"
    })
    expect(apktOverrides['--apkt-fontFamily-regular']).toBe("'Comic Sans MS', cursive")
    expect(apktOverrides['--apkt-fontFamily-mono']).toBe("'Comic Sans MS', cursive")

    const w3mOverrides = ThemeHelperUtil.generateW3MOverrides({
      '--w3m-font-family': "'Comic Sans MS', cursive"
    })
    expect(w3mOverrides['--apkt-fontFamily-regular']).toBe("'Comic Sans MS', cursive")
    expect(w3mOverrides['--apkt-fontFamily-mono']).toBe("'Comic Sans MS', cursive")

    const noFontOverrides = ThemeHelperUtil.generateW3MOverrides({ '--w3m-accent': '#ff0000' })
    expect(noFontOverrides['--apkt-fontFamily-regular']).toBeUndefined()
    expect(noFontOverrides['--apkt-fontFamily-mono']).toBeUndefined()
  })

  it('should let --apkt-font-family-mono override the mono font independently', () => {
    const bothFonts = ThemeHelperUtil.generateW3MOverrides({
      '--apkt-font-family': "'Comic Sans MS', cursive",
      '--apkt-font-family-mono': "'Fira Code', monospace"
    })
    expect(bothFonts['--apkt-fontFamily-regular']).toBe("'Comic Sans MS', cursive")
    expect(bothFonts['--apkt-fontFamily-mono']).toBe("'Fira Code', monospace")

    // Mono alone must not drag the regular font along with it
    const monoOnly = ThemeHelperUtil.generateW3MOverrides({
      '--apkt-font-family-mono': "'Fira Code', monospace"
    })
    expect(monoOnly['--apkt-fontFamily-mono']).toBe("'Fira Code', monospace")
    expect(monoOnly['--apkt-fontFamily-regular']).toBeUndefined()
  })
})
