import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
}

interface ResponsiveScale {
  initial: number;
  min: number;
  max: number;
  step: number;
}

export function useResponsiveGlassesScale(): {
  deviceInfo: DeviceInfo;
  responsiveScale: ResponsiveScale;
  getOptimalScale: (baseScale: number) => number;
} {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1920,
    screenHeight: 1080,
    devicePixelRatio: 1
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pixelRatio = window.devicePixelRatio || 1;

      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        screenWidth: width,
        screenHeight: height,
        devicePixelRatio: pixelRatio
      });
    };

    // Executar na inicialização
    updateDeviceInfo();

    // Escutar mudanças de orientação e redimensionamento
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  const responsiveScale: ResponsiveScale = {
    // Valores simples e conservadores para todos os dispositivos
    initial: 1.0, // Sempre começar com tamanho padrão
    min: 0.3,
    max: 2.5,
    step: 0.05
  };

  console.log('📐 Hook Responsivo - Configuração atual:', {
    dispositivo: deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop',
    tela: `${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`,
    escalaInicial: responsiveScale.initial,
    limites: `${responsiveScale.min}x - ${responsiveScale.max}x`
  });

  const getOptimalScale = (baseScale: number): number => {
    // Usar escala base sem muitas correções para não afetar posicionamento
    let correctionFactor = 1.0;

    if (deviceInfo.isMobile) {
      // Mobile: manter escala um pouco maior
      correctionFactor = 1.1;
    } else if (deviceInfo.isTablet) {
      // Tablet: reduzir levemente
      correctionFactor = 0.9;
    } else {
      // Desktop: reduzir um pouco menos
      correctionFactor = 0.8;
    }

    const adjustedScale = baseScale * correctionFactor;

    // Garantir que está dentro dos limites
    return Math.max(responsiveScale.min, Math.min(responsiveScale.max, adjustedScale));
  };

  return {
    deviceInfo,
    responsiveScale,
    getOptimalScale
  };
}
