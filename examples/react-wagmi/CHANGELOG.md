# @examples/react-wagmi

## 5.0.11

### Patch Changes

- - Hotfix to prevent loading state with QR code

- Updated dependencies []:
  - @web3modal/wagmi@5.0.11

## 5.0.10

- chore: update with v5 by @tomiir in https://github.com/WalletConnect/web3modal/pull/2612
- fix: move the wagmi state mutation to outside of 1-click auth flow by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2585
- :hotfix fix svg error when requesting farcaster qr code by @svenvoskamp in https://github.com/WalletConnect/web3modal/pull/2621

**Full Changelog**: https://github.com/WalletConnect/web3modal/compare/5.0.9...5.0.10

- Updated dependencies []:
  - @web3modal/wagmi@5.0.10

## 5.0.9

### Patch Changes

- - chore: refine link names by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2588
- hotfix change secure site origin domain to .org by @svenvoskamp in https://github.com/WalletConnect/web3modal/pull/2603

**Full Changelog**: https://github.com/WalletConnect/web3modal/compare/5.0.8...5.0.9

## 5.0.8

### Patch Changes

- - chore: lab loading indicator by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2548
  - fix: not allow multiple account syncs for same caip address by @zoruka in https://github.com/WalletConnect/web3modal/pull/2547
  - fix: missing network not supported modal on wallet network switch by @zoruka in https://github.com/WalletConnect/web3modal/pull/2565
  - chore: add clientId to BlockchainAPI requests by @tomiir in https://github.com/WalletConnect/web3modal/pull/2521
  - Chore/split internal external testing by @svenvoskamp in https://github.com/WalletConnect/web3modal/pull/2563
  - fix: remove 200ms QR delay by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2567
  - [TDW] move from npm to pnpm by @segunadebayo in https://github.com/WalletConnect/web3modal/pull/2545
  - feat: enableSwaps option by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2573
  - build: fix dockerfile and bring back turbo by @segunadebayo in https://github.com/WalletConnect/web3modal/pull/2582
  - chore: updates providers to `2.14` by @ganchoradkov in https://github.com/WalletConnect/web3modal/pull/2557
  - fix: gets chains from approved accounts by @ganchoradkov in https://github.com/WalletConnect/web3modal/pull/2562
  - :fix show right icon for multi-address account by @svenvoskamp in https://github.com/WalletConnect/web3modal/pull/2560
  - feat: add wallet features and socials github tests by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2571
  - fix: multiple account syncs on wagmi by @zoruka in https://github.com/WalletConnect/web3modal/pull/2575
  - feat: apply RPC refactor and EIP5792 schema changes by @tomiir in https://github.com/WalletConnect/web3modal/pull/2580
  - refactor: turbo pipeline by @segunadebayo in https://github.com/WalletConnect/web3modal/pull/2587

  **Full Changelog**: https://github.com/WalletConnect/web3modal/compare/5.0.7...5.0.8

- Updated dependencies []:
  - @web3modal/wagmi@5.0.8

## 5.0.7

### Patch Changes

- - feat: multi address by @ganchoradkov in https://github.com/WalletConnect/web3modal/pull/2286
  - feat: feat: added vue for exports in solana by @phoenixVS in https://github.com/WalletConnect/web3modal/pull/2449
  - fix: wagmi authConnector connectExternal resolving issue and enable wagmi email tests by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2504
  - chore: configures report-only CSP for lab by @bkrem in https://github.com/WalletConnect/web3modal/pull/2388
  - fix: settings btn styling by @ganchoradkov in https://github.com/WalletConnect/web3modal/pull/2523
  - Add Wallet Standard to AppKit + Solana by @glitch-txs in https://github.com/WalletConnect/web3modal/pull/2482
  - chore: remove onramp widget from labs by @tomiir in https://github.com/WalletConnect/web3modal/pull/2526
  - feat: support custom connectors by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2119
  - fix: disconnect logic for EIP6963 & Injected provider types for @web3modal/ethers by @hmzakhalid in https://github.com/WalletConnect/web3modal/pull/2289
  - Feat ERC7715 grant_permissions support on lab by @KannuSingh in https://github.com/WalletConnect/web3modal/pull/2500
  - update chain on network change by @glitch-txs in https://github.com/WalletConnect/web3modal/pull/2497
  - fix: make accounts optional in social response by @tomiir in https://github.com/WalletConnect/web3modal/pull/2520
  - chore: SA Tests switch network before flow by @tomiir in https://github.com/WalletConnect/web3modal/pull/2529
  - chore: changed react native universal links by @ignaciosantise in https://github.com/WalletConnect/web3modal/pull/2535
  - chore: change labs' ethers rpc urls to walletconnect.org by @tomiir in https://github.com/WalletConnect/web3modal/pull/2530
  - chore: remove 'no-cache' from API requests by @tomiir in https://github.com/WalletConnect/web3modal/pull/2538
  - fix: makes `getMessageParams` siwe client method optional by @ganchoradkov in https://github.com/WalletConnect/web3modal/pull/2305
  - chore: update secure site url to org domain by @tomiir in https://github.com/WalletConnect/web3modal/pull/2537
  - fix: multiple name by @tomiir in https://github.com/WalletConnect/web3modal/pull/2410
  - refactor(common): utils by @Simon-He95 in https://github.com/WalletConnect/web3modal/pull/2447
  - fix: reorder chains to have current chain Id as main message by @tomiir in https://github.com/WalletConnect/web3modal/pull/2423
  - refactor: change solana testnet and devnet rpcs to wc by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2541
  - refactor: laboratory wagmi tests by @zoruka in https://github.com/WalletConnect/web3modal/pull/2552
  - fix: sync accounts in wagmi and subscribe to account change by @tomiir in https://github.com/WalletConnect/web3modal/pull/2544
- Updated dependencies []:
  - @web3modal/wagmi@5.0.7

## 5.0.6

### Patch Changes

- fix: Social Login illegal invocation issue. Wagmi tests

- Updated dependencies []:
  - @web3modal/wagmi@5.0.6

## 5.0.5

### Patch Changes

- feat: universal link internal flag. Add kotlin assetlinks. Fix email truncation'

- Updated dependencies []:
  - @web3modal/wagmi@5.0.5

## 5.0.4

### Patch Changes

- fix: wcPromise incompatibility issues

- Updated dependencies []:
  - @web3modal/wagmi@5.0.4

## 5.0.3

### Patch Changes

- fix: ethers5 coinbase issues. Turbo build issues. Upate cb connector.

- Updated dependencies []:
  - @web3modal/wagmi@5.0.3

## 5.0.2

### Patch Changes

- fix: siwe signOutOnNetwork change issue. fix: wallets filtered by rdns matched from explorer api. fix: solana network id issue

- Updated dependencies []:
  - @web3modal/wagmi@5.0.2

## 5.0.1

### Patch Changes

- fix: remove walletconnect restriction on names

- Updated dependencies []:
  - @web3modal/wagmi@5.0.1

## 5.0.0

### Major Changes

- Release V5

### Patch Changes

- Updated dependencies []:
  - @web3modal/wagmi@5.0.0

## 5.0.0-cn-v5.0

### Major Changes

- Test V5

### Patch Changes

- Updated dependencies []:
  - @web3modal/wagmi@5.0.0-cn-v5.0

## 4.2.3

### Patch Changes

- feat: - feat: restricted ens names. fix: iat set automatically if not present in messageParams. Adds siwe config handlers

- Updated dependencies []:
  - @web3modal/wagmi@4.2.3

## 4.2.3-alpha.0

### Patch Changes

- feat: add support for coinbase smart accounts

- Updated dependencies []:
  - @web3modal/wagmi@4.2.3-alpha.0

## 4.2.2

### Patch Changes

- feat: social login refactor. wagmi sendCalls support. refactor theme variables

- Updated dependencies []:
  - @web3modal/wagmi@4.2.2

## 4.2.1

### Patch Changes

- Hotfix to support injected and announced wallets in in app browsers

- Updated dependencies []:
  - @web3modal/wagmi@4.2.1

## 4.2.0

### Patch Changes

- release: 4.2.0 version release

- Updated dependencies []:
  - @web3modal/wagmi@4.2.0

## 4.2.0-alpha.0

### Patch Changes

- feat: 4.2.0-alpha release

- Updated dependencies []:
  - @web3modal/wagmi@4.2.0-alpha.0

## 4.2.0-03e4f4a8.2

### Patch Changes

- fix: Issue with SIWE + Wagmi sign out. Fixes issue where signature verification fail resulted in empty open modal'

- Updated dependencies []:
  - @web3modal/wagmi@4.2.0-03e4f4a8.2

## 4.2.0-448f7f4.1

### Minor Changes

- refactor: improvements to all features (siwe, send, swaps, ui and ux)

### Patch Changes

- Updated dependencies []:
  - @web3modal/wagmi@4.2.0-448f7f4.1

## 4.1.12-910a844.0

### Patch Changes

- refactor: sync theme with secure site

- Updated dependencies []:
  - @web3modal/wagmi@4.1.12-910a844.0

## 4.1.11

### Patch Changes

- refactor: Solana exported helper methods and proram instruction improvements
- refactor: email and smart account improvements
- refactor: unit test CI check improvements
- feat: convert

- Updated dependencies []:
  - @web3modal/wagmi@4.1.11

## 4.1.10

### Patch Changes

- Fix activity list styling issue

- Updated dependencies []:
  - @web3modal/wagmi@4.1.10

## 4.1.9

### Patch Changes

- Blockchain API fix

- Updated dependencies []:
  - @web3modal/wagmi@4.1.9

## 4.1.8

### Patch Changes

- Hotfix for redundant tokenbalance calls

- Updated dependencies []:
  - @web3modal/wagmi@4.1.8

## 4.1.7

### Patch Changes

- Hotfix for inccorect state of w3m-button when email is enabled

- Updated dependencies []:
  - @web3modal/wagmi@4.1.7

## 4.1.6

### Patch Changes

- Fix modal default height. Fix ethers email connection lag. Fix ethers + rc relay disconnect issue. Adds new wui-components for secure site.

- Updated dependencies []:
  - @web3modal/wagmi@4.1.6

## 4.1.6-a0733f5.0

### Patch Changes

- chore: canary release for siwe dependency

- Updated dependencies []:
  - @web3modal/ethers@4.1.6-a0733f5.0
  - @web3modal/siwe@4.1.6-a0733f5.0
  - @web3modal/solana@4.1.6-a0733f5.0
  - @web3modal/wagmi@4.1.6-a0733f5.0

## 4.1.5

### Patch Changes

- release: v4.1.5

- Updated dependencies []:
  - @web3modal/wagmi@4.1.5

## 4.1.5-93c81127.0

### Patch Changes

- fix: polyfill process in wallet package

- Updated dependencies []:
  - @web3modal/wagmi@4.1.5-93c81127.0

## 4.1.4

### Patch Changes

- feat: wallet info hook

- Updated dependencies []:
  - @web3modal/wagmi@4.1.4

## 4.1.3

### Patch Changes

- feat: wallet info hook

- feat: reset version to 4.1.3

- Updated dependencies []:
  - @web3modal/wagmi@4.1.3

## 4.1.3-5f2ae345.1

### Patch Changes

- canary: test imports

- Updated dependencies []:
  - @web3modal/wagmi@4.1.3-5f2ae345.1

## 4.1.3-8e039e.0

### Patch Changes

- feat: update optional dependencies

- Updated dependencies []:
  - @web3modal/wagmi@4.1.3-8e039e.0

## 4.1.2

### Patch Changes

- 4.1.2 release

- Updated dependencies []:
  - @web3modal/wagmi@4.1.2

## 4.2.0-4b5257b4.1

### Minor Changes

- [#2052](https://github.com/WalletConnect/web3modal/pull/2052) [`1b90376`](https://github.com/WalletConnect/web3modal/commit/1b903765a675f0f1b9ea0a44bcf84e2dad6b4436) Thanks [@enesozturk](https://github.com/enesozturk)! - refactor: add missing extensions on imports

- feat: export solana chains from the solana package

- [#2052](https://github.com/WalletConnect/web3modal/pull/2052) [`729313f`](https://github.com/WalletConnect/web3modal/commit/729313fe9dfb402ca694cbd77f49cc61895e2d07) Thanks [@enesozturk](https://github.com/enesozturk)! - chore: new solana canary release

### Patch Changes

- Updated dependencies [[`1b90376`](https://github.com/WalletConnect/web3modal/commit/1b903765a675f0f1b9ea0a44bcf84e2dad6b4436), [`729313f`](https://github.com/WalletConnect/web3modal/commit/729313fe9dfb402ca694cbd77f49cc61895e2d07)]:
  - @web3modal/wagmi@4.2.0-4b5257b4.1

## 4.2.0-dbbd8c44.0

### Minor Changes

- refactor: add missing extensions on imports

### Patch Changes

- Updated dependencies []:
  - @web3modal/ui@4.2.0-dbbd8c44.0
  - @web3modal/common@4.2.0-dbbd8c44.0

## 4.2.0-500a38.0

### Minor Changes

- feat: solana integration

### Patch Changes

- Updated dependencies []:
  - @web3modal/wagmi@4.2.0-500a38.0

## 4.1.1

### Patch Changes

- Fix siwe version

- Updated dependencies []:
  - @web3modal/wagmi@4.1.1

## 4.1.0

### Minor Changes

- Email Stable release

### Patch Changes

- Updated dependencies []:
  - @web3modal/wagmi@4.1.0

## 4.0.13

### Patch Changes

- Fix secure site url

- Updated dependencies []:
  - @web3modal/wagmi@4.0.13

## 4.0.12

### Patch Changes

- [#2014](https://github.com/WalletConnect/web3modal/pull/2014) [`95b35e1`](https://github.com/WalletConnect/web3modal/commit/95b35e1ebaf261a56a29cd9254d85b7c1430bfc0) Thanks [@tomiir](https://github.com/tomiir)! - Smart Account RPC handler canary

- Smart Account initialization and feature flag

- Updated dependencies [[`95b35e1`](https://github.com/WalletConnect/web3modal/commit/95b35e1ebaf261a56a29cd9254d85b7c1430bfc0)]:
  - @web3modal/wagmi@4.0.12

## 4.0.12-0c59f84f.0

### Patch Changes

- Smart Account RPC handler canary

- Updated dependencies []:
  - @web3modal/wagmi@4.0.12-0c59f84f.0

## 4.0.11

### Patch Changes

- Analytics connection event improvements. Unsupported chain flag. Siwe package refactor. RPC improvements. UI improvements'

- Updated dependencies []:
  - @web3modal/wagmi@4.0.11

## 4.0.10

### Patch Changes

- Add error state to wui-chip composite

- Updated dependencies []:
  - @web3modal/wagmi@4.0.10

## 4.0.9

### Patch Changes

- Add all rpc methods + auto reject when modal closes

- Updated dependencies []:
  - @web3modal/wagmi@4.0.9

## 4.0.8

### Patch Changes

- [#1954](https://github.com/WalletConnect/web3modal/pull/1954) [`c3366e7`](https://github.com/WalletConnect/web3modal/commit/c3366e7211dba2f5c6d3377c9d9a77da5a52c0d8) Thanks [@tomiir](https://github.com/tomiir)! - Add support for eth_getBlockByNumber

- Updated dependencies [[`c3366e7`](https://github.com/WalletConnect/web3modal/commit/c3366e7211dba2f5c6d3377c9d9a77da5a52c0d8)]:
  - @web3modal/wagmi@4.0.8

## 4.0.8-f1845392.0

### Patch Changes

- [#1954](https://github.com/WalletConnect/web3modal/pull/1954) [`4755109`](https://github.com/WalletConnect/web3modal/commit/475510962a92ea9f4388db1d08c979d99da18e54) Thanks [@tomiir](https://github.com/tomiir)! - Add support for eth_getBlockByNumber

- Updated dependencies [[`4755109`](https://github.com/WalletConnect/web3modal/commit/475510962a92ea9f4388db1d08c979d99da18e54)]:
  - @web3modal/wagmi@4.0.8-f1845392.0

## 4.0.7

### Patch Changes

- Add eth_getBalance to list of allowed methods

- Updated dependencies []:
  - @web3modal/wagmi@4.0.7

## 4.0.6

### Patch Changes

- Email stability fixes

- Updated dependencies []:
  - @web3modal/wagmi@4.0.6

## 4.0.5

### Patch Changes

- [#1917](https://github.com/WalletConnect/web3modal/pull/1917) [`f79566c`](https://github.com/WalletConnect/web3modal/commit/f79566ca5119fa12795dd49fce01aea8e1a05d97) Thanks [@tomiir](https://github.com/tomiir)! - Replaces public url with blockchain api for supported networks

- Updated dependencies [[`f79566c`](https://github.com/WalletConnect/web3modal/commit/f79566ca5119fa12795dd49fce01aea8e1a05d97)]:
  - @web3modal/wagmi@4.0.5

## 4.0.4

### Patch Changes

- Fix theming issue for email

- Updated dependencies []:
  - @web3modal/wagmi@4.0.4

## 4.0.3

### Patch Changes

- Tag email beta, Sync Theme For Secure Wallet, Use manual version in constants

- Updated dependencies []:
  - @web3modal/wagmi@4.0.3

## 4.0.2

### Patch Changes

- [#1899](https://github.com/WalletConnect/web3modal/pull/1899) [`42e97a0`](https://github.com/WalletConnect/web3modal/commit/42e97a04eb60090a821019ae80d62acacf35fc66) Thanks [@xzilja](https://github.com/xzilja)! - Reverted change that removed email update flow from account view

- Updated dependencies [[`42e97a0`](https://github.com/WalletConnect/web3modal/commit/42e97a04eb60090a821019ae80d62acacf35fc66)]:
  - @web3modal/wagmi@4.0.2

## 4.0.1

### Patch Changes

- [#1879](https://github.com/WalletConnect/web3modal/pull/1879) [`e3fa353`](https://github.com/WalletConnect/web3modal/commit/e3fa35396e3d2b1153d12bfaf92738bc67b46640) Thanks [@svenvoskamp](https://github.com/svenvoskamp)! - Fix various issues on ethers/ethers5 package

- Updated dependencies [[`e3fa353`](https://github.com/WalletConnect/web3modal/commit/e3fa35396e3d2b1153d12bfaf92738bc67b46640)]:
  - @web3modal/wagmi@4.0.1
