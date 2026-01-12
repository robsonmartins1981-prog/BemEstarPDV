
import React, { useRef, useEffect, useState } from 'react';
import { X, Camera, RefreshCw } from 'lucide-react';
import Button from '../shared/Button';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment', // Usa a câmera traseira em celulares
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      // Inicia a detecção (BarcodeDetector API disponível no Chrome/Android/iOS 17+)
      // Fallback para quem não tem a API será exibido erro ou aviso
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'qr_code']
        });

        const detect = async () => {
          if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              onDetected(code);
              stopCamera();
              return;
            }
          } catch (e) {
            console.error('Erro na detecção:', e);
          }
          requestAnimationFrame(detect);
        };
        detect();
      } else {
        setError('O scanner via câmera não é suportado neste navegador. Use um leitor USB ou digite o código.');
      }
    } catch (err) {
      setError('Erro ao acessar a câmera. Verifique as permissões.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-lg aspect-[3/4] bg-gray-900 rounded-3xl overflow-hidden border-4 border-theme-primary/30 shadow-2xl">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <Camera size={48} className="text-gray-600 mb-4" />
            <p className="text-white font-bold uppercase text-xs mb-6 leading-relaxed">{error}</p>
            <Button onClick={onClose} variant="secondary">Voltar ao Inventário</Button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {/* Overlay de Guia */}
            <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none">
              <div className="w-full h-full border-2 border-theme-primary/50 relative">
                 <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/50 animate-pulse shadow-[0_0_10px_red]" />
              </div>
            </div>
            <p className="absolute bottom-10 left-0 right-0 text-center text-[10px] font-black text-white uppercase tracking-widest bg-black/40 py-2 mx-10 rounded-full">
              Aponte para o código de barras
            </p>
          </>
        )}
      </div>

      <div className="mt-8 flex gap-4">
         <button 
           onClick={onClose} 
           className="p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all border border-white/20"
         >
           <X size={24} />
         </button>
         <button 
           onClick={() => { stopCamera(); startCamera(); }} 
           className="p-4 bg-theme-primary text-white rounded-full hover:bg-theme-primary-hover transition-all shadow-lg"
         >
           <RefreshCw size={24} />
         </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;
