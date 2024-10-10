/** @type {import('next').NextConfig} */
const SHAKRA_UI = `'sha256-e7MRMmTzLsLQvIy1iizO1lXf7VWYoQ6ysj5fuUzvRwE='`
/*
 * Keep in-sync with https://docs.reown.com/advanced/security/content-security-policy
 * DO NOT use `unsafe-inline` or `unsafe-eval` for `script-src` or `default-src` in production as this
 * is against CSP best practices
 */
const secureSiteDomain = process.env.NEXT_PUBLIC_SECURE_SITE_SDK_URL
  ? new URL(process.env.NEXT_PUBLIC_SECURE_SITE_SDK_URL).origin
  : ''
const cspHeader = `
  default-src 'self';
  script-src 'self' ${SHAKRA_UI} ${process.env.NODE_ENV === 'production' ? '' : "'unsafe-eval'"};
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src * 'self' data: blob: https://walletconnect.org https://walletconnect.com https://secure.walletconnect.com https://secure.walletconnect.org https://tokens-data.1inch.io https://tokens.1inch.io https://ipfs.io https://appkit-lab.reown.org;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://react-wallet.walletconnect.com https://rpc.walletconnect.com https://rpc.walletconnect.org https://relay.walletconnect.com https://relay.walletconnect.org wss://relay.walletconnect.com wss://relay.walletconnect.org https://pulse.walletconnect.com https://pulse.walletconnect.org https://api.web3modal.com https://api.web3modal.org wss://www.walletlink.org https://o1095249.ingest.sentry.io https://quote-api.jup.ag;
  frame-src 'self' https://66ecb4c7.secure-appkit-sdk.pages.dev https://verify.walletconnect.com https://verify.walletconnect.org https://secure.walletconnect.com https://secure.walletconnect.org https://secure.reown.com https://widget.solflare.com/ ${secureSiteDomain}/;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  report-uri https://o1095249.ingest.sentry.io/api/4505685639364608/security/?sentry_key=36ff1e79c60877fce6c0273e94a8ed69;
  report-to csp-endpoint
`

// Reference: https://docs.sentry.io/security-legal-pii/security/security-policy-reporting/#content-security-policy
const cspReportToHeader = {
  group: 'csp-endpoint',
  max_age: 10886400,
  endpoints: [
    {
      url: 'https://o1095249.ingest.sentry.io/api/4505685639364608/security/?sentry_key=36ff1e79c60877fce6c0273e94a8ed69'
    }
  ],
  include_subdomains: true
}

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  distDir: 'out',
  cleanDistDir: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ' ').trim()
          },
          {
            key: 'Report-To',
            value: JSON.stringify(cspReportToHeader)
          }
        ]
      },
      {
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'content-type', value: 'application/json' }]
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [{ key: 'content-type', value: 'application/json' }]
      }
    ]
  }
}

export default nextConfig
