import Link from 'next/link';

// Sample data mimicking a real scan
const SAMPLE_SCAN = {
  url: 'https://www.big-enterprise-demo.com',
  overallScore: 0.82,
  summary: {
    performance: 0.65,
    accessibility: 0.85,
    seo: 0.92,
    bestPractices: 0.86,
  },
  security: {
    hsts: false,
    sslValid: true,
    blacklisted: false,
    cookieBanner: false,
  },
  issues: [
    {
      id: 'hsts-missing',
      label: 'HSTS header missing',
      criticality: 'high',
      why: 'Without HTTP Strict Transport Security (HSTS), browsers may allow users to access your site over insecure HTTP.',
      fix: 'Add a Strict-Transport-Security header to your server response.',
    },
    {
      id: 'cookie-banner-missing',
      label: 'No cookie consent banner detected',
      criticality: 'medium',
      why: 'Sites handling personal data in the EU must inform users about cookies for privacy compliance.',
      fix: 'Add a cookie consent banner using a trusted library or service.',
    },
  ],
  passes: [
    {
      id: 'ssl-valid',
      label: 'SSL certificate is valid',
      why: 'Valid SSL/TLS certificate ensures secure encrypted connections.',
    },
    {
      id: 'blacklist-clear',
      label: 'Site is not blacklisted',
      why: 'Site is not flagged as dangerous or infected by Google Safe Browsing.',
    },
  ],
  // Demo Lighthouse-style failed audits for each category
  failedAudits: {
    performance: [
      {
        id: 'uses-long-cache-ttl',
        title: 'Serve static assets with an efficient cache policy',
        description: 'A long cache lifetime can speed up repeat visits to your page.',
        displayValue: '1 resource found',
      },
      {
        id: 'unused-javascript',
        title: 'Remove unused JavaScript',
        description: 'Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity.',
        displayValue: 'Potential savings of 60 KB',
      },
    ],
    accessibility: [
      {
        id: 'color-contrast',
        title: 'Background and foreground colors do not have a sufficient contrast ratio.',
        description: 'Low-contrast text is difficult or impossible for many users to read.',
        displayValue: '4 elements found',
      },
    ],
    seo: [],
    'best-practices': [
      {
        id: 'image-aspect-ratio',
        title: 'Displays images with incorrect aspect ratio',
        description: 'Image display is distorted if the aspect ratio in the page does not match the source.',
        displayValue: '1 image found',
      },
    ],
  },
};

function getGrade(score: number) {
  if (score >= 0.9) return { letter: 'A', color: 'bg-green-700' };
  if (score >= 0.75) return { letter: 'B', color: 'bg-yellow-500' };
  if (score >= 0.6) return { letter: 'C', color: 'bg-orange-500' };
  return { letter: 'D', color: 'bg-red-600' };
}

export default function SampleReport() {
  const scan = SAMPLE_SCAN;

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
        <h2 className="uppercase tracking-widest font-bold text-cyan-400 text-xs mb-3">Sample Scan Report</h2>
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

        {/* Demo Lighthouse failed audits */}
        <div className="w-full text-left mt-6">
          {categories.map(category => {
            const failed = scan.failedAudits[category.id];
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
                {issue.why}
              </div>
              <div className="text-gray-400 text-xs">
                <span className="font-bold">How to fix: </span>
                {issue.fix}
              </div>
            </div>
          ))}
        </div>

        <div className="w-full text-left mt-6">
          <h3 className="text-base font-bold text-green-400 mb-2">Passed / Good</h3>
          {scan.passes.map((pass: any) => (
            <div key={pass.id} className="mb-2">
              <div className="font-semibold text-green-300">{pass.label}</div>
              <div className="text-gray-400 text-xs">{pass.why}</div>
            </div>
          ))}
        </div>

        <div className="w-full flex justify-center mt-8">
          <Link href="/">
            <button className="px-6 py-2 bg-gray-800 hover:bg-cyan-700 text-white font-semibold rounded-lg uppercase tracking-wide shadow transition">
              Back to Homepage
            </button>
          </Link>
        </div>
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
