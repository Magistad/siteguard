import { useEffect, useState } from 'react';

// Explanations for custom security issues
const SECURITY_EXPLANATIONS: Record<string, { why: string; fix: string }> = {
  'hsts-missing': {
    why: 'Without HTTP Strict Transport Security (HSTS), browsers may allow users to access your site over insecure HTTP.',
    fix: 'Add a Strict-Transport-Security header to your server response (e.g., `Strict-Transport-Security: max-age=31536000; includeSubDomains`).',
  },
  'cookie-banner-missing': {
    why: 'Sites handling personal data in the EU (and other regions) must inform users about cookies for privacy compliance.',
    fix: 'Add a cookie consent banner using a trusted library or service (e.g., Cookiebot, CookieYes).',
  },
  'blacklist-listed': {
    why: 'Your site is flagged by Google Safe Browsing as potentially malicious or infected with malware/phishing.',
    fix: 'Check your site with the Google Safe Browsing Transparency Report and clean any infections before requesting removal.',
  },
  'ssl-valid': {
    why: 'A valid SSL/TLS certificate ensures all traffic to your site is securely encrypted.',
    fix: 'No action needed.',
  },
  'blacklist-clear': {
    why: 'Your site is not flagged as dangerous or infected by Google Safe Browsing.',
    fix: 'No action needed.',
  },
};

function getGrade(score: number) {
  if (score >= 0.9) return { letter: 'A', color: 'bg-green-700' };
  if (score >= 0.75) return { letter: 'B', color: 'bg-yellow-500' };
  if (score >= 0.6) return { letter: 'C', color: 'bg-orange-500' };
  return { letter: 'D', color: 'bg-red-600' };
}

// Extract failed audits per category
function getFailedAudits(category: string, data: any) {
  if (!data || !data.fullReport || !data.fullReport.categories) return [];
  const cat = data.fullReport.categories[category];
  if (!cat || !cat.auditRefs) return [];
  const audits = [];
  for (const ref of cat.auditRefs) {
    if (ref.weight > 0) {
      const audit = data.fullReport.audits[ref.id];
      if (audit && audit.score !== 1) {
        audits.push({
          id: ref.id,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          displayValue: audit.displayValue,
          details: audit.details,
        });
      }
    }
  }
  return audits;
}

export default function ScanSuccess() {
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
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

    fetch('http://localhost:3001/scan', {
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
            scanData: data, // Keep the raw scan data for audits
          });
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Error fetching scan results.');
        setLoading(false);
      });
  }, []);

  async function handleDownloadPdf() {
    if (!scan) return;
    setDownloading(true);

    // Build HTML for all categories and security issues
    const categories = [
      { id: 'performance', name: 'Performance' },
      { id: 'accessibility', name: 'Accessibility' },
      { id: 'seo', name: 'SEO' },
      { id: 'best-practices', name: 'Best Practices' },
    ];

    let html = `
      <div><b>URL:</b> ${scan.url}</div>
      <div style="font-size:1.5rem;"><b>Overall Grade:</b> ${getGrade(scan.overallScore).letter} (${(scan.overallScore*100).toFixed(0)}/100)</div>
      <h2>Category Scores</h2>
      <ul>
        ${Object.entries(scan.summary).map(([cat, score]: any) =>
          `<li><b>${cat.charAt(0).toUpperCase() + cat.slice(1)}:</b> ${getGrade(score).letter} (${(score*100).toFixed(0)}/100)</li>`
        ).join('')}
      </ul>
    `;

    for (const category of categories) {
      const failed = getFailedAudits(category.id, scan.scanData);
      html += `
        <h3 style="color:#0369a1">${category.name} Issues</h3>
        ${failed.length === 0 ? `<div style="color:green;">No major issues detected in ${category.name}.</div>` :
        `<ul>` + failed.slice(0, 8).map((audit: any) =>
          `<li>
            <b>${audit.title}</b><br/>
            <span>${audit.description || ''}</span><br/>
            ${audit.displayValue ? `<span style="color:#d97706">${audit.displayValue}</span><br/>` : ''}
          </li>`
        ).join('') + `</ul>`
        }
      `;
    }

    // Security issues
    html += `
      <h2 style="color:#b91c1c">Critical Security/Compliance Issues</h2>
      <ul>
      ${
        scan.issues.length === 0 ? '<li>None</li>' :
        scan.issues.map((issue: any) =>
          `<li>
            <b>${issue.label}</b><br/>
            <b>Why this matters:</b> ${SECURITY_EXPLANATIONS[issue.id]?.why || ''}
            <br/><b>How to fix:</b> ${SECURITY_EXPLANATIONS[issue.id]?.fix || ''}
          </li>`
        ).join('')
      }
      </ul>
      <h2 style="color:#15803d">Passed / Good</h2>
      <ul>
        ${
          scan.passes.map((pass: any) =>
            `<li><b>${pass.label}</b>${SECURITY_EXPLANATIONS[pass.id]?.why ? '<br/>' + SECURITY_EXPLANATIONS[pass.id].why : ''}</li>`
          ).join('')
        }
      </ul>
    `;

    html += `
      <hr/>
      <div><b>Scan performed by SiteGuard.io</b></div>
      <div>References: NIST 800-53, CISA, OWASP Top 10</div>
    `;

    try {
      const response = await fetch('http://localhost:3001/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      if (!response.ok) throw new Error('PDF generation failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `siteguard-scan-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e: any) {
      alert('PDF generation failed: ' + e.message);
    }
    setDownloading(false);
  }

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

  const categories = [
    { id: 'performance', name: 'Performance' },
    { id: 'accessibility', name: 'Accessibility' },
    { id: 'seo', name: 'SEO' },
    { id: 'best-practices', name: 'Best Practices' },
  ];

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

        {/* Lighthouse failed audits */}
        <div className="w-full text-left mt-6">
          {categories.map(category => {
            const failed = getFailedAudits(category.id, scan.scanData);
            return (
              <div key={category.id} className="mb-6">
                <h3 className="font-bold text-cyan-400 mb-1">{category.name} Issues</h3>
                {failed.length === 0 ? (
                  <div className="text-green-400 mb-2">No major issues detected in {category.name}.</div>
                ) : (
                  <ul>
                    {failed.slice(0, 5).map((audit: any) => (
                      <li key={audit.id} className="mb-2">
                        <span className="font-semibold text-red-300">{audit.title}</span>
                        <div className="text-gray-300 text-xs">{audit.description}</div>
                        {audit.displayValue && <div className="text-yellow-300 text-xs">{audit.displayValue}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Security issues */}
        <div className="w-full text-left mb-3">
          <h3 className="text-base font-bold text-red-400 mb-2">Critical Security/Compliance Issues</h3>
          {scan.issues.length === 0 && (
            <div className="text-green-400 mb-2">No critical issues detected.</div>
          )}
          {scan.issues.map((issue: any) => (
            <div key={issue.id} className="mb-4">
              <div className="font-semibold text-red-300">{issue.label}</div>
              <div className="text-gray-300 text-xs">
                <span className="font-bold">Why this matters: </span>
                {SECURITY_EXPLANATIONS[issue.id]?.why || ''}
              </div>
              <div className="text-gray-400 text-xs">
                <span className="font-bold">How to fix: </span>
                {SECURITY_EXPLANATIONS[issue.id]?.fix || ''}
              </div>
            </div>
          ))}
        </div>

        <div className="w-full text-left mt-6">
          <h3 className="text-base font-bold text-green-400 mb-2">Passed / Good</h3>
          {scan.passes.map((pass: any) => (
            <div key={pass.id} className="mb-2">
              <div className="font-semibold text-green-300">{pass.label}</div>
              <div className="text-gray-400 text-xs">{SECURITY_EXPLANATIONS[pass.id]?.why || ''}</div>
            </div>
          ))}
        </div>

        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="mt-8 px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg uppercase tracking-wider transition text-lg shadow-md disabled:opacity-50"
        >
          {downloading ? "Generating PDF..." : "Download PDF Report"}
        </button>
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

