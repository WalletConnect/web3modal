---
'@reown/appkit-controllers': patch
---

Gate `StorageUtil` console logs behind the `debug` option, so `createAppKit({ debug: false })` silences cache and storage info/error logs in production. Fixes #5521.
