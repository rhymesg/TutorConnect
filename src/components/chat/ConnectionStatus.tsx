'use client';

import { useState, useEffect, useMemo } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle, Smartphone, Battery } from 'lucide-react';
import type { ConnectionStatus as ConnectionStatusType } from '@/lib/realtime';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  isVisible: boolean;
  className?: string;
  showNetworkInfo?: boolean;
  onRetry?: () => void;
}

interface NetworkInfo {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export default function ConnectionStatus({
  status,
  isVisible,
  className = '',
  showNetworkInfo = false,
  onRetry,
}: ConnectionStatusProps) {
  const { language } = useLanguage();
  const translate = useLanguageText();
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isLowPower, setIsLowPower] = useState(false);

  const labels = useMemo(() => ({
    connected: translate('Tilkoblet', 'Connected'),
    connecting: translate('Kobler til...', 'Connecting...'),
    reconnecting: translate('Kobler til på nytt...', 'Reconnecting...'),
    disconnected: translate('Frakoblet', 'Disconnected'),
    error: translate('Tilkoblingsfeil', 'Connection error'),
    retry: translate('Prøv igjen', 'Retry'),
    dataSaver: translate('Datasparer', 'Data Saver'),
    lowPower: translate('Lav batteri', 'Low power'),
    slowNetwork: translate('Du er på et tregt nettverk. Meldinger kan ta lenger tid å sende.', 'You are on a slow network. Messages may take longer to send.'),
    lowPowerHint: translate('Lav batterimodus er aktivert. Real-time oppdateringer kan være redusert.', 'Low power mode is active. Real-time updates may be reduced.'),
    checkConnection: translate('Sjekk internettforbindelsen din. Dette kan skje i områder med dårlig dekning.', 'Check your internet connection. This can happen in areas with weak coverage.'),
  }), [translate]);

  useEffect(() => {
    if (!showNetworkInfo || typeof navigator === 'undefined') {
      return;
    }

    const updateNetworkInfo = () => {
      // @ts-ignore
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!connection) {
        return;
      }

      setNetworkInfo({
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false,
      });
    };

    updateNetworkInfo();

    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
      return () => connection.removeEventListener('change', updateNetworkInfo);
    }
  }, [showNetworkInfo]);

  useEffect(() => {
    if (!showNetworkInfo || typeof navigator === 'undefined') {
      return;
    }

    const updateBatteryInfo = async () => {
      try {
        // @ts-ignore
        const battery = await navigator.getBattery?.();
        if (!battery) {
          return;
        }

        const updateLevel = () => {
          setBatteryLevel(Math.round(battery.level * 100));
          setIsLowPower(battery.level < 0.2);
        };

        updateLevel();
        battery.addEventListener('levelchange', updateLevel);
        battery.addEventListener('chargingchange', updateLevel);

        return () => {
          battery.removeEventListener('levelchange', updateLevel);
          battery.removeEventListener('chargingchange', updateLevel);
        };
      } catch (error) {
        // Battery API unsupported
      }
    };

    updateBatteryInfo();
  }, [showNetworkInfo]);

  if (!isVisible) {
    return null;
  }

  const statusInfo = (() => {
    switch (status) {
      case 'connected':
        return { icon: <Wifi className="h-4 w-4 text-green-600" />, text: labels.connected, bg: 'bg-green-50', textColor: 'text-green-700', border: 'border-green-200' };
      case 'connecting':
        return { icon: <Wifi className="h-4 w-4 text-blue-600 animate-pulse" />, text: labels.connecting, bg: 'bg-blue-50', textColor: 'text-blue-700', border: 'border-blue-200' };
      case 'reconnecting':
        return { icon: <WifiOff className="h-4 w-4 text-orange-600 animate-bounce" />, text: labels.reconnecting, bg: 'bg-orange-50', textColor: 'text-orange-700', border: 'border-orange-200' };
      case 'disconnected':
        return { icon: <WifiOff className="h-4 w-4 text-gray-600" />, text: labels.disconnected, bg: 'bg-gray-50', textColor: 'text-gray-700', border: 'border-gray-200' };
      case 'error':
      default:
        return { icon: <AlertTriangle className="h-4 w-4 text-red-600" />, text: labels.error, bg: 'bg-red-50', textColor: 'text-red-700', border: 'border-red-200' };
    }
  })();

  const getNetworkTypeText = (type: string) => {
    switch (type) {
      case '4g':
      case '3g':
      case '2g':
        return type.toUpperCase();
      case 'slow-2g':
        return translate('Treg 2G', 'Slow 2G');
      default:
        return translate('Ukjent', 'Unknown');
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-600';
    if (level > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`${statusInfo.bg} ${statusInfo.border} border-b transition-all duration-300 ${className}`}>
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {statusInfo.icon}
            <span className={`text-sm font-medium ${statusInfo.textColor}`}>{statusInfo.text}</span>
          </div>

          <div className="flex items-center gap-3">
            {showNetworkInfo && networkInfo && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Smartphone className="h-3 w-3 text-gray-500" />
                <span>
                  {getNetworkTypeText(networkInfo.effectiveType)}
                  {networkInfo.effectiveType !== 'unknown' && (
                    <span className="ml-1">({Math.round(networkInfo.downlink)} Mbps)</span>
                  )}
                </span>
                {networkInfo.saveData && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                    {labels.dataSaver}
                  </span>
                )}
              </div>
            )}

            {showNetworkInfo && batteryLevel !== null && (
              <div className="flex items-center gap-1 text-xs">
                <Battery className={`h-3 w-3 ${getBatteryColor(batteryLevel)}`} />
                <span className={getBatteryColor(batteryLevel)}>{batteryLevel}%</span>
                {isLowPower && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded ml-1">
                    {labels.lowPower}
                  </span>
                )}
              </div>
            )}

            {(status === 'error' || status === 'disconnected') && onRetry && (
              <button
                onClick={onRetry}
                className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {labels.retry}
              </button>
            )}
          </div>
        </div>

        {status === 'error' && (
          <div className="mt-2 text-xs text-gray-600">
            {labels.checkConnection}
          </div>
        )}

        {showNetworkInfo && networkInfo?.effectiveType === '2g' && (
          <div className="mt-2 text-xs text-orange-600 bg-orange-100 p-2 rounded">
            {labels.slowNetwork}
          </div>
        )}

        {isLowPower && showNetworkInfo && (
          <div className="mt-2 text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
            {labels.lowPowerHint}
          </div>
        )}
      </div>
    </div>
  );
}
