import { useState } from 'react';

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
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f1f2f] via-black to-[#000000] opacity-90 z-0" />

      {/* Logo Only */}
      <img
        src="/siteguard-logo-transparent.png"
        alt="SiteGuard Logo"
        className="z-10 w-64 sm:w-80 md:w-96 drop-shadow-xl mb-8"
      />

      {/* Input + CTA */}
      <div className="z-10 mt-4 flex flex-col sm:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Enter your website URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="p-2 border rounded w-full max-w-md text-black"
        />
        <button
          onClick={handleAudit}
          disabled={loading}
          className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded shadow uppercase tracking-wide disabled:opacity-50"
        >
          {loading ? 'Scanning...' : 'Run Audit'}
        </button>
      </div>

      {/* Error message */}
      {error && <p className="z-10 text-red-500 mt-4">{error}</p>}
    </main>
  );
}
