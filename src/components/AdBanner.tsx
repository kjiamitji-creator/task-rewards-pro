import { useEffect, useRef } from 'react';
import type { SocialAd } from '@/hooks/useAds';

export function SocialAdBanner({ ads, page }: { ads: SocialAd[]; page: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageAds = ads.filter(ad => ad.page === page);

  useEffect(() => {
    if (!containerRef.current || pageAds.length === 0) return;
    // Re-execute scripts in ad code
    const scripts = containerRef.current.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [pageAds]);

  if (pageAds.length === 0) return null;

  return (
    <div ref={containerRef} className="space-y-3">
      {pageAds.map(ad => (
        <div
          key={ad.id}
          className="rounded-xl overflow-hidden border border-border bg-card"
          dangerouslySetInnerHTML={{ __html: ad.code }}
        />
      ))}
    </div>
  );
}
