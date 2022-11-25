import { ConfigCtrl } from '@web3modal/core'
import { css, unsafeCSS } from 'lit'

export function accentColors() {
  return {
    default: {
      light: {
        inverse: `rgb(255,255,255)`,
        foreground: `rgb(51,150,255)`,
        background: `rgb(232,242,252)`
      },
      dark: {
        inverse: `rgb(255,255,255)`,
        foreground: `rgb(71,161,255)`,
        background: `rgb(21,38,55)`
      }
    },

    magenta: {
      light: {
        inverse: `rgb(255,255,255)`,
        foreground: `rgb(198,83,128)`,
        background: `rgb(244,221,230)`
      },
      dark: {
        inverse: `rgb(255,255,255)`,
        foreground: `rgb(203,77,140)`,
        background: `rgb(57,35,43)`
      }
    },

    blue: {
      light: {
        inverse: `rgb(255,255,255)`,
        foreground: `rgb(61,92,245)`,
        background: `rgb(232,235,252)`
      },
      dark: {
        inverse: `rgb(255,255,255)`,
        foreground: `rgb(81,109,251)`,
        background: `rgb(28,33,59)`
      }
    },

    orange: {
      light: {
        inverse: `rgb(255,255,255)`,
        foreground: `rgb(234,140,46)`,
        background: `rgb(244,236,221)`
      },
      dark: {
        inverse: `rgb(0,0,0)`,
        foreground: `rgb(255,166,76)`,
        background: `rgb(57,50,34)`
      }
    },

    green: {
      light: {
        inverse: `rgb(255,255,255)`,
        foreground: `rgb(38,181,98)`,
        background: `rgb(218,246,218)`
      },
      dark: {
        inverse: `rgb(0,0,0)`,
        foreground: `rgb(38,217,98)`,
        background: `rgb(35,52,40)`
      }
    },

    purple: {
      light: {
        inverse: `rgb(255,255,255)`,
        foreground: `rgb(121,76,255)`,
        background: `rgb(225,218,246)`
      },
      dark: {
        inverse: `rgb(255,255,255)`,
        foreground: `rgb(144,110,247)`,
        background: `rgb(36,31,51)`
      }
    },

    teal: {
      light: {
        inverse: `rgb(255,255,255)`,
        foreground: `rgb(43,182,182)`,
        background: `rgb(217,242,238)`
      },
      dark: {
        inverse: `rgb(0,0,0)`,
        foreground: `rgb(54,226,226)`,
        background: `rgb(29,48,52)`
      }
    },

    blackWhite: {
      light: {
        inverse: `rgb(255,255,255)`,
        foreground: `rgb(20,20,20)`,
        background: `rgb(255,255,255)`
      },
      dark: {
        inverse: `rgb(0,0,0)`,
        foreground: `rgb(255,255,255)`,
        background: `rgb(20,20,20)`
      }
    }
  }
}

export function themeColors() {
  return {
    light: {
      foreground: {
        1: `rgb(20,20,20)`,
        2: `rgb(121,134,134)`,
        3: `rgb(158,169,169)`
      },
      background: {
        1: `rgba(255,255,255)`,
        2: `rgba(241,243,243)`,
        3: `rgba(228,231,231)`
      },
      overlay: {
        thin: 'rgba(0,0,0,0.1)',
        thick: 'rgba(0,0,0,0.3)'
      }
    },

    dark: {
      foreground: {
        1: `rgb(228,231,231)`,
        2: `rgb(148,158,158)`,
        3: `rgb(110,119,119)`
      },
      background: {
        1: `rgb(20,20,20)`,
        2: `rgb(39,42,42)`,
        3: `rgb(59,64,64)`
      },
      overlay: {
        thin: 'rgba(255,255,255,0.1)',
        thick: 'rgba(255,255,255,0.3)'
      }
    }
  }
}

export function gradientColors() {
  return {
    default: { 1: '#B6B9C9', 2: '#C653C6', 3: '#794DFF', 4: '#2EB8B8' },
    blue: { 1: '#E8EBFD', 2: '#C653C6', 3: '#2DD2C5', 4: '#3D5CF5' },
    magenta: { 1: '#F4DDE6', 2: '#E0D452', 3: '#F09475', 4: '#D1618D' },
    orange: { 1: '#F4ECDD', 2: '#B4EB47', 3: '#3075E8', 4: '#EB9947' },
    green: { 1: '#DAF6DA', 2: '#E06B92', 3: '#99E54D', 4: '#26B562' },
    purple: { 1: '#E1DAF6', 2: '#EB9947', 3: '#E06B92', 4: '#794DFF' },
    teal: { 1: '#D9F2EE', 2: '#F09475', 3: '#794DFF', 4: '#2EB8B8' },
    blackWhite: { 1: '#E3E8E8', 2: '#98AEAE', 3: '#516767', 4: '#242E2E' }
  }
}

export function color() {
  const accentPreset = ConfigCtrl.state.accentColor ?? 'default'
  const themePreset = ConfigCtrl.state.theme ?? 'dark'
  const accent = accentColors()[accentPreset][themePreset]
  const theme = themeColors()[themePreset]
  const gradient = gradientColors()[accentPreset]

  return {
    foreground: {
      accent: accent.foreground,
      inverse: accent.inverse,
      ...theme.foreground
    },
    background: {
      accent: accent.background,
      ...theme.background
    },
    gradient,
    overlay: { ...theme.overlay },
    error: `rgb(242, 90, 103)`
  }
}

export const global = css`
  *,
  *::after,
  *::before {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-style: normal;
    text-rendering: optimizeSpeed;
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
    backface-visibility: hidden;
  }

  button {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    border: none;
  }

  button::after {
    content: '';
    position: absolute;
    inset: 0;
    background-color: transparent;
    transition: background-color, 0.2s ease-in-out;
  }

  button:disabled {
    cursor: not-allowed;
  }

  button svg,
  button w3m-text {
    position: relative;
    z-index: 1;
  }

  input {
    border: none;
    outline: none;
    appearance: none;
  }

  img {
    display: block;
  }

  ::selection {
    color: ${unsafeCSS(color().foreground.inverse)};
    background: ${unsafeCSS(color().foreground.accent)};
  }
`

export function setTheme() {
  const root: HTMLElement | null = document.querySelector(':root')

  if (root) {
    const variables = {
      '--color-fg-accent': color().foreground.accent,
      '--color-fg-inverse': color().foreground.inverse,
      '--color-fg-1': color().foreground[1],
      '--color-fg-2': color().foreground[2],
      '--color-fg-3': color().foreground[3],
      '--color-bg-accent': color().background.accent,
      '--color-bg-1': color().background[1],
      '--color-bg-2': color().background[2],
      '--color-bg-3': color().background[3],
      '--color-ovr-thin': color().overlay.thin,
      '--color-ovr-thick': color().overlay.thick,
      '--color-err': color().error,
      '--gradient-1': color().gradient[1],
      '--gradient-2': color().gradient[2],
      '--gradient-3': color().gradient[3],
      '--gradient-4': color().gradient[4]
    }
    Object.entries(variables).forEach(([key, val]) => root.style.setProperty(key, val))
  }
}
