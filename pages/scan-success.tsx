import { useEffect, useState } from 'react';

function getGrade(score: number) {
  if (score >= 0.9) return { letter: 'A', color: 'bg-green-700' };
  if (score >= 0.75) return { letter: 'B', color: 'bg-yellow-500' };
  if (score >= 0.6) return { letter: 'C', color: 'bg-orange-500' };
  return { letter: 'D', color: 'bg-red-600' };
}

const EXPLANATIONS: Record<string, { why: string; fix: string }> = {
  'hsts-missing': {
    why: 'Without HTTP Strict Transport Security (HSTS), browsers may allow users to access your site over insecure HTTP.',
    fix: 'Add a Strict-Transport-Security header to your server response.',
  },
  'ssl-valid': {
    why: 'Valid SSL/TLS certificate ensures secure encrypted connections.',
    fix: 'No action needed.',
  },
  'cookie-banner-missing': {
    why: 'Sites handling personal data in the EU must inform users about cookies for GDPR compliance.',
    fix: 'Add a cookie consent banner using a trusted library or service.',
  },
  'blacklist-clear': {
    why: 'Not blacklisted: No malware/phishing found by Google Safe Browsing.',
    fix: 'No action needed.',
  },
};

export default function ScanSuccess() {
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to get the URL from the query string first, then from localStorage
    let url: string | null = null;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      url = params.get('url');
      if (!url) {
        url = localStorage.getItem('siteguard_last_url');
      }
    }

    if (!url) {
      setError('No URL found for scan.');
      setLoading(false);
      return;
    }

    fetch('https://siteguard-backend.onrender.com/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setScan({
            url,
            overallScore: (
              (data.summary.performance +
                data.summary.accessibility +
                data.summary.seo +
                data.summary.bestPractices) /
              4
            ),
            summary: data.summary,
            security: {
              hsts: !!(data.security.headers && data.security.headers['strict-transport-security']),
              sslValid:
                !!(
                  data.security.https &&
                  data.security.https.ssl &&
                  data.security.https.ssl.valid
                ),
              blacklisted: data.security.safeBrowsing && data.security.safeBrowsing.safe === false,
              cookieBanner: data.security.trackersAndCookies && data.security.trackersAndCookies.cookieBanner,
            },
            issues: [
              !(
                data.security.headers &&
                data.security.headers['strict-transport-security']
              ) && {
                id: 'hsts-missing',
                label: 'HSTS header missing',
                criticality: 'high',
              },
              data.security.trackersAndCookies &&
                !data.security.trackersAndCookies.cookieBanner && {
                  id: 'cookie-banner-missing',
                  label: 'No cookie consent banner detected',
                  criticality: 'medium',
                },
              data.security.safeBrowsing && data.security.safeBrowsing.safe === false && {
                id: 'blacklist-listed',
                label: 'Site is blacklisted for malware or phishing',
                criticality: 'high',
              },
            ].filter(Boolean),
            passes: [
              data.security.https &&
                data.security.https.ssl &&
                data.security.https.ssl.valid && {
                  id: 'ssl-valid',
                  label: 'SSL certificate is valid',
                },
              data.security.safeBrowsing && data.security.safeBrowsing.safe === true && {
                id: 'blacklist-clear',
                label: 'Site is not blacklisted',
              },
            ].filter(Boolean),
            pdfLink: '/sample-siteguard-report.pdf', // Update this when generating real PDFs
          });
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Error fetching scan results.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div>Loading scan results...</div>
      </div>
    );
  }
  if (error || !scan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-red-400">
        {error || 'Unknown error.'}
      </div>
    );
  }

  const { letter, color } = getGrade(scan.overallScore);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center px-4 py-8">
      <img
        src="/siteguard-shield-logo.png"
        alt="SITEGUARD Shield Logo"
        className="w-32 md:w-44 mb-5 drop-shadow-lg"
      />

      <div className="w-full max-w-2xl bg-gray-900/90 rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <h2 className="uppercase tracking-widest font-bold text-cyan-400 text-xs mb-3">Scan Results</h2>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-widest text-center mb-2">
          {scan.url}
        </h1>

        <div className="flex items-center justify-center gap-4 my-4">
          <div className={`rounded-full w-16 h-16 flex flex-col items-center justify-center text-3xl font-bold text-white shadow-xl border-4 border-cyan-400 ${color}`}>
            {letter}
          </div>
          <div className="text-left">
            <div className="text-lg font-bold">
              Overall Risk: <span className="text-cyan-400">{letter}</span>
            </div>
            <div className="text-gray-400 text-sm">
              (Score: {(scan.overallScore * 100).toFixed(0)}/100)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 mt-4 w-full">
          {Object.entries(scan.summary).map(([cat, score]: any) => {
            const { letter, color } = getGrade(score);
            return (
              <div key={cat} className="flex flex-col items-center p-3 rounded-lg bg-gray-800/70">
                <span className="text-xs text-gray-400 uppercase">{cat}</span>
                <span className={`font-bold text-lg text-white`}>{letter}</span>
                <span className="text-cyan-400 font-bold">{(score * 100).toFixed(0)}/100</span>
              </div>
            );
          })}
        </div>

        <div className="w-full text-left mb-3">
          <h3 className="text-base font-bold text-red-400 mb-2">Critical Issues</h3>
          {scan.issues.length === 0 && (
            <div className="text-green-400 mb-2">No critical issues detected.</div>
          )}
          {scan.issues.map((issue: any) => (
            <div key={issue.id} className="mb-4">
              <div className="font-semibold text-red-300">{issue.label}</div>
              <div className="text-gray-300 text-xs">
                <span className="font-bold">Why this matters: </span>
                {EXPLANATIONS[issue.id]?.why || 'See documentation.'}
              </div>
              <div className="text-gray-400 text-xs">
                <span className="font-bold">How to fix: </span>
                {EXPLANATIONS[issue.id]?.fix || 'See documentation.'}
              </div>
            </div>
          ))}
        </div>

        <div className="w-full text-left mt-6">
          <h3 className="text-base font-bold text-green-400 mb-2">Passed / Good</h3>
          {scan.passes.map((pass: any) => (
            <div key={pass.id} className="mb-2">
              <div className="font-semibold text-green-300">{pass.label}</div>
              <div className="text-gray-400 text-xs">{EXPLANATIONS[pass.id]?.why}</div>
            </div>
          ))}
        </div>

        <a
          href={scan.pdfLink}
          target="_blank"
          rel="noopener"
          className="mt-8 px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg uppercase tracking-wider transition text-lg shadow-md"
        >
          Download PDF Report
        </a>
      </div>

      <div className="mt-6 text-gray-400 text-sm text-center max-w-lg">
        SiteGuard scans reference best practices from <b>NIST 800-53</b>, <b>CISA</b>, and <b>OWASP Top 10</b>.
      </div>

      <footer className="mt-12 py-8 w-full max-w-4xl bg-black text-gray-500 text-sm text-center border-t border-gray-800">
        &copy; {new Date().getFullYear()} SITEGUARD.io &mdash; Military-Grade Website Auditing.
      </footer>
    </div>
  );
}
