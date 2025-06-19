import { useState } from 'react';

const logos = [
  { src: "/logos/boeing.png", alt: "Boeing" },
  { src: "/logos/general-dynamics.png", alt: "General Dynamics" },
  { src: "/logos/lockheed-martin.png", alt: "Lockheed Martin" },
  { src: "/logos/northrop-grumman.png", alt: "Northrop Grumman" },
  { src: "/logos/raytheon.png", alt: "Raytheon" },
  { src: "/logos/charles-schwab.png", alt: "Charles Schwab" },
];

// Duplicate logos for seamless ticker animation
const scrollingLogos = [...logos, ...logos, ...logos];

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="bg-black text-white min-h-screen">
      <main className="flex flex-col items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-xl mb-4 flex flex-col items-center">
          <p className="text-xs text-gray-400 mb-2 text-center tracking-wide">
            Proudly scanning:
          </p>
          <div className="relative w-full overflow-x-hidden">
            <div className="ticker-track flex items-center space-x-8">
              {scrollingLogos.map((logo, idx) => (
                <img
                  key={logo.alt + idx}
                  src={logo.src}
                  alt={logo.alt}
                  className="h-8 md:h-10 object-contain grayscale hover:grayscale-0 transition-all"
                />
              ))}
            </div>
          </div>
        </div>
        <div className="w-full max-w-md flex flex-col gap-6 items-center">
          <img
            src="/siteguard-emblem.png"
            alt="SiteGuard Emblem"
            className="w-40 sm:w-48 md:w-64 mb-8"
          />
          {/* PDF Report Blurb */}
          <p className="text-xs sm:text-sm text-gray-300 mb-2 text-center max-w-md">
            Every scan delivers a full-spectrum, branded PDF report you can share with clients, forward to developers, or keep for your own digital command log.
          </p>
          <input
            type="text"
            placeholder="Enter your website URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full p-3 bg-white text-gray-900 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            onClick={handleAudit}
            disabled={loading}
            className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded uppercase tracking-wide disabled:opacity-50"
          >
            {loading ? 'Scanning...' : 'Run Audit'}
          </button>
        </div>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </main>

      <section className="bg-black text-white px-6 py-16 text-center border-t border-gray-800">
        {/* Removed the <h2> headline here */}
        <p className="max-w-2xl mx-auto text-lg text-gray-300 mb-10">
          Modeled after real-world cyber defense systems, SiteGuard audits your website using AI to identify and diagnose vulnerabilities, performance bottlenecks, SEO issues, and compliance risks—just like infrastructure-grade threat assessment platforms.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-left max-w-4xl mx-auto text-gray-200 text-base sm:text-lg">
          <div>✅ Security vulnerabilities & open port exposure</div>
          <div>✅ Privacy compliance (GDPR, trackers, cookie notices)</div>
          <div>✅ Performance optimization (speed, Core Web Vitals)</div>
          <div>✅ SEO integrity (meta tags, schema, indexing signals)</div>
          <div>✅ Accessibility compliance (WCAG audit)</div>
          <div>✅ Mobile responsiveness & device readiness</div>
          <div>✅ Blacklist & malware check (safe browsing status)</div>
        </div>

        
      </section>
      <style jsx global>{`
        .ticker-track {
          width: 200%;
          animation: ticker 5s linear infinite;
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}



