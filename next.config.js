/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              // allow self and Stripe.js for scripts/styles/etc
              "default-src 'self' https://js.stripe.com",
              // allow fetch/XHR/websocket to Stripe and your backend
              "connect-src 'self' https://js.stripe.com https://siteguard-backend.onrender.com",
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
