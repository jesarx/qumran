'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat, NotFoundException } from '@zxing/library';
import type { IScannerControls } from '@zxing/browser';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Keep the latest onScan without restarting the camera stream.
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    // Restrict to the 1D formats used by book barcodes. This makes detection
    // noticeably faster and more reliable on phones than the full multi-format set.
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const codeReader = new BrowserMultiFormatReader(hints);
    let controls: IScannerControls | undefined;
    let stopped = false;

    const stop = () => {
      stopped = true;
      controls?.stop();
    };

    // Force the rear/environment camera. Using constraints (instead of
    // enumerating deviceIds before permission is granted) is what makes the
    // back camera get selected on mobile — device labels are empty until the
    // user grants permission, so the old "find a device labelled back" logic
    // fell back to the front camera and never focused on the barcode.
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    if (!videoRef.current) return;

    codeReader
      .decodeFromConstraints(constraints, videoRef.current, (result, err) => {
        if (result) {
          // Keep only digits; EAN-13 ISBN barcodes are 13 digits.
          const digits = result.getText().replace(/\D/g, '');
          if (!stopped && (digits.length === 13 || digits.length === 10)) {
            stop();
            onScanRef.current(digits);
          }
        }
        // NotFoundException is thrown for every frame without a barcode; ignore it.
        if (err && !(err instanceof NotFoundException)) {
          console.error('Scanning error:', err);
        }
      })
      .then((c) => {
        controls = c;
        // If we already matched/unmounted before the promise resolved, stop now.
        if (stopped) c.stop();
      })
      .catch((err) => {
        console.error('Failed to start scanner:', err);
        setError(
          'No se pudo iniciar la cámara. Verifica los permisos y que la página use HTTPS.'
        );
      });

    return () => {
      stop();
    };
    // Run once on mount; onScan is read through onScanRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        muted
        autoPlay
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
