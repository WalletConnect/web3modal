# @web3modal/scaffold-utils

## 5.1.7-9fc6442bc.6

### Patch Changes

- Always fetch nonce
- Updated dependencies
  - @web3modal/polyfills@5.1.7-9fc6442bc.6
  - @web3modal/common@5.1.7-9fc6442bc.6
  - @web3modal/wallet@5.1.7-9fc6442bc.6
  - @web3modal/core@5.1.7-9fc6442bc.6

## 5.1.7-a869e5cdc.5

### Patch Changes

- Update profiles API url
- Updated dependencies
  - @web3modal/polyfills@5.1.7-a869e5cdc.5
  - @web3modal/common@5.1.7-a869e5cdc.5
  - @web3modal/wallet@5.1.7-a869e5cdc.5
  - @web3modal/core@5.1.7-a869e5cdc.5

## 5.1.7-a1740ab9a.4

### Patch Changes

- Fix SIWE and 1CA bad states
- Updated dependencies
  - @web3modal/polyfills@5.1.7-a1740ab9a.4
  - @web3modal/common@5.1.7-a1740ab9a.4
  - @web3modal/wallet@5.1.7-a1740ab9a.4
  - @web3modal/core@5.1.7-a1740ab9a.4

## 5.1.7-e26f36a6d.3

### Patch Changes

- Fix disconnect issues
- Updated dependencies
  - @web3modal/polyfills@5.1.7-e26f36a6d.3
  - @web3modal/common@5.1.7-e26f36a6d.3
  - @web3modal/wallet@5.1.7-e26f36a6d.3
  - @web3modal/core@5.1.7-e26f36a6d.3

## 5.1.7-b13f6b079.2

### Patch Changes

- Remove signOut call on signIn
- Updated dependencies
  - @web3modal/polyfills@5.1.7-b13f6b079.2
  - @web3modal/common@5.1.7-b13f6b079.2
  - @web3modal/wallet@5.1.7-b13f6b079.2
  - @web3modal/core@5.1.7-b13f6b079.2

## 5.1.7-bb7e41a6f.1

### Patch Changes

- Revert Profiles API URL
- Updated dependencies
  - @web3modal/polyfills@5.1.7-bb7e41a6f.1
  - @web3modal/common@5.1.7-bb7e41a6f.1
  - @web3modal/wallet@5.1.7-bb7e41a6f.1
  - @web3modal/core@5.1.7-bb7e41a6f.1

## 5.1.7-bbb053961.0

### Patch Changes

- Bump wagmi and ethereum provider
- Updated dependencies
  - @web3modal/common@5.1.7-bbb053961.0
  - @web3modal/core@5.1.7-bbb053961.0
  - @web3modal/polyfills@5.1.7-bbb053961.0
  - @web3modal/wallet@5.1.7-bbb053961.0

## 5.1.7

### Patch Changes

- - chore: version bump for 5.1.6 by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2797
  - fix(deps): update walletconnect to v2.15.2 by @renovate in https://github.com/WalletConnect/web3modal/pull/2722
  - chore: fix public URL by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2806
  - fix: RPC requests causing modal to close by @tomiir in https://github.com/WalletConnect/web3modal/pull/2799
  - chore: use apiVersion v2 on names endpoint by @tomiir in https://github.com/WalletConnect/web3modal/pull/2805
  - fix: import valtio from vanilla path by @jd1378 in https://github.com/WalletConnect/web3modal/pull/2810
  - chore: use shared gh token by @tomiir in https://github.com/WalletConnect/web3modal/pull/2809
  - chore: add input secrets to setup workflow by @tomiir in https://github.com/WalletConnect/web3modal/pull/2822
  - fix: remove deprecated params from sign transaction wc rpc request by @zoruka in https://github.com/WalletConnect/web3modal/pull/2816
  - chore: changed android and ios links for react native sample apps by @ignaciosantise in https://github.com/WalletConnect/web3modal/pull/2825
  - chore: changed order of links by @ignaciosantise in https://github.com/WalletConnect/web3modal/pull/2826
  - fix(siwe): fix undefined SIWE chainId by @Cali93 in https://github.com/WalletConnect/web3modal/pull/2820
  - chore: update monorepo deps to 2.16.1 by @tomiir in https://github.com/WalletConnect/web3modal/pull/2829
  - fix: don't capitalize first character of email field on mobile by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2815
  - chore(deps): update dependency ethers to v6.13.2 by @renovate in https://github.com/WalletConnect/web3modal/pull/2434
  - chore(deps): update wagmi by @renovate in https://github.com/WalletConnect/web3modal/pull/2711
- Updated dependencies []:
  - @web3modal/common@5.1.7
  - @web3modal/core@5.1.7
  - @web3modal/polyfills@5.1.7
  - @web3modal/wallet@5.1.7

## 5.1.6

### Patch Changes

- fix: update CSP by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2775
- fix: ethers5 adapter import in exports by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2754
- fix/missing action functions exports from clients by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2778
- fix: logics to set default chain by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2787
- Implement actions using userOpBuilder service instead of permissionless.js by @KannuSingh in https://github.com/WalletConnect/web3modal/pull/2758
- chore: run Playwright on self-hosted runners by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2788
- chore: add NEXT_PUBLIC_SECURE_SITE_SDK_URL to CSP by @tomiir in https://github.com/WalletConnect/web3modal/pull/2791
- chore: enable verify tests by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2774
- fix: social login shows `undefined` by @magiziz in https://github.com/WalletConnect/web3modal/pull/2783

* Updated dependencies []:
  - @web3modal/common@5.1.6
  - @web3modal/core@5.1.6
  - @web3modal/polyfills@5.1.6
  - @web3modal/wallet@5.1.6

## 5.1.5

### Patch Changes

- - chore: add safety for localstorage by @zoruka in https://github.com/WalletConnect/web3modal/pull/2770
  - fix: impossible to press on send placeholder input on mobile by @magiziz in https://github.com/WalletConnect/web3modal/pull/2771
  - feat: solana sign all transactions by @zoruka in https://github.com/WalletConnect/web3modal/pull/2772
  - chore: change universal provider relay url and move to constants file by @zoruka in https://github.com/WalletConnect/web3modal/pull/2776
  - chore: remove coinbase SDK de-duplication by @tomiir in https://github.com/WalletConnect/web3modal/pull/2768
  - fix: add missing chainId param for transactions request by @zoruka in https://github.com/WalletConnect/web3modal/pull/2779
  - fix: remove coming message from solana transactions by @zoruka in https://github.com/WalletConnect/web3modal/pull/2780

- Updated dependencies []:
  - @web3modal/common@5.1.5
  - @web3modal/core@5.1.5
  - @web3modal/polyfills@5.1.5
  - @web3modal/wallet@5.1.5

## 5.1.4

### Patch Changes

- - Added entries on assetlinks for flutter wallet by @quetool in https://github.com/WalletConnect/web3modal/pull/2746
  - chore: only upgrade ethers v6 by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2741
  - chore: fix wagmi not disconnecting and add adapter tests by @magiziz in https://github.com/WalletConnect/web3modal/pull/2751
  - Added more fingerprints to Flutter apps by @quetool in https://github.com/WalletConnect/web3modal/pull/2748
  - fix: remove auth connector from ethers and check for socials length by @tomiir in https://github.com/WalletConnect/web3modal/pull/2715
  - chore: make all socials enabled by default by @tomiir in https://github.com/WalletConnect/web3modal/pull/2747
  - fix: social logins not working in laboratory by @magiziz in https://github.com/WalletConnect/web3modal/pull/2765
  - chore: expose solana provider type by @zoruka in https://github.com/WalletConnect/web3modal/pull/2756
  - fix: Connector image mismatch by @tomiir in https://github.com/WalletConnect/web3modal/pull/2745
- Updated dependencies []:
  - @web3modal/common@5.1.4
  - @web3modal/core@5.1.4
  - @web3modal/polyfills@5.1.4
  - @web3modal/wallet@5.1.4

## 5.1.3

### Patch Changes

- refactor: defaultChain ts mismatch, custom hooks, separation of dependencies

- Updated dependencies []:
  - @web3modal/common@5.1.3
  - @web3modal/core@5.1.3
  - @web3modal/polyfills@5.1.3
  - @web3modal/wallet@5.1.3

## 5.1.2

### Patch Changes

- Added Solana Auth Provider types and schemas

- Updated dependencies []:
  - @web3modal/common@5.1.2
  - @web3modal/core@5.1.2
  - @web3modal/polyfills@5.1.2
  - @web3modal/wallet@5.1.2

## 5.1.1

### Patch Changes

- Update EthProvider to v 2.15.1

- Updated dependencies []:
  - @web3modal/core@5.1.1
  - @web3modal/polyfills@5.1.1
  - @web3modal/wallet@5.1.1

## 5.1.0

### Minor Changes

Enhanced compatibility, performance, developer experience, and user interface updates across various features

- fix: remove limitation on sending versioned tx by @tomiir in https://github.com/WalletConnect/web3modal/pull/2638
- refactor: fix missing ens screens by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2639
- chore: remove non-Blockchain API RPCs by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2640
- chore: update wagmi dependencies to latest version by @tomiir in https://github.com/WalletConnect/web3modal/pull/2642
- chore: dynamic metadata URL by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2628
- add icons and wallets by @glitch-txs in https://github.com/WalletConnect/web3modal/pull/2637
- chore: fix playwright tests by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2633
- chore: more renovate by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2619
- chore: test single retry in tests by @tomiir in https://github.com/WalletConnect/web3modal/pull/2648
- feat/automated tests with metamask by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2636
- fix: import types from the package root in partials by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2650
- feat: add support for eip5792 getCapabilities and sendCalls by @tomiir in https://github.com/WalletConnect/web3modal/pull/2576
- chore: ID allocation service by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2574
- refactor: solana sign and send transaction by @zoruka in https://github.com/WalletConnect/web3modal/pull/2646
- chore: renovate updates by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2673
- fix(solana): injected connectors not detected by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2656
- chore: fix renovate includePaths by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2674
- chore: update lab names & images by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2653
- chore: fix typo by @riyueguang in https://github.com/WalletConnect/web3modal/pull/2600
- refactor: handle balance and balanceSymbol fetch to update w3m-button by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2433
- added filter transactions by chain by @glitch-txs in https://github.com/WalletConnect/web3modal/pull/1834
- refactor/wallet card item with image optimization by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2572
- fix: small balance format by @imlonghao in https://github.com/WalletConnect/web3modal/pull/2651
- feat: add git hooks with husky and add pre-push hook by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2558
- fix: add getApprovedCaipNetworks implementation by @tomiir in https://github.com/WalletConnect/web3modal/pull/2644
- chore: update vitest to v2 by @tomiir in https://github.com/WalletConnect/web3modal/pull/2678
- feat: add sender to identity and reverse resolution by @tomiir in https://github.com/WalletConnect/web3modal/pull/2649
- refactor: solana walletconnect rpc interface by @zoruka in https://github.com/WalletConnect/web3modal/pull/2677
- Wagmi: Erc7715 permissions with Appkit embedded wallet by @KannuSingh in https://github.com/WalletConnect/web3modal/pull/2615
- fix issue with modal not closing by @KannuSingh in https://github.com/WalletConnect/web3modal/pull/2680
- fix: wagmi not showing loading indicator on email reconnection by @tomiir in https://github.com/WalletConnect/web3modal/pull/2682
- fix: ethers disconnection error by @tomiir in https://github.com/WalletConnect/web3modal/pull/2683
- fix: Wagmi Switch To by @tomiir in https://github.com/WalletConnect/web3modal/pull/2679
- refactor: improvements to siwe flow and modal animations by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2672
- chore: added rn samples in apple file by @ignaciosantise in https://github.com/WalletConnect/web3modal/pull/2687
- chore: Web3Modal -> AppKit by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2686
- chore: fix metadata icon by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2685
- fix(multi-account): account switch on wagmi by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2689
- Added Flutter universal links by @quetool in https://github.com/WalletConnect/web3modal/pull/2695
- feat: add bundle size check by @lukaisailovic in https://github.com/WalletConnect/web3modal/pull/2694
- chore: remove unnecessary window.postMessage for W3mFrame by @zoruka in https://github.com/WalletConnect/web3modal/pull/2658
- refactor: standardize solana provider adapters by @zoruka in https://github.com/WalletConnect/web3modal/pull/2690
- fix: bring back old parameters for RPC call on solana_signTransaction by @zoruka in https://github.com/WalletConnect/web3modal/pull/2692
- refactor: export missing type defs from siwe package by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2703
- fix: solana qa round by @zoruka in https://github.com/WalletConnect/web3modal/pull/2704
- chore: update with latest V5 changes by @svenvoskamp in https://github.com/WalletConnect/web3modal/pull/2635
- fix(deps): update walletconnect to v2.15.0 by @renovate in https://github.com/WalletConnect/web3modal/pull/2675
- chore(deps): update wagmi by @renovate in https://github.com/WalletConnect/web3modal/pull/2676
- chore: URL on lab pages by @chris13524 in https://github.com/WalletConnect/web3modal/pull/2702
- chore: update vite-size to 0.0.5 by @lukaisailovic in https://github.com/WalletConnect/web3modal/pull/2700
- chore: change chainId type to accept string and its dependencies by @zoruka in https://github.com/WalletConnect/web3modal/pull/2632
- fix(deps): update dependency @solana/web3.js to v1.95.2 by @renovate in https://github.com/WalletConnect/web3modal/pull/2312

### New Contributors

- @riyueguang made their first contribution in https://github.com/WalletConnect/web3modal/pull/2600
- @imlonghao made their first contribution in https://github.com/WalletConnect/web3modal/pull/2651
- @quetool made their first contribution in https://github.com/WalletConnect/web3modal/pull/2695

**Full Changelog**: https://github.com/WalletConnect/web3modal/compare/5.0.11...5.1.0

### Patch Changes

- Updated dependencies []:
  - @web3modal/core@5.1.0
  - @web3modal/polyfills@5.1.0
  - @web3modal/wallet@5.1.0

## 5.0.11

### Patch Changes

- - Hotfix to prevent loading state with QR code

- Updated dependencies []:
  - @web3modal/polyfills@5.0.11
  - @web3modal/wallet@5.0.11
  - @web3modal/core@5.0.11

## 5.0.10

- chore: update with v5 by @tomiir in https://github.com/WalletConnect/web3modal/pull/2612
- fix: move the wagmi state mutation to outside of 1-click auth flow by @enesozturk in https://github.com/WalletConnect/web3modal/pull/2585
- :hotfix fix svg error when requesting farcaster qr code by @svenvoskamp in https://github.com/WalletConnect/web3modal/pull/2621

**Full Changelog**: https://github.com/WalletConnect/web3modal/compare/5.0.9...5.0.10

- Updated dependencies []:
  - @web3modal/core@5.0.10
  - @web3modal/polyfills@5.0.10
  - @web3modal/wallet@5.0.10

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
  - @web3modal/core@5.0.8
  - @web3modal/polyfills@5.0.8
  - @web3modal/wallet@5.0.8

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
  - @web3modal/core@5.0.7
  - @web3modal/polyfills@5.0.7

## 5.0.6

### Patch Changes

- fix: Social Login illegal invocation issue. Wagmi tests

- Updated dependencies []:
  - @web3modal/core@5.0.6
  - @web3modal/polyfills@5.0.6

## 5.0.5

### Patch Changes

- feat: universal link internal flag. Add kotlin assetlinks. Fix email truncation'

- Updated dependencies []:
  - @web3modal/core@5.0.5
  - @web3modal/polyfills@5.0.5

## 5.0.4

### Patch Changes

- fix: wcPromise incompatibility issues

- Updated dependencies []:
  - @web3modal/core@5.0.4
  - @web3modal/polyfills@5.0.4

## 5.0.3

### Patch Changes

- fix: ethers5 coinbase issues. Turbo build issues. Upate cb connector.

- Updated dependencies []:
  - @web3modal/core@5.0.3
  - @web3modal/polyfills@5.0.3

## 5.0.2

### Patch Changes

- fix: siwe signOutOnNetwork change issue. fix: wallets filtered by rdns matched from explorer api. fix: solana network id issue

- Updated dependencies []:
  - @web3modal/core@5.0.2
  - @web3modal/polyfills@5.0.2

## 5.0.1

### Patch Changes

- fix: remove walletconnect restriction on names

- Updated dependencies []:
  - @web3modal/polyfills@5.0.1
  - @web3modal/core@5.0.1

## 5.0.0

### Major Changes

- Release V5

### Patch Changes

- Updated dependencies []:
  - @web3modal/core@5.0.0
  - @web3modal/polyfills@5.0.0

## 5.0.0-cn-v5.0

### Major Changes

- Test V5

### Patch Changes

- Updated dependencies []:
  - @web3modal/core@5.0.0-cn-v5.0
  - @web3modal/polyfills@5.0.0-cn-v5.0

## 4.2.3

### Patch Changes

- feat: - feat: restricted ens names. fix: iat set automatically if not present in messageParams. Adds siwe config handlers

- Updated dependencies []:
  - @web3modal/core@4.2.3
  - @web3modal/polyfills@4.2.3

## 4.2.3-alpha.0

### Patch Changes

- feat: add support for coinbase smart accounts

- Updated dependencies []:
  - @web3modal/core@4.2.3-alpha.0
  - @web3modal/polyfills@4.2.3-alpha.0

## 4.2.2

### Patch Changes

- feat: social login refactor. wagmi sendCalls support. refactor theme variables

- Updated dependencies []:
  - @web3modal/core@4.2.2
  - @web3modal/polyfills@4.2.2

## 4.2.1

### Patch Changes

- Hotfix to support injected and announced wallets in in app browsers

- Updated dependencies []:
  - @web3modal/core@4.2.1
  - @web3modal/polyfills@4.2.1

## 4.2.0

### Patch Changes

- release: 4.2.0 version release

- Updated dependencies []:
  - @web3modal/core@4.2.0
  - @web3modal/polyfills@4.2.0

## 4.2.0-alpha.0

### Patch Changes

- feat: 4.2.0-alpha release

- Updated dependencies []:
  - @web3modal/polyfills@4.2.0-alpha.0
  - @web3modal/core@4.2.0-alpha.0

## 4.2.0-03e4f4a8.2

### Patch Changes

- fix: Issue with SIWE + Wagmi sign out. Fixes issue where signature verification fail resulted in empty open modal'

- Updated dependencies []:
  - @web3modal/polyfills@4.2.0-03e4f4a8.2
  - @web3modal/core@4.2.0-03e4f4a8.2

## 4.2.0-448f7f4.1

### Minor Changes

- refactor: improvements to all features (siwe, send, swaps, ui and ux)

### Patch Changes

- Updated dependencies []:
  - @web3modal/core@4.2.0-448f7f4.1
  - @web3modal/polyfills@4.2.0-448f7f4.1

## 4.1.12-910a844.0

### Patch Changes

- refactor: sync theme with secure site

- Updated dependencies []:
  - @web3modal/core@4.1.12-910a844.0
  - @web3modal/polyfills@4.1.12-910a844.0

## 4.1.11

### Patch Changes

- refactor: Solana exported helper methods and proram instruction improvements
- refactor: email and smart account improvements
- refactor: unit test CI check improvements
- feat: convert

- Updated dependencies []:
  - @web3modal/core@4.1.11
  - @web3modal/polyfills@4.1.11

## 4.1.10

### Patch Changes

- Fix activity list styling issue

- Updated dependencies []:
  - @web3modal/core@4.1.10
  - @web3modal/polyfills@4.1.10

## 4.1.9

### Patch Changes

- Blockchain API fix

- Updated dependencies []:
  - @web3modal/core@4.1.9
  - @web3modal/polyfills@4.1.9

## 4.1.8

### Patch Changes

- Hotfix for redundant tokenbalance calls

- Updated dependencies []:
  - @web3modal/core@4.1.8
  - @web3modal/polyfills@4.1.8

## 4.1.7

### Patch Changes

- Hotfix for inccorect state of w3m-button when email is enabled

- Updated dependencies []:
  - @web3modal/core@4.1.7
  - @web3modal/polyfills@4.1.7

## 4.1.6

### Patch Changes

- Fix modal default height. Fix ethers email connection lag. Fix ethers + rc relay disconnect issue. Adds new wui-components for secure site.

- Updated dependencies []:
  - @web3modal/core@4.1.6
  - @web3modal/polyfills@4.1.6

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
  - @web3modal/core@4.1.5
  - @web3modal/polyfills@4.1.5

## 4.1.5-93c81127.0

### Patch Changes

- fix: polyfill process in wallet package

- Updated dependencies []:
  - @web3modal/core@4.1.5-93c81127.0
  - @web3modal/polyfills@4.1.5-93c81127.0

## 4.1.4

### Patch Changes

- feat: wallet info hook

- Updated dependencies []:
  - @web3modal/polyfills@4.1.4
  - @web3modal/core@4.1.4

## 4.1.3

### Patch Changes

- feat: wallet info hook

- feat: reset version to 4.1.3

- Updated dependencies []:
  - @web3modal/core@4.1.3
  - @web3modal/polyfills@4.1.3

## 4.1.3-5f2ae345.1

### Patch Changes

- canary: test imports

- Updated dependencies []:
  - @web3modal/polyfills@4.1.3-5f2ae345.1
  - @web3modal/core@4.1.3-5f2ae345.1

## 4.1.3-8e039e.0

### Patch Changes

- feat: update optional dependencies

- Updated dependencies []:
  - @web3modal/polyfills@4.1.3-8e039e.0
  - @web3modal/core@4.1.3-8e039e.0

## 4.1.2

### Patch Changes

- 4.1.2 release

- Updated dependencies []:
  - @web3modal/core@4.1.2 - @web3modal/polyfills@4.1.2

## 4.2.0-4b5257b4.1

### Minor Changes

- [#2052](https://github.com/WalletConnect/web3modal/pull/2052) [`1b90376`](https://github.com/WalletConnect/web3modal/commit/1b903765a675f0f1b9ea0a44bcf84e2dad6b4436) Thanks [@enesozturk](https://github.com/enesozturk)! - refactor: add missing extensions on imports

- feat: export solana chains from the solana package

- [#2052](https://github.com/WalletConnect/web3modal/pull/2052) [`729313f`](https://github.com/WalletConnect/web3modal/commit/729313fe9dfb402ca694cbd77f49cc61895e2d07) Thanks [@enesozturk](https://github.com/enesozturk)! - chore: new solana canary release

### Patch Changes

- Updated dependencies [[`1b90376`](https://github.com/WalletConnect/web3modal/commit/1b903765a675f0f1b9ea0a44bcf84e2dad6b4436), [`729313f`](https://github.com/WalletConnect/web3modal/commit/729313fe9dfb402ca694cbd77f49cc61895e2d07)]:
  - @web3modal/core@4.2.0-4b5257b4.1
  - @web3modal/polyfills@4.2.0-4b5257b4.1

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
  - @web3modal/core@4.2.0-500a38.0
  - @web3modal/polyfills@4.2.0-500a38.0

## 4.1.1

### Patch Changes

- Fix siwe version

- Updated dependencies []:
  - @web3modal/core@4.1.1
  - @web3modal/polyfills@4.1.1

## 4.1.0

### Minor Changes

- Email Stable release

### Patch Changes

- Updated dependencies []:
  - @web3modal/core@4.1.0
  - @web3modal/polyfills@4.1.0

## 4.0.13

### Patch Changes

- Fix secure site url

- Updated dependencies []:
  - @web3modal/core@4.0.13
  - @web3modal/polyfills@4.0.13

## 4.0.12

### Patch Changes

- [#2014](https://github.com/WalletConnect/web3modal/pull/2014) [`95b35e1`](https://github.com/WalletConnect/web3modal/commit/95b35e1ebaf261a56a29cd9254d85b7c1430bfc0) Thanks [@tomiir](https://github.com/tomiir)! - Smart Account RPC handler canary

- Smart Account initialization and feature flag

- Updated dependencies [[`95b35e1`](https://github.com/WalletConnect/web3modal/commit/95b35e1ebaf261a56a29cd9254d85b7c1430bfc0)]:
  - @web3modal/core@4.0.12
  - @web3modal/polyfills@4.0.12

## 4.0.12-0c59f84f.0

### Patch Changes

- Smart Account RPC handler canary

- Updated dependencies []:
  - @web3modal/core@4.0.12-0c59f84f.0
  - @web3modal/polyfills@4.0.12-0c59f84f.0

## 4.0.11

### Patch Changes

- Analytics connection event improvements. Unsupported chain flag. Siwe package refactor. RPC improvements. UI improvements'

- Updated dependencies []:
  - @web3modal/core@4.0.11
  - @web3modal/polyfills@4.0.11

## 4.0.10

### Patch Changes

- Add error state to wui-chip composite

- Updated dependencies []:
  - @web3modal/polyfills@4.0.10
  - @web3modal/scaffold@4.0.10

## 4.0.9

### Patch Changes

- Add all rpc methods + auto reject when modal closes

- Updated dependencies []:
  - @web3modal/polyfills@4.0.9
  - @web3modal/scaffold@4.0.9

## 4.0.8

### Patch Changes

- [#1954](https://github.com/WalletConnect/web3modal/pull/1954) [`c3366e7`](https://github.com/WalletConnect/web3modal/commit/c3366e7211dba2f5c6d3377c9d9a77da5a52c0d8) Thanks [@tomiir](https://github.com/tomiir)! - Add support for eth_getBlockByNumber

- Updated dependencies [[`c3366e7`](https://github.com/WalletConnect/web3modal/commit/c3366e7211dba2f5c6d3377c9d9a77da5a52c0d8)]:
  - @web3modal/polyfills@4.0.8
  - @web3modal/scaffold@4.0.8

## 4.0.8-f1845392.0

### Patch Changes

- [#1954](https://github.com/WalletConnect/web3modal/pull/1954) [`4755109`](https://github.com/WalletConnect/web3modal/commit/475510962a92ea9f4388db1d08c979d99da18e54) Thanks [@tomiir](https://github.com/tomiir)! - Add support for eth_getBlockByNumber

- Updated dependencies [[`4755109`](https://github.com/WalletConnect/web3modal/commit/475510962a92ea9f4388db1d08c979d99da18e54)]:
  - @web3modal/polyfills@4.0.8-f1845392.0
  - @web3modal/scaffold@4.0.8-f1845392.0

## 4.0.7

### Patch Changes

- Add eth_getBalance to list of allowed methods

- Updated dependencies []:
  - @web3modal/polyfills@4.0.7
  - @web3modal/scaffold@4.0.7

## 4.0.6

### Patch Changes

- Email stability fixes

- Updated dependencies []:
  - @web3modal/polyfills@4.0.6
  - @web3modal/scaffold@4.0.6

## 4.0.5

### Patch Changes

- [#1917](https://github.com/WalletConnect/web3modal/pull/1917) [`f79566c`](https://github.com/WalletConnect/web3modal/commit/f79566ca5119fa12795dd49fce01aea8e1a05d97) Thanks [@tomiir](https://github.com/tomiir)! - Replaces public url with blockchain api for supported networks

- Updated dependencies [[`f79566c`](https://github.com/WalletConnect/web3modal/commit/f79566ca5119fa12795dd49fce01aea8e1a05d97)]:
  - @web3modal/polyfills@4.0.5
  - @web3modal/scaffold@4.0.5

## 4.0.4

### Patch Changes

- Fix theming issue for email

- Updated dependencies []:
  - @web3modal/scaffold@4.0.4
  - @web3modal/polyfills@4.0.4

## 4.0.3

### Patch Changes

- Tag email beta, Sync Theme For Secure Wallet, Use manual version in constants

- Updated dependencies []:
  - @web3modal/scaffold@4.0.3
  - @web3modal/polyfills@4.0.3

## 4.0.2

### Patch Changes

- [#1899](https://github.com/WalletConnect/web3modal/pull/1899) [`42e97a0`](https://github.com/WalletConnect/web3modal/commit/42e97a04eb60090a821019ae80d62acacf35fc66) Thanks [@xzilja](https://github.com/xzilja)! - Reverted change that removed email update flow from account view

- Updated dependencies [[`42e97a0`](https://github.com/WalletConnect/web3modal/commit/42e97a04eb60090a821019ae80d62acacf35fc66)]:
  - @web3modal/polyfills@4.0.2
  - @web3modal/scaffold@4.0.2

## 4.0.1

### Patch Changes

- [#1879](https://github.com/WalletConnect/web3modal/pull/1879) [`e3fa353`](https://github.com/WalletConnect/web3modal/commit/e3fa35396e3d2b1153d12bfaf92738bc67b46640) Thanks [@svenvoskamp](https://github.com/svenvoskamp)! - Fix various issues on ethers/ethers5 package

- Updated dependencies [[`e3fa353`](https://github.com/WalletConnect/web3modal/commit/e3fa35396e3d2b1153d12bfaf92738bc67b46640)]:
  - @web3modal/polyfills@4.0.1
  - @web3modal/scaffold@4.0.1
