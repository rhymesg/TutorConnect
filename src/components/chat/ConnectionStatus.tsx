'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle, Smartphone, Battery } from 'lucide-react';
import type { ConnectionStatus as ConnectionStatusType } from '@/lib/realtime';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  isVisible: boolean;
  language: 'no' | 'en';
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

/**
 * Connection Status component optimized for Norwegian mobile networks
 * Shows real-time connection status with mobile-specific optimizations
 */
export default function ConnectionStatus({
  status,
  isVisible,
  language,
  className = '',
  showNetworkInfo = false,
  onRetry,
}: ConnectionStatusProps) {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isLowPower, setIsLowPower] = useState(false);

  // Get network information (Norwegian mobile network specific)
  useEffect(() => {
    if (!showNetworkInfo || typeof navigator === 'undefined') return;

    const updateNetworkInfo = () => {
      // @ts-ignore - NetworkInformation API
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        setNetworkInfo({
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false,
        });
      }
    };

    updateNetworkInfo();
    
    // Listen for network changes
    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
      return () => connection.removeEventListener('change', updateNetworkInfo);
    }
  }, [showNetworkInfo]);

  // Get battery information for mobile optimization
  useEffect(() => {
    if (!showNetworkInfo || typeof navigator === 'undefined') return;

    const updateBatteryInfo = async () => {
      try {
        // @ts-ignore - Battery API
        const battery = await navigator.getBattery?.();
        if (battery) {
          const updateLevel = () => {
            setBatteryLevel(Math.round(battery.level * 100));
            setIsLowPower(battery.level < 0.2); // Low power mode at 20%
          };

          updateLevel();
          battery.addEventListener('levelchange', updateLevel);
          battery.addEventListener('chargingchange', updateLevel);
          
          return () => {
            battery.removeEventListener('levelchange', updateLevel);
            battery.removeEventListener('chargingchange', updateLevel);
          };
        }
      } catch (error) {
        // Battery API not supported
      }
    };

    updateBatteryInfo();
  }, [showNetworkInfo]);

  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="h-4 w-4 text-green-600" />,
          text: language === 'no' ? 'Tilkoblet' : 'Connected',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
        };
      case 'connecting':
        return {
          icon: <Wifi className="h-4 w-4 text-blue-600 animate-pulse" />,
          text: language === 'no' ? 'Kobler til...' : 'Connecting...',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
        };
      case 'reconnecting':
        return {
          icon: <WifiOff className="h-4 w-4 text-orange-600 animate-bounce" />,
          text: language === 'no' ? 'Kobler til på nytt...' : 'Reconnecting...',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-200',
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4 text-gray-600" />,
          text: language === 'no' ? 'Frakoblet' : 'Disconnected',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
        };
      case 'error':
        return {
          icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
          text: language === 'no' ? 'Tilkoblingsfeil' : 'Connection Error',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
        };
    }
  };

  const getNetworkTypeText = (type: string) => {
    switch (type) {
      case '4g':
        return '4G';
      case '3g':
        return '3G';
      case '2g':
        return '2G';
      case 'slow-2g':
        return language === 'no' ? 'Treg 2G' : 'Slow 2G';
      default:
        return language === 'no' ? 'Ukjent' : 'Unknown';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-600';
    if (level > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isVisible) return null;

  const statusInfo = getStatusInfo();

  return (
    <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-b transition-all duration-300 ${className}`}>
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Main status */}
          <div className="flex items-center gap-2">
            {statusInfo.icon}
            <span className={`text-sm font-medium ${statusInfo.textColor}`}>
              {statusInfo.text}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Network info for Norwegian mobile networks */}
            {showNetworkInfo && networkInfo && (
              <div className="flex items-center gap-2 text-xs">
                <Smartphone className="h-3 w-3 text-gray-500" />
                <span className="text-gray-600">
                  {getNetworkTypeText(networkInfo.effectiveType)}
                  {networkInfo.effectiveType !== 'unknown' && (
                    <span className="ml-1">
                      ({Math.round(networkInfo.downlink)} Mbps)
                    </span>
                  )}
                </span>
                
                {/* Norwegian data saver indicator */}
                {networkInfo.saveData && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                    {language === 'no' ? 'Datasparer' : 'Data Saver'}
                  </span>
                )}
              </div>
            )}

            {/* Battery level for mobile optimization */}
            {batteryLevel !== null && showNetworkInfo && (
              <div className="flex items-center gap-1 text-xs">
                <Battery className={`h-3 w-3 ${getBatteryColor(batteryLevel)}`} />
                <span className={`${getBatteryColor(batteryLevel)}`}>
                  {batteryLevel}%
                </span>
                {isLowPower && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded ml-1">
                    {language === 'no' ? 'Lav batteri' : 'Low Power'}
                  </span>
                )}
              </div>
            )}

            {/* Retry button */}
            {(status === 'error' || status === 'disconnected') && onRetry && (
              <button
                onClick={onRetry}
                className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {language === 'no' ? 'Prøv igjen' : 'Retry'}
              </button>
            )}
          </div>
        </div>

        {/* Additional info for Norwegian mobile networks */}
        {status === 'error' && (
          <div className="mt-2 text-xs text-gray-600">
            {language === 'no' 
              ? 'Sjekk internettforbindelsen din. Dette kan være vanlig på norske mobilnettverk i områder med dårlig dekning.'
              : 'Check your internet connection. This can be common on Norwegian mobile networks in areas with poor coverage.'
            }
          </div>
        )}

        {/* Mobile optimization tips */}
        {showNetworkInfo && networkInfo?.effectiveType === '2g' && (
          <div className="mt-2 text-xs text-orange-600 bg-orange-100 p-2 rounded">
            {language === 'no'
              ? 'Du er på et tregt nettverk. Meldinger kan ta lenger tid å sende.'
              : 'You\'re on a slow network. Messages may take longer to send.'
            }
          </div>
        )}

        {/* Low power mode notification */}
        {isLowPower && showNetworkInfo && (
          <div className="mt-2 text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
            {language === 'no'
              ? 'Lav batterimodus er aktivert. Real-time oppdateringer kan være redusert.'
              : 'Low power mode is active. Real-time updates may be reduced.'
            }
          </div>
        )}
      </div>
    </div>
  );
}