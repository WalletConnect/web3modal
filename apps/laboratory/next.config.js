/** @type {import('next').NextConfig} */
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://walletconnect.org https://walletconnect.com https://secure.walletconnect.com https://secure.walletconnect.org https://tokens-data.1inch.io https://tokens.1inch.io https://ipfs.io https://lab.web3modal.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://rpc.walletconnect.com https://rpc.walletconnect.org https://explorer.walletconnect.com https://explorer.walletconnect.org https://relay.walletconnect.com https://relay.walletconnect.org wss://relay.walletconnect.com wss://relay.walletconnect.org https://pulse.walletconnect.com https://pulse.walletconnect.org https://api.web3modal.com https://api.web3modal.org wss://www.walletlink.org https://o1095249.ingest.sentry.io https://arb1.arbitrum.io;
  frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org https://secure.walletconnect.com https://secure.walletconnect.org;
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
            key: 'Content-Security-Policy-Report-Only',
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
      }
    ]
  }
}

module.exports = nextConfig
