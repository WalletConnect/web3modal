---
'@reown/appkit-utils': patch
'@reown/appkit': patch
'@reown/appkit-cdn': patch
'@reown/appkit-cli': patch
'@reown/appkit-codemod': patch
'@reown/appkit-common': patch
'@reown/appkit-core': patch
'@reown/appkit-experimental': patch
'@reown/appkit-pay': patch
'@reown/appkit-polyfills': patch
'@reown/appkit-scaffold-ui': patch
'@reown/appkit-siwe': patch
'@reown/appkit-siwx': patch
'@reown/appkit-testing': patch
'@reown/appkit-ui': patch
'@reown/appkit-universal-connector': patch
'@reown/appkit-wallet-button': patch
'@reown/appkit-wallet': patch
'@reown/appkit-controllers': patch
'@reown/appkit-adapter-bitcoin': patch
'@reown/appkit-adapter-ethers': patch
'@reown/appkit-adapter-ethers5': patch
'@reown/appkit-adapter-solana': patch
'@reown/appkit-adapter-ton': patch
'@reown/appkit-adapter-tron': patch
'@reown/appkit-adapter-wagmi': patch
---

Fixed a custom `--apkt-font-family` (or legacy `--w3m-font-family`) leaving every monospace piece of UI text unstyled — the WalletConnect "Copy link" button, wallet addresses, and amount inputs fell back to the browser default font.

The mono font was hardcoded to `KHTekaMono` with no corresponding CSS variable, so it could not be themed. Because the bundled `@font-face` blocks are skipped when a custom font is set, `font-family: KHTekaMono` then pointed at a family that was never loaded, with no generic fallback.

Mono now resolves to `--apkt-font-family-mono ?? --apkt-font-family ?? --w3m-font-family ?? KHTekaMono`, so setting a single custom font keeps mono text styled. A new `--apkt-font-family-mono` theme variable allows overriding the monospace font on its own, and the bundled `KHTekaMono` face is only injected when it is actually the effective mono font. Default behavior with no custom font is unchanged.
