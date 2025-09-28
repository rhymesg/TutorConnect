'use client';

import { useEffect, useId } from 'react';

import { adPlacementConfig, adPlacementIds, AdPlacementId } from '@/constants/adPlacements';

const AD_SCRIPT_HOST = '//www.highperformanceformat.com';

interface AdsterraBannerProps {
  placement?: AdPlacementId;
  className?: string;
}

export function getAdPlacementConfig(placement: AdPlacementId) {
  const config = adPlacementConfig[placement];

  if (!config) {
    console.error('[AdsterraBanner] Unknown placement provided:', placement);
    return null;
  }

  return config;
}

export default function AdsterraBanner({ placement = adPlacementIds.horizontal728x90, className = '' }: AdsterraBannerProps) {
  const config = getAdPlacementConfig(placement);

  if (!config) {
    return null;
  }

  const { key: placementKey, width, height } = config;
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
    loaderScript.src = `${AD_SCRIPT_HOST}/${placementKey}/invoke.js`;
    loaderScript.async = true;

    container.appendChild(optionsScript);
    container.appendChild(loaderScript);

    return () => {
      container.innerHTML = '';
    };
  }, [containerId, placementKey, width, height]);

  return <div id={containerId} className={className} />;
}
