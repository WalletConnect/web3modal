---
'@reown/appkit-controllers': patch
---

Fix SIWX sign-in failing on EVM with Phantom under Reown Cloud Auth ("The app's signature request cannot be shown due to invalid formatting"). The `ReownAuthentication` SIWE message was not EIP-4361-compliant for EVM: with no statement it emitted a single blank line after the address instead of the two the spec requires (the empty statement block must stay delimited), and it used the CAIP-2 chain id (`Chain ID: eip155:1`) instead of the decimal EIP-155 id (`Chain ID: 1`). Strict wallets like Phantom rejected the message before showing the prompt; lenient wallets (MetaMask) signed it anyway.

`ReownAuthenticationMessenger` now emits the compliant blank-line structure and decimal `Chain ID` for EVM. The change is scoped to the EVM (`eip155`) namespace only — non-EVM messages (Solana, Bitcoin, ...) are byte-for-byte unchanged. The Reown Cloud Auth backend must accept the compliant message (it validates the message server-side).
