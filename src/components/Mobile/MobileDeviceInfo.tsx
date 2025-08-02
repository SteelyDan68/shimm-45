import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';
import { 
  Smartphone, 
  Battery, 
  Wifi, 
  WifiOff, 
  Monitor,
  HardDrive,
  Cpu,
  Vibrate,
  Sun,
  Moon,
  Eye,
  EyeOff
} from 'lucide-react';

export function MobileDeviceInfo() {
  const {
    deviceInfo,
    networkStatus,
    isNativeApp,
    hapticFeedback,
    statusBar,
    getBatteryInfo,
    isIOS,
    isAndroid,
    isWeb,
    isOnline,
    connectionType
  } = useMobileCapabilities();

  const [batteryInfo, setBatteryInfo] = React.useState<{
    batteryLevel?: number;
    isCharging?: boolean;
  } | null>(null);

  React.useEffect(() => {
    if (isNativeApp) {
      getBatteryInfo().then(setBatteryInfo);
    }
  }, [isNativeApp, getBatteryInfo]);

  const getPlatformIcon = () => {
    if (isIOS) return '🍎';
    if (isAndroid) return '🤖';
    return '🌐';
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const GB = bytes / (1024 * 1024 * 1024);
    return `${GB.toFixed(1)} GB`;
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined) return 'N/A';
    return `${Math.round(value * 100)}%`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Enhetsinformation
            <span className="text-lg">{getPlatformIcon()}</span>
          </CardTitle>
          <CardDescription>
            Information om din enhet och plattform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Plattform</p>
              <div className="flex items-center gap-2">
                <Badge variant={isNativeApp ? "default" : "secondary"}>
                  {deviceInfo?.platform || 'Unknown'}
                </Badge>
                {isNativeApp && (
                  <Badge variant="outline">Native App</Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Modell</p>
              <p className="text-sm text-muted-foreground">
                {deviceInfo?.model || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Operativsystem</p>
              <p className="text-sm text-muted-foreground">
                {deviceInfo?.operatingSystem} {deviceInfo?.osVersion}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Typ</p>
              <Badge variant={deviceInfo?.isVirtual ? "outline" : "secondary"}>
                {deviceInfo?.isVirtual ? 'Virtuell' : 'Fysisk'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Network Status */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getConnectionIcon()}
              <p className="text-sm font-medium">Nätverksstatus</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={isOnline ? "default" : "destructive"}>
                  {isOnline ? 'Ansluten' : 'Frånkopplad'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Typ</p>
                <p className="text-sm">{connectionType}</p>
              </div>
            </div>
          </div>

          {/* Memory and Storage */}
          {deviceInfo?.memUsed !== undefined && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="h-4 w-4" />
                  <p className="text-sm font-medium">Minnesinformation</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Använt minne</p>
                    <p className="text-sm">{formatBytes(deviceInfo.memUsed)}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Storage */}
          {deviceInfo?.diskFree !== undefined && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="h-4 w-4" />
                  <p className="text-sm font-medium">Lagringsinformation</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Ledigt utrymme</p>
                    <p className="text-sm">{formatBytes(deviceInfo.diskFree)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Totalt utrymme</p>
                    <p className="text-sm">{formatBytes(deviceInfo.diskTotal)}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Battery Info */}
          {batteryInfo && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Battery className="h-4 w-4" />
                  <p className="text-sm font-medium">Batteristatus</p>
                </div>
                <div className="space-y-2">
                  {batteryInfo.batteryLevel !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground">Batterinivå</p>
                        <span className="text-sm font-medium">
                          {formatPercentage(batteryInfo.batteryLevel)}
                        </span>
                      </div>
                      <Progress value={batteryInfo.batteryLevel * 100} className="h-2" />
                    </div>
                  )}
                  {batteryInfo.isCharging !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground">Laddningsstatus</p>
                      <Badge variant={batteryInfo.isCharging ? "default" : "secondary"}>
                        {batteryInfo.isCharging ? 'Laddar' : 'Laddar inte'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Native Features Testing */}
      {isNativeApp && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vibrate className="h-5 w-5" />
              Testa Native-funktioner
            </CardTitle>
            <CardDescription>
              Testa mobila funktioner som bara finns i appen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Haptisk feedback</p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={hapticFeedback.light}
                >
                  Lätt
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={hapticFeedback.medium}
                >
                  Medium
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={hapticFeedback.heavy}
                >
                  Stark
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">Statusfält</p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={statusBar.setLight}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Ljust
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={statusBar.setDark}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Mörkt
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={statusBar.hide}
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Dölj
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={statusBar.show}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visa
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">Batteriinfo</p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={async () => {
                  const info = await getBatteryInfo();
                  setBatteryInfo(info);
                }}
              >
                <Battery className="h-4 w-4 mr-2" />
                Uppdatera batteristatus
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Web Features */}
      {!isNativeApp && (
        <Card>
          <CardHeader>
            <CardTitle>Webb-funktioner</CardTitle>
            <CardDescription>
              Du använder webbversionen av appen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">
                För att använda alla mobila funktioner, ladda ner appen från App Store eller Google Play
              </p>
              <div className="flex gap-2 justify-center">
                <Badge variant="outline">PWA-kompatibel</Badge>
                <Badge variant="outline">Responsiv design</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}