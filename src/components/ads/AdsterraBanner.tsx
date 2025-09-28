'use client';

import { useEffect, useId } from 'react';

interface AdsterraBannerProps {
  placementKey: string;
  width: number;
  height: number;
  className?: string;
}

export default function AdsterraBanner({
  placementKey,
  width,
  height,
  className = '',
}: AdsterraBannerProps) {
  const autoId = useId().replace(/:/g, '_');
  const containerId = `adsterra-slot-${autoId}`;

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    container.innerHTML = '';

    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.innerHTML = `
      atOptions = {
        key: '${placementKey}',
        format: 'iframe',
        height: ${height},
        width: ${width},
        params: {}
      };
    `;

    const loaderScript = document.createElement('script');
    loaderScript.type = 'text/javascript';
    loaderScript.src = 
      placementKey === 'f518bfdff1cb8fbf49eb32474cb013ca'
        ? `//www.highperformanceformat.com/${placementKey}/invoke.js`
        : `//www.highperformanceformat.com/${placementKey}/invoke.js`;
    loaderScript.async = true;

    container.appendChild(optionsScript);
    container.appendChild(loaderScript);

    return () => {
      container.innerHTML = '';
    };
  }, [containerId, placementKey, width, height]);

  return <div id={containerId} className={className} />;
}
