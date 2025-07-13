'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let selectedDeviceId: string | undefined;

    const startScanning = async () => {
      try {
        // Get available video input devices
        const videoInputDevices = await codeReader.listVideoInputDevices();

        if (videoInputDevices.length === 0) {
          setError('No se encontraron cámaras disponibles');
          return;
        }

        // Prefer back camera on mobile devices
        selectedDeviceId = videoInputDevices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear')
        )?.deviceId || videoInputDevices[0].deviceId;

        if (videoRef.current && isScanning) {
          // Start continuous scanning
          await codeReader.decodeFromVideoDevice(
            selectedDeviceId,
            videoRef.current,
            (result, error) => {
              if (result) {
                const text = result.getText();
                console.log('Scanned:', text);

                // Check if it's a valid ISBN (10 or 13 digits)
                if (text && (text.length === 13 || text.length === 10)) {
                  setIsScanning(false);
                  onScan(text);
                  codeReader.reset();
                }
              }

              if (error && !(error instanceof NotFoundException)) {
                console.error('Scanning error:', error);
              }
            }
          );
        }
      } catch (err) {
        console.error('Failed to start scanner:', err);
        setError('Error al iniciar la cámara. Por favor, verifica los permisos.');
      }
    };

    startScanning();

    // Cleanup
    return () => {
      codeReader.reset();
    };
  }, [onScan, isScanning]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-white text-center p-4">
          <p className="text-xl mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
      />

      {/* Scanning overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          {/* Scanning frame */}
          <div className="w-64 h-32 border-2 border-white rounded-lg">
            <div className="w-full h-full border-2 border-white/50 rounded-lg m-[-2px]" />
          </div>

          {/* Scanning line animation */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-lg">
            <div className="w-full h-0.5 bg-red-500 animate-scan" />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-white text-lg font-medium bg-black/50 inline-block px-4 py-2 rounded">
          Coloca el código de barras dentro del recuadro
        </p>
      </div>
    </div>
  );
}
