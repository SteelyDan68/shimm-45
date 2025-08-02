import { useState, useEffect } from 'react';
import { Device, DeviceInfo } from '@capacitor/device';
import { Network, NetworkStatus } from '@capacitor/network';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface MobileDeviceInfo {
  platform: 'ios' | 'android' | 'web';
  model: string;
  operatingSystem: string;
  osVersion: string;
  isVirtual: boolean;
  memUsed?: number;
  diskFree?: number;
  diskTotal?: number;
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface NetworkInfo {
  connected: boolean;
  connectionType: string;
}

export const useMobileCapabilities = () => {
  const [deviceInfo, setDeviceInfo] = useState<MobileDeviceInfo | null>(null);
  const [networkStatus, setNetworkStatus] = useState<NetworkInfo | null>(null);
  const [isNativeApp, setIsNativeApp] = useState(false);

  // Initialize device info and capabilities
  useEffect(() => {
    const initializeCapabilities = async () => {
      try {
        // Check if running as native app
        const info = await Device.getInfo();
        setIsNativeApp(info.platform !== 'web');
        
        setDeviceInfo({
          platform: info.platform as 'ios' | 'android' | 'web',
          model: info.model,
          operatingSystem: info.operatingSystem,
          osVersion: info.osVersion,
          isVirtual: info.isVirtual,
          memUsed: (info as any).memUsed,
          diskFree: (info as any).diskFree,
          diskTotal: (info as any).diskTotal
        });

        // Get network status
        const networkInfo = await Network.getStatus();
        setNetworkStatus({
          connected: networkInfo.connected,
          connectionType: networkInfo.connectionType
        });

        // Configure status bar for native apps
        if (info.platform !== 'web') {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#ffffff' });
        }

        // Hide splash screen
        if (info.platform !== 'web') {
          setTimeout(() => {
            SplashScreen.hide();
          }, 2000);
        }

      } catch (error) {
        console.error('Error initializing mobile capabilities:', error);
        // Fallback for web
        setDeviceInfo({
          platform: 'web',
          model: 'Unknown',
          operatingSystem: 'Web',
          osVersion: '1.0',
          isVirtual: false
        });
        setNetworkStatus({
          connected: navigator.onLine,
          connectionType: 'unknown'
        });
      }
    };

    initializeCapabilities();

    // Network status listener
    const networkListener = Network.addListener('networkStatusChange', (status: NetworkStatus) => {
      setNetworkStatus({
        connected: status.connected,
        connectionType: status.connectionType
      });
    });

    return () => {
      networkListener.then(listener => listener.remove());
    };
  }, []);

  // Haptic feedback functions
  const hapticFeedback = {
    light: async () => {
      try {
        if (isNativeApp) {
          await Haptics.impact({ style: ImpactStyle.Light });
        }
      } catch (error) {
        console.error('Haptic feedback error:', error);
      }
    },
    medium: async () => {
      try {
        if (isNativeApp) {
          await Haptics.impact({ style: ImpactStyle.Medium });
        }
      } catch (error) {
        console.error('Haptic feedback error:', error);
      }
    },
    heavy: async () => {
      try {
        if (isNativeApp) {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        }
      } catch (error) {
        console.error('Haptic feedback error:', error);
      }
    }
  };

  // Status bar functions
  const statusBar = {
    setLight: async () => {
      try {
        if (isNativeApp) {
          await StatusBar.setStyle({ style: Style.Light });
        }
      } catch (error) {
        console.error('Status bar error:', error);
      }
    },
    setDark: async () => {
      try {
        if (isNativeApp) {
          await StatusBar.setStyle({ style: Style.Dark });
        }
      } catch (error) {
        console.error('Status bar error:', error);
      }
    },
    hide: async () => {
      try {
        if (isNativeApp) {
          await StatusBar.hide();
        }
      } catch (error) {
        console.error('Status bar error:', error);
      }
    },
    show: async () => {
      try {
        if (isNativeApp) {
          await StatusBar.show();
        }
      } catch (error) {
        console.error('Status bar error:', error);
      }
    }
  };

  // Battery info (if available)
  const getBatteryInfo = async () => {
    try {
      if (isNativeApp) {
        const batteryInfo = await Device.getBatteryInfo();
        return {
          batteryLevel: batteryInfo.batteryLevel,
          isCharging: batteryInfo.isCharging
        };
      }
      return null;
    } catch (error) {
      console.error('Battery info error:', error);
      return null;
    }
  };

  return {
    deviceInfo,
    networkStatus,
    isNativeApp,
    hapticFeedback,
    statusBar,
    getBatteryInfo,
    
    // Helper functions
    isIOS: deviceInfo?.platform === 'ios',
    isAndroid: deviceInfo?.platform === 'android',
    isWeb: deviceInfo?.platform === 'web',
    isOnline: networkStatus?.connected ?? true,
    connectionType: networkStatus?.connectionType ?? 'unknown'
  };
};