import { css, unsafeCSS } from 'lit'

import { ThemeHelperUtil } from './ThemeHelperUtil.js'
import type { ThemeType, ThemeVariables } from './TypeUtil.js'

// -- Utilities ---------------------------------------------------------------
let apktTag: HTMLStyleElement | undefined = undefined
let themeTag: HTMLStyleElement | undefined = undefined
let darkModeTag: HTMLStyleElement | undefined = undefined
let lightModeTag: HTMLStyleElement | undefined = undefined

// Store current theme variables for reuse
let currentThemeVariables: ThemeVariables | undefined = undefined

const fonts = {
  'KHTeka-500-woff2': 'https://fonts.reown.com/KHTeka-Medium.woff2',
  'KHTeka-400-woff2': 'https://fonts.reown.com/KHTeka-Regular.woff2',
  'KHTeka-300-woff2': 'https://fonts.reown.com/KHTeka-Light.woff2',
  'KHTekaMono-400-woff2': 'https://fonts.reown.com/KHTekaMono-Regular.woff2',
  'KHTeka-500-woff': 'https://fonts.reown.com/KHTeka-Light.woff',
  'KHTeka-400-woff': 'https://fonts.reown.com/KHTeka-Regular.woff',
  'KHTeka-300-woff': 'https://fonts.reown.com/KHTeka-Light.woff',
  'KHTekaMono-400-woff': 'https://fonts.reown.com/KHTekaMono-Regular.woff'
}

function createAppKitTheme(themeVariables?: ThemeVariables, theme: ThemeType = 'dark') {
  if (apktTag) {
    document.head.removeChild(apktTag)
  }

  apktTag = document.createElement('style')
  apktTag.textContent = ThemeHelperUtil.createRootStyles(theme, themeVariables)
  document.head.appendChild(apktTag)
}

export function initializeTheming(themeVariables?: ThemeVariables, themeMode: ThemeType = 'dark') {
  currentThemeVariables = themeVariables

  themeTag = document.createElement('style')
  darkModeTag = document.createElement('style')
  lightModeTag = document.createElement('style')
  themeTag.textContent = createRootStyles(themeVariables).core.cssText
  darkModeTag.textContent = createRootStyles(themeVariables).dark.cssText
  lightModeTag.textContent = createRootStyles(themeVariables).light.cssText
  document.head.appendChild(themeTag)
  document.head.appendChild(darkModeTag)
  document.head.appendChild(lightModeTag)
  createAppKitTheme(themeVariables, themeMode)
  setColorTheme(themeMode)

  const hasCustomFont =
    themeVariables?.['--apkt-font-family'] || themeVariables?.['--w3m-font-family']
  if (!hasCustomFont) {
    for (const [key, url] of Object.entries(fonts)) {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = url
      link.as = 'font'
      link.type = key.includes('woff2') ? 'font/woff2' : 'font/woff'
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    }
  }

  setColorTheme(themeMode)
}

export function setColorTheme(themeMode: ThemeType = 'dark') {
  if (darkModeTag && lightModeTag && apktTag) {
    if (themeMode === 'light') {
      createAppKitTheme(currentThemeVariables, themeMode)
      darkModeTag.removeAttribute('media')
      lightModeTag.media = 'enabled'
    } else {
      createAppKitTheme(currentThemeVariables, themeMode)
      lightModeTag.removeAttribute('media')
      darkModeTag.media = 'enabled'
    }
  }
}

export function setThemeVariables(_themeVariables?: ThemeVariables) {
  currentThemeVariables = _themeVariables

  if (themeTag && darkModeTag && lightModeTag) {
    themeTag.textContent = createRootStyles(_themeVariables).core.cssText
    darkModeTag.textContent = createRootStyles(_themeVariables).dark.cssText
    lightModeTag.textContent = createRootStyles(_themeVariables).light.cssText
    const fontFamily =
      _themeVariables?.['--apkt-font-family'] || _themeVariables?.['--w3m-font-family']
    if (fontFamily) {
      themeTag.textContent = themeTag.textContent?.replace(
        'font-family: KHTeka',
        `font-family: ${fontFamily}`
      )
      darkModeTag.textContent = darkModeTag.textContent?.replace(
        'font-family: KHTeka',
        `font-family: ${fontFamily}`
      )
      lightModeTag.textContent = lightModeTag.textContent?.replace(
        'font-family: KHTeka',
        `font-family: ${fontFamily}`
      )
    }
  }

  if (apktTag) {
    const currentMode = lightModeTag?.media === 'enabled' ? 'light' : 'dark'
    createAppKitTheme(_themeVariables, currentMode)
  }
}

export function createRootStyles(_themeVariables?: ThemeVariables) {
  const hasCustomFontFamily = Boolean(
    _themeVariables?.['--apkt-font-family'] || _themeVariables?.['--w3m-font-family']
  )
  /*
   * Mono inherits a custom base font, so the bundled face is only needed when neither
   * the mono nor the base font has been overridden.
   */
  const hasCustomMonoFontFamily =
    Boolean(_themeVariables?.['--apkt-font-family-mono']) || hasCustomFontFamily

  return {
    core: css`
      ${hasCustomFontFamily
        ? css``
        : css`
            @font-face {
              font-family: 'KHTeka';
              src:
                url(${unsafeCSS(fonts['KHTeka-400-woff2'])}) format('woff2'),
                url(${unsafeCSS(fonts['KHTeka-400-woff'])}) format('woff');
              font-weight: 400;
              font-style: normal;
              font-display: swap;
            }

            @font-face {
              font-family: 'KHTeka';
              src:
                url(${unsafeCSS(fonts['KHTeka-300-woff2'])}) format('woff2'),
                url(${unsafeCSS(fonts['KHTeka-300-woff'])}) format('woff');
              font-weight: 300;
              font-style: normal;
            }

            @font-face {
              font-family: 'KHTeka';
              src:
                url(${unsafeCSS(fonts['KHTeka-400-woff2'])}) format('woff2'),
                url(${unsafeCSS(fonts['KHTeka-400-woff'])}) format('woff');
              font-weight: 400;
              font-style: normal;
            }
          `}
      ${hasCustomMonoFontFamily
        ? css``
        : css`
            @font-face {
              font-family: 'KHTekaMono';
              src:
                url(${unsafeCSS(fonts['KHTekaMono-400-woff2'])}) format('woff2'),
                url(${unsafeCSS(fonts['KHTekaMono-400-woff'])}) format('woff');
              font-weight: 400;
              font-style: normal;
            }
          `}

      @keyframes w3m-shake {
        0% {
          transform: scale(1) rotate(0deg);
        }
        20% {
          transform: scale(1) rotate(-1deg);
        }
        40% {
          transform: scale(1) rotate(1.5deg);
        }
        60% {
          transform: scale(1) rotate(-1.5deg);
        }
        80% {
          transform: scale(1) rotate(1deg);
        }
        100% {
          transform: scale(1) rotate(0deg);
        }
      }
      @keyframes w3m-iframe-fade-out {
        0% {
          opacity: 1;
        }
        100% {
          opacity: 0;
        }
      }
      @keyframes w3m-iframe-zoom-in {
        0% {
          transform: translateY(50px);
          opacity: 0;
        }
        100% {
          transform: translateY(0px);
          opacity: 1;
        }
      }
      @keyframes w3m-iframe-zoom-in-mobile {
        0% {
          transform: scale(0.95);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      :root {
        --apkt-modal-width: 370px;

        --apkt-visual-size-inherit: inherit;
        --apkt-visual-size-sm: 40px;
        --apkt-visual-size-md: 55px;
        --apkt-visual-size-lg: 80px;

        --apkt-path-network-sm: path(
          'M15.4 2.1a5.21 5.21 0 0 1 5.2 0l11.61 6.7a5.21 5.21 0 0 1 2.61 4.52v13.4c0 1.87-1 3.59-2.6 4.52l-11.61 6.7c-1.62.93-3.6.93-5.22 0l-11.6-6.7a5.21 5.21 0 0 1-2.61-4.51v-13.4c0-1.87 1-3.6 2.6-4.52L15.4 2.1Z'
        );

        --apkt-path-network-md: path(
          'M43.4605 10.7248L28.0485 1.61089C25.5438 0.129705 22.4562 0.129705 19.9515 1.61088L4.53951 10.7248C2.03626 12.2051 0.5 14.9365 0.5 17.886V36.1139C0.5 39.0635 2.03626 41.7949 4.53951 43.2752L19.9515 52.3891C22.4562 53.8703 25.5438 53.8703 28.0485 52.3891L43.4605 43.2752C45.9637 41.7949 47.5 39.0635 47.5 36.114V17.8861C47.5 14.9365 45.9637 12.2051 43.4605 10.7248Z'
        );

        --apkt-path-network-lg: path(
          'M78.3244 18.926L50.1808 2.45078C45.7376 -0.150261 40.2624 -0.150262 35.8192 2.45078L7.6756 18.926C3.23322 21.5266 0.5 26.3301 0.5 31.5248V64.4752C0.5 69.6699 3.23322 74.4734 7.6756 77.074L35.8192 93.5492C40.2624 96.1503 45.7376 96.1503 50.1808 93.5492L78.3244 77.074C82.7668 74.4734 85.5 69.6699 85.5 64.4752V31.5248C85.5 26.3301 82.7668 21.5266 78.3244 18.926Z'
        );

        --apkt-width-network-sm: 36px;
        --apkt-width-network-md: 48px;
        --apkt-width-network-lg: 86px;

        --apkt-duration-dynamic: 0ms;
        --apkt-height-network-sm: 40px;
        --apkt-height-network-md: 54px;
        --apkt-height-network-lg: 96px;
      }
    `,
    dark: css`
      :root {
      }
    `,
    light: css`
      :root {
      }
    `
  }
}

// -- Presets -----------------------------------------------------------------
export const resetStyles = css`
  div,
  span,
  iframe,
  a,
  img,
  form,
  button,
  label,
  *::after,
  *::before {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-style: normal;
    text-rendering: optimizeSpeed;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: transparent;
    backface-visibility: hidden;
  }

  :host {
    font-family: var(--apkt-fontFamily-regular);
  }
`

/*
 * @TODO: Include input checkbox default styles
 * @TOOD: Include focus visible and focus styles (button)
 * @TODO: Add disabled state to have opacity 0.3
 */
export const elementStyles = css`
  button,
  a {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;

    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
    outline: none;
    border: none;
    text-decoration: none;
    transition:
      background-color var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      color var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      border var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      box-shadow var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      width var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      height var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      transform var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      opacity var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      scale var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      border-radius var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2);
    will-change:
      background-color, color, border, box-shadow, width, height, transform, opacity, scale,
      border-radius;
  }

  a:active:not([disabled]),
  button:active:not([disabled]) {
    scale: 0.975;
    transform-origin: center;
  }

  button:disabled {
    cursor: default;
  }

  input {
    border: none;
    outline: none;
    appearance: none;
  }
`
