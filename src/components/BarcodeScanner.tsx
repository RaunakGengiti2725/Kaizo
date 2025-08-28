import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onError?: (error: string) => void;
  onStateChange?: (isActive: boolean) => void;
  className?: string;
  autoStart?: boolean;
}

export interface BarcodeScannerRef {
  start: () => void;
}

/**
 * Camera-based barcode scanner using ZXing. Provides start/stop controls and
 * emits the detected code via onDetected.
 */
const BarcodeScanner = forwardRef<BarcodeScannerRef, BarcodeScannerProps>(({ onDetected, onError, onStateChange, className, autoStart = true }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const lastDetectionRef = useRef<{ code: string; time: number } | null>(null);
  const scanningIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startingRef = useRef(false); // Use ref to avoid stale closure issues
  const activeRef = useRef(false); // Use ref to avoid async state update issues
  const mediaStreamRef = useRef<MediaStream | null>(null); // Persist current camera stream
  const decodingRef = useRef(false); // Prevent overlapping decode calls
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // Offscreen canvas for frame grabs

  // Wait until the video element has real dimensions and enough data
  const waitForVideoReady = useCallback((video: HTMLVideoElement, timeoutMs = 2500) => {
    return new Promise<void>((resolve) => {
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        resolve();
        return;
      }

      let settled = false;
      const cleanup = () => {
        if (settled) return;
        settled = true;
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('loadeddata', onLoaded);
        video.removeEventListener('resize', onLoaded);
        clearTimeout(timer);
      };

      const onLoaded = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
          cleanup();
          resolve();
        }
      };

      const timer = setTimeout(() => {
        // Timeout: proceed anyway to avoid stalling; scanOnce will guard
        cleanup();
        resolve();
      }, timeoutMs);

      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('loadeddata', onLoaded);
      video.addEventListener('resize', onLoaded);
    });
  }, []);

  const stop = useCallback(() => {
    const callStack = new Error().stack?.split('\n').slice(2, 5).map(line => line.trim()).join(' | ') || 'unknown';
    console.log('BarcodeScanner: Stopping scanner', {
      isActive,
      activeRef: activeRef.current,
      hasInterval: !!scanningIntervalRef.current,
      isStarting,
      startingRef: startingRef.current,
      callStack
    });

    // Don't stop if we're in the middle of starting
    if (startingRef.current) {
      console.log('BarcodeScanner: Not stopping - currently starting (ref)');
      return;
    }

    setIsDetecting(false);
    setScanAttempts(0);

    if (scanningIntervalRef.current) {
      clearInterval(scanningIntervalRef.current);
      scanningIntervalRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => {
        console.log('Stopping track:', t.label);
        t.stop();
      });
      videoRef.current.srcObject = null;
    }

    // Clear stored stream
    mediaStreamRef.current = null;
    decodingRef.current = false;

    activeRef.current = false;
    setIsActive(false);
    setLastResult(null);
    if (onStateChange) {
      onStateChange(false);
    }
  }, []); // Remove isStarting dependency since we use ref

  const scanOnce = useCallback(async () => {
    if (!codeReaderRef.current || !videoRef.current || startingRef.current) {
      console.log('BarcodeScanner: Skipping scan - not ready', {
        hasReader: !!codeReaderRef.current,
        hasVideo: !!videoRef.current,
        isActive,
        activeRef: activeRef.current,
        isStarting,
        startingRef: startingRef.current,
        videoReady: videoRef.current?.readyState || 'unknown'
      });
      return;
    }

    // If not active, stop the interval
    if (!activeRef.current) {
      console.log('BarcodeScanner: Not active, stopping interval');
      if (scanningIntervalRef.current) {
        clearInterval(scanningIntervalRef.current);
        scanningIntervalRef.current = null;
      }
      return;
    }

    const video = videoRef.current;

    // If the element lost its stream, reattach if we still have it
    if (!video.srcObject && mediaStreamRef.current) {
      console.log('BarcodeScanner: video element lost stream, reattaching');
      video.srcObject = mediaStreamRef.current;
      try { await video.play(); } catch {}
      return;
    }

    // Only scan if video has dimensions, enough data, and is playing
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('BarcodeScanner: Video not ready (dimensions/readyState), waiting...', {
        readyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        paused: video.paused
      });
      return;
    }

    if (video.paused) {
      try { await video.play(); } catch {}
      if (video.paused) {
        console.log('BarcodeScanner: Video paused after play attempt, waiting...');
        return;
      }
    }

    // Avoid overlapping decodes
    if (decodingRef.current) {
      return;
    }
    decodingRef.current = true;

    // This is a real decode attempt
    setScanAttempts(prev => prev + 1);
    console.log('BarcodeScanner: Attempting scan...', {
      attempt: scanAttempts + 1,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState,
      paused: video.paused,
      currentTime: video.currentTime
    });

    try {
      // Grab a frame to an offscreen canvas and decode from it to avoid
      // any interference with the playing <video> element.
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const canvas = canvasRef.current;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Use ZXing to decode from the canvas without altering the video
      const decodePromise = codeReaderRef.current!.decodeFromCanvas(canvas);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Scan timeout')), 1500)
      );

      const result = await Promise.race([decodePromise, timeoutPromise]);

      if (result) {
        const code = result.getText();
        console.log('BarcodeScanner: ✅ DETECTED BARCODE:', code);

        // Prevent duplicate detections within 2 seconds
        const now = Date.now();
        if (lastDetectionRef.current &&
            lastDetectionRef.current.code === code &&
            now - lastDetectionRef.current.time < 2000) {
          console.log('BarcodeScanner: Ignoring duplicate detection');
          return;
        }

        lastDetectionRef.current = { code, time: now };
        setLastResult(code);

        // Stop scanning and call the callback
        console.log('BarcodeScanner: Stopping scan and calling onDetected');
        stop();
        onDetected(code);
      } else {
        console.log('BarcodeScanner: No barcode found in this frame');
      }
    } catch (err: any) {
      // NotFoundException is expected when no barcode is found
      const message: string = err?.message || '';
      if (
        err instanceof NotFoundException ||
        message.includes('timeout')
      ) {
        console.log('BarcodeScanner: No barcode found (NotFoundException or timeout)');
      } else if (
        err?.name === 'IndexSizeError' ||
        message.includes('getImageData') ||
        message.includes('source width is 0') ||
        message.includes('The source width is 0')
      ) {
        // Transient race where dimensions briefly read as 0; do not surface to UI
        console.log('BarcodeScanner: Transient canvas sizing error, will retry');
      } else {
        console.warn('BarcodeScanner: Scan error:', err);
        setCameraError(`Scan error: ${err?.message || 'Unknown error'}`);
      }
    } finally {
      decodingRef.current = false;
    }
  }, [isActive, onDetected, stop, scanAttempts]); // Remove isStarting since we use ref

  const start = useCallback(async () => {
    if (startingRef.current || activeRef.current) {
      console.log('BarcodeScanner: Already starting or active, skipping start request');
      return;
    }

    console.log('BarcodeScanner: Starting scanner');
    startingRef.current = true;
    setIsStarting(true);
    setCameraError(null);
    setLastResult(null);
    setIsDetecting(false);

    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      // Get available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      console.log('Available cameras:', videoDevices.map(d => ({ label: d.label, id: d.deviceId })));

      // If no cameras available, try to request permission first
      if (videoDevices.length === 0) {
        console.log('No cameras found, requesting camera permission...');
        try {
          // Request basic camera access to trigger permission dialog
          const tempStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }, 
            audio: false 
          });
          tempStream.getTracks().forEach(track => track.stop());
          
          // Re-enumerate devices after permission
          const newDevices = await navigator.mediaDevices.enumerateDevices();
          const newVideoDevices = newDevices.filter(d => d.kind === 'videoinput');
          console.log('Cameras after permission request:', newVideoDevices.map(d => ({ label: d.label, id: d.deviceId })));
          
          if (newVideoDevices.length > 0) {
            videoDevices.push(...newVideoDevices);
          }
        } catch (permErr) {
          console.log('Permission request failed:', permErr);
        }
      }

      // Prefer back camera for scanning
      let deviceId = videoDevices[0]?.deviceId;
      const backCamera = videoDevices.find(d =>
        d.label.toLowerCase().includes('back') ||
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      );
      if (backCamera) {
        deviceId = backCamera.deviceId;
        console.log('Using back camera:', backCamera.label);
      }

      // Get camera stream with fallback constraints
      let constraints: MediaStreamConstraints;
      if (videoDevices.length > 0 && deviceId) {
        constraints = {
          video: { deviceId: { exact: deviceId } },
          audio: false,
        };
      } else {
        constraints = {
          video: { facingMode: 'environment' },
          audio: false,
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        const video = videoRef.current;

        // Clear any existing video state to prevent conflicts
        video.pause();
        video.currentTime = 0;
        video.srcObject = null;

        // Configure video element for manual playback
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;
        video.playsInline = true;

        // Set the stream
        video.srcObject = stream;

        // Wait a bit for the stream to be ready before playing
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if we're still supposed to be starting (not interrupted)
        if (!startingRef.current) {
          console.log('BarcodeScanner: Start was interrupted, stopping');
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        // Start playing the video with retry logic
        let playAttempts = 0;
        const maxPlayAttempts = 3;
        
        while (playAttempts < maxPlayAttempts) {
          try {
            await video.play();
            break; // Success, exit retry loop
          } catch (playErr: any) {
            playAttempts++;
            console.log(`BarcodeScanner: Play attempt ${playAttempts} failed:`, playErr);
            
            if (playErr.name === 'AbortError' && playAttempts < maxPlayAttempts) {
              // Wait a bit longer before retry
              await new Promise(resolve => setTimeout(resolve, 200 * playAttempts));
              continue;
            } else if (playAttempts >= maxPlayAttempts) {
              throw new Error(`Failed to play video after ${maxPlayAttempts} attempts: ${playErr.message}`);
            } else {
              throw playErr;
            }
          }
        }

        // Wait until we have real dimensions (or timeout)
        await waitForVideoReady(video);
        console.log('BarcodeScanner: Video is playing', {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
      }

      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      console.log('Starting periodic scanning');
      activeRef.current = true;
      setIsActive(true);
      setIsDetecting(true);
      if (onStateChange) {
        onStateChange(true);
      }

      // Start the scan interval immediately since we're not using ZXing's built-in video handling
      if (!scanningIntervalRef.current) {
        console.log('BarcodeScanner: Starting scan interval');
        scanningIntervalRef.current = setInterval(scanOnce, 500);
      }

      console.log('BarcodeScanner: Scanner started successfully');

    } catch (err: any) {
      console.error('BarcodeScanner: Failed to start:', err);
      
      let errorMessage = 'Unable to start camera';
      if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please check your device has a camera and grant permission.';
      } else if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another application. Please close other apps using the camera.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not met. Trying alternative camera settings.';
      } else if (err.name === 'AbortError') {
        errorMessage = 'Camera start was interrupted. This usually resolves automatically.';
        // For AbortError, don't treat it as a fatal error - just log it
        console.log('BarcodeScanner: AbortError detected, this is usually transient');
        startingRef.current = false;
        setIsStarting(false);
        return; // Don't call stop() for AbortError
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setCameraError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      startingRef.current = false;
      setIsStarting(false);
      stop();
    } finally {
      startingRef.current = false;
      setIsStarting(false);
    }
  }, [scanOnce, stop]);

  useImperativeHandle(ref, () => ({
    start
  }), [start]);

  // Auto-start on mount if enabled
  useEffect(() => {
    if (autoStart) {
      // Add a small delay to ensure component is fully mounted
      const startTimer = setTimeout(() => {
        if (autoStart && !startingRef.current && !activeRef.current) {
          start();
        }
      }, 100);
      
      return () => clearTimeout(startTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup effect - only run on actual unmount
  useEffect(() => {
    return () => {
      console.log('BarcodeScanner: Component unmounting, cleaning up');
      startingRef.current = false;
      activeRef.current = false;
      stop();
    };
  }, []); // Empty dependency array - only run on unmount

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay={false}
            onLoadStart={() => console.log('BarcodeScanner: Video load started')}
            onLoadedMetadata={() => console.log('BarcodeScanner: Video metadata loaded')}
            onCanPlay={() => console.log('BarcodeScanner: Video can play')}
            onError={(e) => console.error('BarcodeScanner: Video error:', e)}
          />

          {/* Scanning overlay when active */}
          {isActive && (
            <>
              {/* Scanning frame overlay - guides user where to place barcode */}
              <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                <div className="relative w-[80%] max-w-xl aspect-[16/6]">
                  {/* Corner brackets - visual guide for barcode placement */}
                  <div className="absolute -top-1 -left-1 h-8 w-8 border-t-4 border-l-4 border-white rounded-tl-lg opacity-80" />
                  <div className="absolute -top-1 -right-1 h-8 w-8 border-t-4 border-r-4 border-white rounded-tr-lg opacity-80" />
                  <div className="absolute -bottom-1 -left-1 h-8 w-8 border-b-4 border-l-4 border-white rounded-br-lg opacity-80" />
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 border-b-4 border-r-4 border-white rounded-br-lg opacity-80" />
                </div>
              </div>
            </>
          )}



          {/* Error overlay */}
          {cameraError && (
            <div className="absolute inset-0 grid place-items-center bg-black/80 text-white p-4 text-center">
              <div>
                <div className="mb-3 font-semibold text-lg">⚠️ Camera Error</div>
                <div className="text-sm opacity-90 mb-4">{cameraError}</div>
                <div className="space-y-2">
                  <Button onClick={start} variant="outline" size="sm">
                    Try Again
                  </Button>
                  <div className="text-xs opacity-60">
                    Make sure camera permissions are granted and no other apps are using the camera
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>
      </CardContent>
    </Card>
  );
});

export default BarcodeScanner;


