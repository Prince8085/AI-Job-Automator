import React, { useEffect, useRef, useState } from 'react';

interface ApiLogItem {
  method: string;
  url: string;
  status?: number;
  time: string;
  bodySnippet?: string;
}

const DemoOverlay: React.FC = () => {
  const [logs, setLogs] = useState<ApiLogItem[]>([]);
  const [visible, setVisible] = useState(true);
  const [bannerText, setBannerText] = useState<string>('Project Walkthrough');
  const [showBanner, setShowBanner] = useState<boolean>(true);
  const originalFetchRef = useRef<typeof fetch | null>(null);

  useEffect(() => {
    // Intro banner for 3 seconds
    setShowBanner(true);
    const t = setTimeout(() => setShowBanner(false), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Click highlight ripple
    const handleClick = (e: MouseEvent) => {
      const ripple = document.createElement('div');
      ripple.style.position = 'fixed';
      ripple.style.left = `${e.clientX - 15}px`;
      ripple.style.top = `${e.clientY - 15}px`;
      ripple.style.width = '30px';
      ripple.style.height = '30px';
      ripple.style.borderRadius = '50%';
      ripple.style.border = '2px solid #DAA520';
      ripple.style.boxShadow = '0 0 10px #DAA520';
      ripple.style.opacity = '0.9';
      ripple.style.pointerEvents = 'none';
      ripple.style.zIndex = '999999';
      ripple.style.transition = 'transform 0.6s ease, opacity 0.6s ease';
      document.body.appendChild(ripple);
      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(2)';
        ripple.style.opacity = '0';
      });
      setTimeout(() => ripple.remove(), 600);
    };
    window.addEventListener('click', handleClick, true);
    return () => window.removeEventListener('click', handleClick, true);
  }, []);

  useEffect(() => {
    // API logging via fetch monkey patch
    if (originalFetchRef.current) return; // only once
    originalFetchRef.current = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method || 'GET';
      const url = typeof input === 'string' ? input : (input as URL).toString();
      const time = new Date().toLocaleTimeString();
      setLogs(prev => [{ method, url, time }, ...prev].slice(0, 50));
      try {
        const res = await originalFetchRef.current!(input, init);
        const status = res.status;
        let bodySnippet = '';
        try {
          const cloned = res.clone();
          const text = await cloned.text();
          bodySnippet = text.slice(0, 200);
        } catch {}
        setLogs(prev => [{ method, url, status, time, bodySnippet }, ...prev].slice(0, 50));
        return res;
      } catch (err) {
        setLogs(prev => [{ method, url, status: -1, time }, ...prev].slice(0, 50));
        throw err;
      }
    };
    return () => {
      if (originalFetchRef.current) {
        window.fetch = originalFetchRef.current;
      }
    };
  }, []);

  useEffect(() => {
    // Update banner text based on route
    const updateBanner = () => {
      const hash = window.location.hash.replace('#', '') || '/';
      const name = hash.split('?')[0];
      setBannerText(name === '/' ? 'Welcome' : name.replace('/', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 2000);
    };
    window.addEventListener('hashchange', updateBanner);
    updateBanner();
    return () => window.removeEventListener('hashchange', updateBanner);
  }, []);

  const panelStyles: React.CSSProperties = {
    position: 'fixed',
    right: 16,
    bottom: 16,
    width: 420,
    maxHeight: '40vh',
    background: 'rgba(0,0,0,0.85)',
    color: '#FFD700',
    border: '1px solid #DAA520',
    borderRadius: 12,
    padding: 12,
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI',
    zIndex: 999998,
    boxShadow: '0 0 20px rgba(218,165,32,0.3)'
  };

  const bannerStyles: React.CSSProperties = {
    position: 'fixed',
    top: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#000',
    color: '#FFD700',
    padding: '12px 24px',
    borderRadius: 10,
    border: '1px solid #DAA520',
    boxShadow: '0 0 20px rgba(218,165,32,0.4)',
    zIndex: 999999,
    fontSize: 20,
    fontWeight: 700
  };

  return (
    <>
      {showBanner && (
        <div style={bannerStyles}>
          {bannerText || 'Project Walkthrough'}
        </div>
      )}
      {visible && (
        <div style={panelStyles}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontWeight: 700 }}>API Activity</div>
            <button onClick={() => setVisible(false)} style={{ color: '#000', background: '#FFD700', borderRadius: 8, padding: '4px 10px', fontWeight: 700 }}>Hide</button>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '28vh' }}>
            {logs.length === 0 ? (
              <div style={{ color: '#C2A200' }}>No API calls yet</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} style={{ padding: '6px 0', borderBottom: '1px dashed #333' }}>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: '#C2A200' }}>{log.time}</span> — <span>{log.method}</span> <span style={{ color: '#9ACD32' }}>{log.status ?? ''}</span>
                  </div>
                  <div style={{ fontSize: 12, wordBreak: 'break-all' }}>{log.url}</div>
                  {log.bodySnippet && <div style={{ fontSize: 11, color: '#BDB76B' }}>{log.bodySnippet}</div>}
                </div>
              ))
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => setLogs([])} style={{ color: '#000', background: '#FFD700', borderRadius: 8, padding: '4px 10px', fontWeight: 700 }}>Clear</button>
            <button onClick={() => setVisible(false)} style={{ color: '#FFD700', border: '1px solid #DAA520', borderRadius: 8, padding: '4px 10px', fontWeight: 700 }}>Minimize</button>
          </div>
        </div>
      )}
      {!visible && (
        <button onClick={() => setVisible(true)} style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 999999, background: '#000', color: '#FFD700', border: '1px solid #DAA520', borderRadius: 999, padding: '10px 14px', boxShadow: '0 0 12px rgba(218,165,32,0.4)' }}>Show API Panel</button>
      )}
      {/* Outro banner trigger via localStorage flag */}
      {localStorage.getItem('demo_outro') === '1' && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 24, display: 'flex', justifyContent: 'center', zIndex: 999999 }}>
          <div style={{ background: '#000', color: '#FFD700', padding: '12px 24px', borderRadius: 10, border: '1px solid #DAA520', boxShadow: '0 0 20px rgba(218,165,32,0.4)', fontSize: 18, fontWeight: 700 }}>Created by Innovix Solutions</div>
        </div>
      )}
    </>
  );
};

export default DemoOverlay;