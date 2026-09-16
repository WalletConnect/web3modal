import { describe, expect, it } from 'vitest'

import type { ThemeVariables } from '@reown/appkit-common'

import { ThemeHelperUtil } from '../src/utils/ThemeHelperUtil.js'
import { createRootStyles } from '../src/utils/ThemeUtil.js'

describe('ThemeUtil', () => {
  describe('createRootStyles', () => {
    it('should include KHTeka fonts when no custom font family is provided', () => {
      const themeVariables: ThemeVariables = {}
      const styles = createRootStyles(themeVariables)
      expect(styles.core.cssText).toContain("font-family: 'KHTeka'")
      expect(styles.core.cssText).toContain("font-family: 'KHTekaMono'")
    })

    it('should not include Google Fonts import when custom font family is provided with --w3m prefix', () => {
      const themeVariables: ThemeVariables = {
        '--w3m-font-family': 'Custom Font, sans-serif'
      }
      const styles = createRootStyles(themeVariables)

      expect(styles.core.cssText).not.toContain("font-family: 'KHTeka'")
      expect(styles.core.cssText).not.toContain("font-family: 'KHTekaMono'")
      expect(styles.core.cssText).not.toContain('KHTeka-Medium.woff')
      expect(styles.core.cssText).not.toContain('KHTeka-Light.woff')
      expect(styles.core.cssText).not.toContain('KHTekaMono-Regular.woff')
      expect(styles.core.cssText).not.toContain('KHTeka-Regular.woff')
    })

    it('should not include Google Fonts import when custom font family is provided with --apkt prefix', () => {
      const themeVariables: ThemeVariables = {
        '--apkt-font-family': 'AppKit Font, sans-serif'
      }
      const styles = createRootStyles(themeVariables)

      expect(styles.core.cssText).not.toContain("font-family: 'KHTeka'")
      expect(styles.core.cssText).not.toContain("font-family: 'KHTekaMono'")
      expect(styles.core.cssText).not.toContain('KHTeka-Medium.woff')
      expect(styles.core.cssText).not.toContain('KHTeka-Light.woff')
      expect(styles.core.cssText).not.toContain('KHTekaMono-Regular.woff')
      expect(styles.core.cssText).not.toContain('KHTeka-Regular.woff')
    })

    it('should prioritize --apkt-font-family over --w3m-font-family when both are provided', () => {
      const themeVariables: ThemeVariables = {
        '--w3m-font-family': 'Old Font',
        '--apkt-font-family': 'New Font'
      }
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', themeVariables)

      expect(rootStyles).toContain('--apkt-fontFamily-regular:New Font')
    })

    it('should drive the monospace font from --apkt-font-family when no mono font is set', () => {
      const themeVariables: ThemeVariables = {
        '--apkt-font-family': 'New Font'
      }
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', themeVariables)

      expect(rootStyles).toContain('--apkt-fontFamily-mono:New Font')
    })

    it('should prioritize --apkt-font-family-mono over --apkt-font-family for monospace text', () => {
      const themeVariables: ThemeVariables = {
        '--apkt-font-family': 'New Font',
        '--apkt-font-family-mono': 'New Mono'
      }
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', themeVariables)

      expect(rootStyles).toContain('--apkt-fontFamily-mono:New Mono')
    })

    it('should default the monospace font to KHTekaMono when no font is provided', () => {
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', { '--w3m-accent': '#ff0000' })

      expect(rootStyles).toContain('--w3m-font-family-mono:KHTekaMono')
    })

    it('should always include keyframe animations regardless of font family setting', () => {
      const withCustomFont: ThemeVariables = { '--w3m-font-family': 'Custom Font' }
      const withoutCustomFont: ThemeVariables = {}

      const stylesWithCustom = createRootStyles(withCustomFont)
      const stylesWithoutCustom = createRootStyles(withoutCustomFont)

      expect(stylesWithCustom.core.cssText).toContain('@keyframes w3m-shake')
      expect(stylesWithoutCustom.core.cssText).toContain('@keyframes w3m-shake')
    })

    it('should handle --w3m-accent correctly', () => {
      const themeVariables: ThemeVariables = {
        '--w3m-accent': '#FF5500'
      }
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', themeVariables)

      expect(rootStyles).toBeDefined()
      expect(rootStyles).toContain('--apkt-tokens-core-iconAccentPrimary:#FF5500')
      expect(rootStyles).toContain('--apkt-tokens-core-borderAccentPrimary:#FF5500')
      expect(rootStyles).toContain('--apkt-tokens-core-textAccentPrimary:#FF5500')
    })

    it('should handle --apkt-accent correctly', () => {
      const themeVariables: ThemeVariables = {
        '--apkt-accent': '#FF5500'
      }
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', themeVariables)

      expect(rootStyles).toBeDefined()
      expect(rootStyles).toContain('--apkt-tokens-core-iconAccentPrimary:#FF5500')
      expect(rootStyles).toContain('--apkt-tokens-core-borderAccentPrimary:#FF5500')
      expect(rootStyles).toContain('--apkt-tokens-core-textAccentPrimary:#FF5500')
    })

    it('should prioritize --apkt-accent over --w3m-accent when both are provided', () => {
      const themeVariables: ThemeVariables = {
        '--w3m-accent': '#0000FF',
        '--apkt-accent': '#FF0000'
      }
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', themeVariables)

      expect(rootStyles).toBeDefined()

      expect(rootStyles).toContain('--apkt-tokens-core-iconAccentPrimary:#FF0000')
      expect(rootStyles).toContain('--apkt-tokens-core-borderAccentPrimary:#FF0000')
      expect(rootStyles).toContain('--apkt-tokens-core-textAccentPrimary:#FF0000')
    })

    it('should handle --apkt-color-mix and --apkt-color-mix-strength', () => {
      const themeVariables: ThemeVariables = {
        '--apkt-color-mix': '#FF00FF',
        '--apkt-color-mix-strength': 50
      }
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', themeVariables)

      expect(rootStyles).toBeDefined()
      expect(rootStyles).toContain('--w3m-color-mix:#FF00FF')
      expect(rootStyles).toContain('--w3m-color-mix-strength:50%')
    })

    it('should handle --w3m-color-mix and --w3m-color-mix-strength', () => {
      const themeVariables: ThemeVariables = {
        '--w3m-color-mix': '#FF00FF',
        '--w3m-color-mix-strength': 50
      }
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', themeVariables)

      expect(rootStyles).toBeDefined()
      expect(rootStyles).toContain('--w3m-color-mix:#FF00FF')
      expect(rootStyles).toContain('--w3m-color-mix-strength:50%')
    })

    it('should handle --apkt-font-size-master', () => {
      const themeVariables: ThemeVariables = {
        '--apkt-font-size-master': '12px'
      }
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', themeVariables)

      expect(rootStyles).toBeDefined()
      expect(rootStyles).toContain('--w3m-font-size-master:12px')
      expect(rootStyles).toContain('--apkt-textSize-h1:60px')
    })

    it('should handle --w3m-font-size-master', () => {
      const themeVariables: ThemeVariables = {
        '--w3m-font-size-master': '12px'
      }
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', themeVariables)

      expect(rootStyles).toBeDefined()
      expect(rootStyles).toContain('--w3m-font-size-master:12px')
      expect(rootStyles).toContain('--apkt-textSize-h1:60px')
    })

    it('should handle --apkt-border-radius-master', () => {
      const themeVariables: ThemeVariables = {
        '--apkt-border-radius-master': '8px'
      }
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', themeVariables)

      expect(rootStyles).toBeDefined()
      expect(rootStyles).toContain('--w3m-border-radius-master:8px')
      expect(rootStyles).toContain('--apkt-borderRadius-1:8px')
      expect(rootStyles).toContain('--apkt-borderRadius-2:16px')
      expect(rootStyles).toContain('--apkt-borderRadius-4:32px')
    })

    it('should handle --w3m-border-radius-master', () => {
      const themeVariables: ThemeVariables = {
        '--w3m-border-radius-master': '8px'
      }
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', themeVariables)

      expect(rootStyles).toBeDefined()
      expect(rootStyles).toContain('--w3m-border-radius-master:8px')
      expect(rootStyles).toContain('--apkt-borderRadius-1:8px')
      expect(rootStyles).toContain('--apkt-borderRadius-2:16px')
      expect(rootStyles).toContain('--apkt-borderRadius-4:32px')
    })

    it('should handle --apkt-z-index', () => {
      const themeVariables: ThemeVariables = {
        '--apkt-z-index': 9999
      }
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', themeVariables)

      expect(rootStyles).toBeDefined()
      expect(rootStyles).toContain('--apkt-tokens-core-zIndex:9999')
    })

    it('should handle --w3m-z-index', () => {
      const themeVariables: ThemeVariables = {
        '--w3m-z-index': 9999
      }
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', themeVariables)

      expect(rootStyles).toBeDefined()
      expect(rootStyles).toContain('--apkt-tokens-core-zIndex:9999')
    })

    it('should handle mixed usage of both prefixes for different properties', () => {
      const themeVariables: ThemeVariables = {
        '--w3m-font-family': 'Legacy Font',
        '--apkt-accent': '#00FF00',
        '--w3m-color-mix': '#333333',
        '--apkt-font-size-master': '11px',
        '--w3m-border-radius-master': '6px'
      }
      const styles = createRootStyles(themeVariables)
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', themeVariables)

      expect(styles.core.cssText).not.toContain("font-family: 'KHTeka'")

      expect(rootStyles).toContain('--w3m-accent:#00FF00')
      expect(rootStyles).toContain('--w3m-color-mix:#333333')
      expect(rootStyles).toContain('--apkt-textSize-h1:55px')
      expect(rootStyles).toContain('--apkt-borderRadius-2:12px')
    })

    it('should prioritize all --apkt-* properties over --w3m-* when both are fully provided', () => {
      const themeVariables: ThemeVariables = {
        '--w3m-font-family': 'W3M Font',
        '--apkt-font-family': 'AppKit Font',
        '--w3m-accent': '#111111',
        '--apkt-accent': '#222222',
        '--w3m-color-mix': '#333333',
        '--apkt-color-mix': '#444444',
        '--w3m-color-mix-strength': 10,
        '--apkt-color-mix-strength': 20,
        '--w3m-font-size-master': '8px',
        '--apkt-font-size-master': '14px',
        '--w3m-border-radius-master': '2px',
        '--apkt-border-radius-master': '10px',
        '--w3m-z-index': 100,
        '--apkt-z-index': 200
      }
      const styles = createRootStyles(themeVariables)
      const rootStyles = ThemeHelperUtil.createRootStyles('dark', themeVariables)

      expect(styles.core.cssText).not.toContain("font-family: 'KHTeka'")

      expect(rootStyles).toContain('--w3m-accent:#222222')
      expect(rootStyles).not.toContain('#111111')
      expect(rootStyles).toContain('--w3m-color-mix:#444444')

      expect(rootStyles).toContain('color-mix(in srgb, #444444')
      expect(rootStyles).toContain('--w3m-color-mix-strength:20%')
      expect(rootStyles).toContain('--apkt-textSize-h1:70px')
      expect(rootStyles).not.toContain('--apkt-textSize-h1:40px')
      expect(rootStyles).toContain('--apkt-borderRadius-3:30px')
      expect(rootStyles).not.toContain('--apkt-borderRadius-3:6px')
      expect(rootStyles).toContain('--apkt-tokens-core-zIndex:200')
      expect(rootStyles).not.toContain('--apkt-tokens-core-zIndex:100')
    })
  })
})
