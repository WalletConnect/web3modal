---
'@reown/appkit-ui': patch
'@reown/appkit-common': patch
'@reown/appkit-controllers': patch
---

Fix monospace text (WalletConnect "Copy link", wallet addresses, amount inputs) rendering in the browser default font when a custom `--apkt-font-family` is set. Added a `--apkt-font-family-mono` theme variable that falls back to `--apkt-font-family` when not provided, so a single custom font now styles monospace text too.
