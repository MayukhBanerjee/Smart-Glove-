import { MockData } from '@/lib/mock-data';
import { AlertCircle, Wifi, WifiOff, Zap } from 'lucide-react';

interface StatusBarProps {
  data: MockData;
}

export function StatusBar({ data }: StatusBarProps) {
  const getRiskColor = () => {
    switch (data.injuryRisk) {
      case 'SAFE':
        return 'border-l-4 border-emerald-500 bg-emerald-50';
      case 'WARNING':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'DANGER':
        return 'border-l-4 border-red-500 bg-red-50';
    }
  };

  const getGlowColor = () => {
    switch (data.injuryRisk) {
      case 'SAFE':
        return 'shadow-lg shadow-emerald-500/50';
      case 'WARNING':
        return 'shadow-lg shadow-yellow-500/50';
      case 'DANGER':
        return 'shadow-lg shadow-red-500/50 animate-pulse';
    }
  };

  const getRiskTextColor = () => {
    switch (data.injuryRisk) {
      case 'SAFE':
        return 'text-emerald-900';
      case 'WARNING':
        return 'text-yellow-900';
      case 'DANGER':
        return 'text-red-900';
    }
  };

  return (
    <div className={`border-b border-border/30 transition-all duration-300 ${getGlowColor()}`}>
      <div className={`${getRiskColor()} border-b border-border/30`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Injury Risk Level</span>
                </div>
                <p className={`text-lg font-bold ${getRiskTextColor()}`}>{data.injuryRisk}</p>
              </div>
              <div className="border-l border-current opacity-30 h-12"></div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Connection Status</p>
                <div className="flex items-center gap-2">
                  {data.connectionStatus === 'LIVE' ? (
                    <>
                      <Wifi className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-emerald-700">{data.connectionStatus}</span>
                      <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-600" />
                      <span className="font-semibold text-red-700">{data.connectionStatus}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
