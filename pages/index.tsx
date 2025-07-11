import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [url, setUrl] = useState('');
  const [scanUnlocked, setScanUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // STRIPE TEST KEY (replace with your live key for production)
  const stripePublicKey = 'pk_test_...'; // Update this as needed
  const priceId = 'price_...'; // Update this as needed

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      if (typeof window !== 'undefined' && url) {
        localStorage.setItem('siteguard_last_url', url);
      }
      const stripeJs = await loadStripe(stripePublicKey);
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, url }),
      });
      const { sessionId } = await res.json();
      await stripeJs.redirectToCheckout({ sessionId });
    } catch (err: any) {
      setError('Payment error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async () => {
    setLoading(true);
    setError('');
    try {
      const html = `
        <html>
          <head><title>Audit Report</title></head>
          <body>
            <h1>Audit Report for ${url}</h1>
            <p>This is a placeholder PDF generated for: <strong>${url}</strong></p>
          </body>
        </html>
      `;
      const response = await fetch('https://siteguard-backend.onrender.com/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate audit');
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'audit-report.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  function loadStripe(pk: string) {
    return new Promise<any>((resolve, reject) => {
      if ((window as any).Stripe) {
        resolve((window as any).Stripe(pk));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => resolve((window as any).Stripe(pk));
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  if (typeof window !== 'undefined' && !scanUnlocked) {
    if (window.location.pathname === '/scan-success') {
      setScanUnlocked(true);
    }
  }

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <header className="flex flex-col items-center justify-center py-8 bg-black">
        <img
          src="/siteguard-shield-logo.png"
          alt="SITEGUARD Shield Logo"
          className="w-32 md:w-44 mb-4 drop-shadow-lg"
        />
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-widest uppercase text-center mb-2">
          Military-Grade Website Security & Compliance Scan
        </h1>
        <p className="text-gray-300 max-w-xl text-center text-lg mb-6">
          Instantly audit any website for vulnerabilities, malware, privacy risks, and compliance gaps.<br />
          One-time, full-spectrum risk scan. Branded PDF report included.
        </p>
      </header>

      <main className="flex flex-col items-center flex-1 justify-center px-4">
        <div className="w-full max-w-xl bg-gray-900/70 rounded-2xl shadow-xl p-8 flex flex-col items-center">
          {!scanUnlocked ? (
            <>
              <form
                className="w-full flex flex-col items-center gap-4"
                onSubmit={e => {
                  e.preventDefault();
                  handlePay();
                }}
              >
                <label htmlFor="url" className="sr-only">Website URL</label>
                <input
                  id="url"
                  type="text"
                  placeholder="Enter your website URL (e.g. https://example.com)"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full p-3 bg-white text-gray-900 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-base"
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !url}
                  className="w-full px-6 py-3 mt-2 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg uppercase tracking-wider transition disabled:opacity-50"
                >
                  {loading ? 'Redirecting to payment...' : 'Pay & Run Scan'}
                </button>
              </form>
              <div className="text-xs text-gray-400 mt-4 text-center">
                One-time payment. Instant PDF report. No subscription required.
              </div>
              {/* View Sample Report button */}
              <div className="w-full flex justify-center mt-6">
                <Link href="/sample-report">
                  <button className="px-6 py-2 bg-cyan-700 hover:bg-cyan-500 text-white font-semibold rounded-lg uppercase tracking-wide shadow transition">
                    View Sample Report
                  </button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <form
                className="w-full flex flex-col items-center gap-4"
                onSubmit={e => {
                  e.preventDefault();
                  handleAudit();
                }}
              >
                <label htmlFor="url" className="sr-only">Website URL</label>
                <input
                  id="url"
                  type="text"
                  placeholder="Enter your website URL (e.g. https://example.com)"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full p-3 bg-white text-gray-900 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-base"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading || !url}
                  className="w-full px-6 py-3 mt-2 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg uppercase tracking-wider transition disabled:opacity-50"
                >
                  {loading ? 'Scanning...' : 'Run Audit'}
                </button>
              </form>
            </>
          )}
          {error && <p className="text-red-500 mt-4">{error}</p>}

          <ul className="mt-8 mb-2 w-full grid sm:grid-cols-2 gap-x-8 gap-y-3 text-base">
            <li><span className="font-semibold text-cyan-400">Security headers</span> & HTTPS enforcement</li>
            <li><span className="font-semibold text-cyan-400">Malware/blacklist</span> (Google Safe Browsing)</li>
            <li><span className="font-semibold text-cyan-400">Performance, SEO, accessibility</span> scan</li>
            <li><span className="font-semibold text-cyan-400">Trackers & analytics</span> detection</li>
            <li><span className="font-semibold text-cyan-400">Sensitive file/config</span> exposure scan</li>
            <li><span className="font-semibold text-cyan-400">WHOIS/domain age & IP reputation</span></li>
            <li><span className="font-semibold text-cyan-400">Compliance & privacy banner</span> check</li>
            <li><span className="font-semibold text-cyan-400">Branded PDF</span> client-ready report</li>
          </ul>

          <div className="mt-6 text-gray-400 text-sm text-center max-w-lg">
            SiteGuard scans reference best practices from <b>NIST 800-53</b>, <b>CISA</b>, and <b>OWASP Top 10</b>.
          </div>

          <div className="text-center mt-6 text-gray-400 text-xs">
            <span>Trusted by organizations worldwide.</span>
          </div>

          {/* Badges for NIST, CISA, OWASP */}
          <div className="w-full flex justify-center mt-4">
            <div className="flex gap-4 items-center">
              <img
                src="/badges/nist.png"
                alt="NIST 800-53"
                className="h-10 w-auto object-contain"
                style={{ maxWidth: 80 }}
              />
              <img
                src="/badges/cisa.png"
                alt="CISA"
                className="h-10 w-auto object-contain"
                style={{ maxWidth: 80 }}
              />
              <img
                src="/badges/owasp.png"
                alt="OWASP Top 10"
                className="h-10 w-auto object-contain"
                style={{ maxWidth: 80 }}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 py-8 bg-black text-gray-500 text-sm text-center border-t border-gray-800">
  <div className="mb-1">
    <Link href="/terms" className="underline text-cyan-400 mr-4">Terms of Service</Link>
    <Link href="/privacy" className="underline text-cyan-400">Privacy Policy</Link>
  </div>
  <div>
    &copy; {new Date().getFullYear()} SITEGUARD.io — Military-Grade Website Auditing.<br />
    <span className="block mt-1">
      SiteGuard.io is a product of <span className="font-semibold">Anzen Digital Media LLC</span>.<br/>
      Need help? <a href="mailto:support@siteguard.io" className="text-cyan-400 underline">Contact Support</a>
    </span>
  </div>
</footer>
    </div>
  );
}






