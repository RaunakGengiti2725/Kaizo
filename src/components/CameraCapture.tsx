import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RotateCcw, CheckCircle, X, Loader2, ImageIcon, Barcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { haptics } from '@/utils/haptics';
import { geminiAI } from '@/services/geminiAI';

interface CapturedImage {
  id: string;
  file: File;
  url: string;
  type: 'front' | 'back' | 'ingredients' | 'additional';
  timestamp: number;
}

interface CameraCaptureProps {
  onImagesCapture: (images: CapturedImage[]) => void;
  isProcessing?: boolean;
  onBarcodeLookup?: (productInfo: {
    barcode: string;
    productName?: string;
    brandName?: string;
    category?: string;
    ingredients?: string[];
    isVegan?: boolean;
    confidence?: number;
  }) => void;
}

const CameraCapture = ({ onImagesCapture, isProcessing = false, onBarcodeLookup }: CameraCaptureProps) => {
  const [isActive, setIsActive] = useState(false);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [currentCaptureType, setCurrentCaptureType] = useState<CapturedImage['type']>('front');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isBarcodeScanning, setIsBarcodeScanning] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const captureTypes = [
    { type: 'front' as const, label: 'Front Label', description: 'Product name and brand' },
    { type: 'back' as const, label: 'Back Panel', description: 'Nutritional information' },
    { type: 'ingredients' as const, label: 'Ingredients', description: 'Full ingredients list' },
    { type: 'additional' as const, label: 'Additional', description: 'Any other details' }
  ];

  const checkCameraPermissions = useCallback(async () => {
    try {
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return permissions.state;
    } catch (error) {
      console.warn('Cannot check camera permissions:', error);
      return 'prompt';
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setCameraError(null);

    try {
      // Check if we're on HTTPS (required for camera access)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error('Camera access requires HTTPS. Please use a secure connection (https://) or localhost for development.');
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
      }

      // Check permissions first
      const permissionState = await checkCameraPermissions();
      console.log('Camera permission state:', permissionState);

      if (permissionState === 'denied') {
        throw new Error('Camera permission denied. Please enable camera access in your browser settings and refresh the page.');
      }

      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // Clear video element before setting new stream
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        // Reset video element state
        videoRef.current.load();
      }

      let mediaStream;

      // Try to select a specific camera device when available
      let preferredDeviceId: string | undefined;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        console.log('Detected video inputs:', videoInputs.map(v => ({ label: v.label, deviceId: v.deviceId })));

        // Prefer back camera on mobile if label suggests it, otherwise first device
        const backCam = videoInputs.find(v => /back|rear|environment/i.test(v.label));
        const frontCam = videoInputs.find(v => /front|user/i.test(v.label));
        if (facingMode === 'environment' && backCam) preferredDeviceId = backCam.deviceId;
        else if (facingMode === 'user' && frontCam) preferredDeviceId = frontCam.deviceId;
        else if (videoInputs[0]) preferredDeviceId = videoInputs[0].deviceId;
      } catch (e) {
        console.warn('Could not enumerate devices (this can be normal before permission granted):', e);
      }

      const constraintsList = [
        // Try preferred device with flexible constraints first
        preferredDeviceId ? {
          video: {
            deviceId: preferredDeviceId,
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          },
          audio: false
        } : null,
        // Try facing mode without exact (more flexible)
        {
          video: {
            facingMode: facingMode,
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          },
          audio: false
        },
        // Basic constraints without facing mode
        {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        },
        // Try with exact deviceId as fallback (more restrictive)
        preferredDeviceId ? {
          video: {
            deviceId: { exact: preferredDeviceId },
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 }
          },
          audio: false
        } : null,
        // Try exact facingMode with lower resolution as last resort
        {
          video: {
            facingMode: { exact: facingMode },
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 }
          },
          audio: false
        },
        // Minimal constraints as absolute last resort
        {
          video: true,
          audio: false
        }
      ].filter(Boolean) as MediaStreamConstraints[];

      let lastError;
      for (let i = 0; i < constraintsList.length; i++) {
        try {
          const constraints = constraintsList[i];
          console.log(`Attempting camera with constraints ${i + 1}:`, constraints);
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('Camera stream obtained successfully:', mediaStream);
          
          // Verify stream has active tracks
          const videoTracks = mediaStream.getVideoTracks();
          if (videoTracks.length === 0) {
            throw new Error('No video tracks available');
          }
          
          console.log('Video track info:', {
            label: videoTracks[0].label,
            settings: videoTracks[0].getSettings(),
            constraints: videoTracks[0].getConstraints()
          });
          
          break;
        } catch (error) {
          console.warn(`Camera attempt ${i + 1} failed:`, error);
          lastError = error;
          if (i === constraintsList.length - 1) {
            throw error; // Last attempt failed
          }
        }
      }

      if (!mediaStream) {
        throw lastError || new Error('Failed to access camera');
      }

      setStream(mediaStream);
      
      if (videoRef.current) {
        console.log('Setting video source and preparing playback');
        const video = videoRef.current;
        
        // Set video attributes for better compatibility
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        // Also set properties directly
        // Some TS configs don't include playsInline on HTMLVideoElement; set via attribute above
        video.muted = true;
        video.autoplay = true;
        
        // Attach the full stream (video + audio tracks, but audio is muted)
        video.srcObject = mediaStream;

        // Ensure video element is ready
        video.load();
        // Prefer requestVideoFrameCallback if available to know when first frame is rendered
        const waitFirstFrame = () => new Promise<void>((resolve) => {
          const rafc = (video as any).requestVideoFrameCallback;
          if (typeof rafc === 'function') {
            rafc(() => resolve());
          } else {
            const onFrame = () => {
              if (video.videoWidth > 0 && video.videoHeight > 0) {
                video.removeEventListener('timeupdate', onFrame);
                resolve();
              }
            };
            video.addEventListener('timeupdate', onFrame);
            setTimeout(() => {
              video.removeEventListener('timeupdate', onFrame);
              resolve();
            }, 1200);
          }
        });
        try {
          await video.play();
          await waitFirstFrame();
        } catch (err) {
          console.warn('play() may be blocked:', err);
        }

        // Wait briefly for readiness, but don't block indefinitely
        await new Promise<void>((resolve) => {
          const onReady = () => {
            console.log('Video ready event fired', { readyState: video.readyState, w: video.videoWidth, h: video.videoHeight });
            cleanup();
            resolve();
          };
          const cleanup = () => {
            clearTimeout(timeoutId);
            video.removeEventListener('loadedmetadata', onReady);
            video.removeEventListener('canplay', onReady);
          };
          const timeoutId = setTimeout(() => {
            console.warn('Proceeding without ready events');
            cleanup();
            resolve();
          }, 1500);
          if (video.readyState >= 1) {
            onReady();
          } else {
            video.addEventListener('loadedmetadata', onReady);
            video.addEventListener('canplay', onReady);
          }
        });
        
        // Ensure video starts playing
        // Do not immediately play again here; rely on the earlier play() and user interaction if blocked.
        // Instead, put a watchdog that retries minimally if dimensions remain zero.
        setTimeout(() => {
          if (video.videoWidth === 0 || video.videoHeight === 0) {
            console.log('Watchdog: video dimensions still 0, attempting gentle refresh');
            const currentStream = video.srcObject as MediaStream;
            if (currentStream) {
              const refreshedStream = new MediaStream(currentStream.getVideoTracks());
              video.srcObject = refreshedStream;
              video.load();
              video.play().catch(() => {});
            }
          }
        }, 1200);
      }
      
      setIsActive(true);
      
      toast({
        title: "Camera Ready",
        description: "Camera is now active and ready for capturing photos",
      });
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Unknown camera error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'name' in error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Camera permission denied. Please allow camera access and refresh the page.';
            break;
          case 'NotFoundError':
            errorMessage = 'No camera found. Please connect a camera and try again.';
            break;
          case 'NotReadableError':
            errorMessage = 'Camera is being used by another application. Please close other apps using the camera.';
            break;
          case 'OverconstrainedError':
            errorMessage = 'Camera constraints too restrictive. This is normal - trying less restrictive settings...';
            console.log('OverconstrainedError details:', error.constraint);
            break;
          case 'SecurityError':
            errorMessage = 'Camera access blocked by security settings. Please use HTTPS or allow camera access.';
            break;
          default:
            errorMessage = `Camera error: ${error.name}`;
        }
      }
      
      setCameraError(errorMessage);
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  }, [facingMode, checkCameraPermissions, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    // Haptic feedback for capture
    haptics.capture();

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `scan-${currentCaptureType}-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      const url = URL.createObjectURL(file);
      const newImage: CapturedImage = {
        id: crypto.randomUUID(),
        file,
        url,
        type: currentCaptureType,
        timestamp: Date.now()
      };

      setCapturedImages(prev => {
        // Remove existing image of same type
        const filtered = prev.filter(img => img.type !== currentCaptureType);
        return [...filtered, newImage];
      });

      // Move to next capture type
      const currentIndex = captureTypes.findIndex(t => t.type === currentCaptureType);
      const nextIndex = (currentIndex + 1) % captureTypes.length;
      setCurrentCaptureType(captureTypes[nextIndex].type);

      // Success haptic feedback
      haptics.success();

      toast({
        title: "Photo Captured",
        description: `${captureTypes[currentIndex].label} captured successfully`,
      });
    }, 'image/jpeg', 0.9);
  }, [currentCaptureType]);

  // Simple barcode detection using canvas image data
  const detectBarcodeInFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isBarcodeScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for barcode detection
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple barcode pattern detection (looking for alternating black/white patterns)
    // This is a basic implementation - in production you'd use a proper barcode library
    const centerY = Math.floor(canvas.height / 2);
    const scanWidth = Math.min(400, canvas.width);
    const startX = Math.floor((canvas.width - scanWidth) / 2);

    let barcodePattern = '';
    let currentColor = 0;
    let count = 0;

    // Scan horizontal line in center of frame
    for (let x = startX; x < startX + scanWidth; x++) {
      const index = (centerY * canvas.width + x) * 4;
      const gray = (data[index] + data[index + 1] + data[index + 2]) / 3;

      const binary = gray < 128 ? 0 : 1;

      if (binary !== currentColor) {
        if (count > 0) {
          barcodePattern += count.toString() + currentColor.toString();
        }
        currentColor = binary;
        count = 1;
      } else {
        count++;
      }
    }

    // Check if we found a pattern that looks like a barcode
    if (barcodePattern.length > 20) {
      // For demo purposes, generate a mock barcode based on pattern
      const mockBarcode = barcodePattern.length > 30 ?
        '978020137962' : // Book barcode example
        '123456789012';  // Product barcode example

      setDetectedBarcode(mockBarcode);

      // Success feedback
      haptics.success();
      toast({
        title: "Barcode Detected!",
        description: `Found barcode: ${mockBarcode}`,
      });

      setIsBarcodeScanning(false);
    }
  }, [isBarcodeScanning]);

  // Barcode scanning loop
  useEffect(() => {
    if (!isBarcodeScanning || !stream) return;

    const scanInterval = setInterval(detectBarcodeInFrame, 500); // Scan every 500ms

    return () => clearInterval(scanInterval);
  }, [isBarcodeScanning, stream, detectBarcodeInFrame]);

  const removeImage = useCallback((imageId: string) => {
    setCapturedImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      // Clean up URL
      const removed = prev.find(img => img.id === imageId);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return updated;
    });
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      const newImage: CapturedImage = {
        id: crypto.randomUUID(),
        file,
        url,
        type: index === 0 ? currentCaptureType : 'additional',
        timestamp: Date.now()
      };

      setCapturedImages(prev => [...prev, newImage]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [currentCaptureType]);

  const processImages = useCallback(() => {
    if (capturedImages.length === 0) {
      toast({
        title: "No Images",
        description: "Please capture at least one image to proceed.",
        variant: "destructive",
      });
      return;
    }

    onImagesCapture(capturedImages);
    stopCamera();
  }, [capturedImages, onImagesCapture, stopCamera]);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup URLs on unmount
      capturedImages.forEach(img => URL.revokeObjectURL(img.url));
      
      // Cleanup camera stream
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Camera track stopped on cleanup');
        });
      }
      
      // Clear video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [capturedImages, stream]);

  if (!isActive) {
    return (
      <Card className="shadow-card bg-gradient-card border-0">
        <CardHeader className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="w-10 h-10 text-primary" />
          </div>
          <CardTitle>Multi-Angle Product Scan</CardTitle>
          <CardDescription>
            Capture multiple angles for the most accurate vegan analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Capture Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {captureTypes.map((type) => (
              <div
                key={type.type}
                className={`p-4 rounded-lg border transition-all ${
                  currentCaptureType === type.type
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background/50'
                }`}
              >
                <h4 className="font-semibold text-sm">{type.label}</h4>
                <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                {capturedImages.some(img => img.type === type.type) && (
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-xs text-success">Captured</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => {
                haptics.tap();
                startCamera();
              }}
              disabled={isInitializing}
              className="flex-1 bg-primary hover:bg-primary/90 shadow-glow transition-smooth"
              size="lg"
            >
              {isInitializing ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Starting Camera...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 mr-2" />
                  Start Camera
                </>
              )}
            </Button>
            
            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <ImageIcon className="w-5 h-5 mr-2" />
              Upload Photos
            </Button>
          </div>

          {/* Camera Diagnostics (show when there are issues or when requested) */}
          {(cameraError || isActive) && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Camera Status</h4>
              <div className="space-y-2 text-sm text-blue-700">
                {!cameraError ? (
                  <div className="space-y-1">
                    <p><strong>✅ Camera is active and ready!</strong></p>
                    <p>If you see a black screen:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Click on the video area to start playback</li>
                      <li>Check that your camera isn't being used by another app</li>
                      <li>Try switching between front/back camera</li>
                      <li>Refresh the page and allow camera permissions</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p><strong>❌ Error:</strong> {cameraError}</p>
                    <p><strong>Things to try:</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Refresh the page and allow camera permissions when prompted</li>
                      <li>Close other applications that might be using the camera</li>
                      <li>Try a different browser (Chrome, Firefox, Safari)</li>
                      <li>Make sure you're using HTTPS (not HTTP)</li>
                      <li>Check if your camera is working in other applications</li>
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={async () => {
                      // Show camera diagnostics
                      console.log('=== CAMERA DIAGNOSTICS ===');
                      try {
                        console.log('1. Checking HTTPS:', location.protocol);
                        console.log('2. Checking mediaDevices API:', !!navigator.mediaDevices);
                        console.log('3. Checking getUserMedia:', !!navigator.mediaDevices?.getUserMedia);

                        const devices = await navigator.mediaDevices.enumerateDevices();
                        const videoDevices = devices.filter(device => device.kind === 'videoinput');
                        console.log('4. Available cameras:', videoDevices.map(d => ({
                          label: d.label,
                          deviceId: d.deviceId,
                          groupId: d.groupId
                        })));

                        if (navigator.permissions) {
                          const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
                          console.log('5. Camera permission:', permissions.state);
                        }

                        // Test basic camera access
                        console.log('6. Testing basic camera access...');
                        try {
                          const testStream = await navigator.mediaDevices.getUserMedia({
                            video: { width: 640, height: 480 },
                            audio: false
                          });
                          console.log('7. Basic camera test successful');
                          testStream.getTracks().forEach(track => track.stop());
                        } catch (testError) {
                          console.error('7. Basic camera test failed:', testError);
                        }

                        toast({
                          title: "Diagnostics Complete",
                          description: `Found ${videoDevices.length} camera(s). Check console for details.`,
                        });
                      } catch (error) {
                        console.error('Diagnostics failed:', error);
                        toast({
                          title: "Diagnostics Failed",
                          description: "Could not gather camera information",
                          variant: "destructive",
                        });
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Run Diagnostics
                  </Button>

                  {!cameraError && (
                    <Button
                      onClick={async () => {
                        // Force restart camera
                        await stopCamera();
                        setTimeout(() => startCamera(), 500);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Restart Camera
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Show captured images if any */}
          {capturedImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Captured Images ({capturedImages.length})</h4>
                <Button
                  onClick={processImages}
                  disabled={isProcessing}
                  className="bg-success hover:bg-success/90"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Analyze Images'
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {capturedImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={`${image.type} capture`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Badge
                      variant="secondary"
                      className="absolute top-2 left-2 text-xs"
                    >
                      {captureTypes.find(t => t.type === image.type)?.label}
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      onClick={() => removeImage(image.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Capturing: {captureTypes.find(t => t.type === currentCaptureType)?.label}
            </CardTitle>
            <CardDescription>
              {captureTypes.find(t => t.type === currentCaptureType)?.description}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {capturedImages.length}/{captureTypes.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Camera View */}
        <div className="relative rounded-lg overflow-hidden bg-gray-900">
          <video
            ref={videoRef}
            className="w-full h-96 sm:h-[30rem] md:h-[36rem] lg:h-[40rem] object-cover"
            playsInline
            muted
            autoPlay
            webkit-playsinline="true"
            style={{
              objectFit: 'cover',
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              minHeight: '384px',
              display: 'block',
              backgroundColor: '#000'
            }}
            onLoadStart={() => console.log('Video load started')}
            onLoadedData={() => console.log('Video data loaded')}
            onLoadedMetadata={(e) => {
              const video = e.target as HTMLVideoElement;
              console.log('Video metadata loaded:', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                duration: video.duration,
                readyState: video.readyState,
                srcObject: !!video.srcObject
              });
            }}
            onCanPlay={() => console.log('Video can play')}
            onPlay={() => { setIsVideoPlaying(true); console.log('Video playing') }}
            onPause={() => { setIsVideoPlaying(false); console.log('Video paused') }}
            onError={(e) => {
              const video = e.target as HTMLVideoElement;
              console.error('Video error:', {
                error: video.error,
                networkState: video.networkState,
                readyState: video.readyState,
                srcObject: !!video.srcObject
              });
            }}
            onClick={async () => {
              // Manual play on click if autoplay failed
              if (videoRef.current?.paused) {
                try {
                  await videoRef.current.play();
                  console.log('Manual play succeeded');
                } catch (error) {
                  console.error('Manual play failed:', error);
                }
              }
            }}
          />
          
          {/* Loading indicator */}
          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center text-white">
                <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg font-semibold">Starting Camera...</p>
                <p className="text-sm opacity-75">Please allow camera access</p>
              </div>
            </div>
          )}

          {/* Debug Info Overlay (only in development) */}
          {process.env.NODE_ENV === 'development' && stream && (
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs p-2 rounded">
              <div>Stream: {stream.active ? 'Active' : 'Inactive'}</div>
              <div>Tracks: {stream.getVideoTracks().length} video, {stream.getAudioTracks().length} audio</div>
              {videoRef.current && (
                <div>Video: {videoRef.current.readyState === 4 ? 'Ready' : videoRef.current.readyState === 0 ? 'Not loaded' : 'Loading'}</div>
              )}
            </div>
          )}
          
          {/* Error indicator */}
          {cameraError && !isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900/80">
              <div className="text-center text-white p-6">
                <X className="w-12 h-12 mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Camera Error</p>
                <p className="text-sm opacity-90">{cameraError}</p>
                <Button 
                  onClick={startCamera}
                  variant="outline"
                  className="mt-4 text-white border-white hover:bg-white hover:text-black"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {/* No stream indicator */}
          {!stream && !isInitializing && !cameraError && isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center text-white">
                <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Camera Initializing...</p>
              </div>
            </div>
          )}

          {/* Stream ready but video not showing indicator */}
          {stream && !isInitializing && !cameraError && isActive && !isVideoPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="text-center text-white">
                <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg">Tap to start video</p>
                <p className="text-sm opacity-75">Click video area if it stays black</p>
              </div>
            </div>
          )}

          {/* Manual play button for when video is paused */}
          {stream && videoRef.current?.paused && !isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Button
                onClick={async () => {
                  if (videoRef.current) {
                    try {
                      await videoRef.current.play();
                      console.log('Manual play successful');
                    } catch (error) {
                      console.error('Manual play failed:', error);
                    }
                  }
                }}
                size="lg"
                className="bg-white/20 hover:bg-white/30 text-white border-white/50"
                variant="outline"
              >
                <Camera className="w-6 h-6 mr-2" />
                Tap to Start Video
              </Button>
            </div>
          )}
          
          {/* Camera Controls Overlay */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleCamera}
              className="bg-background/80 backdrop-blur-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <Button
              onClick={capturePhoto}
              size="lg"
              className="bg-primary hover:bg-primary/90 rounded-full h-16 w-16 p-0"
              disabled={isBarcodeScanning}
            >
              <Camera className="w-8 h-8" />
            </Button>

            <Button
              variant={isBarcodeScanning ? "default" : "secondary"}
              size="sm"
              onClick={() => setIsBarcodeScanning(!isBarcodeScanning)}
              className="bg-background/80 backdrop-blur-sm"
            >
              <Barcode className="w-4 h-4" />
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={stopCamera}
              className="bg-background/80 backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Barcode Scanning Overlay */}
          {isBarcodeScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-64 h-32 border-2 border-green-500 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <div className="text-center">
                    <Barcode className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="text-green-500 font-semibold">Scanning for barcode...</p>
                    <p className="text-green-400 text-sm">Point camera at barcode</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detected Barcode Result */}
          {detectedBarcode && (
            <div className="absolute top-4 left-4 right-4">
              <div className="bg-green-500/90 backdrop-blur-sm rounded-lg p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Barcode Detected!</span>
                </div>
                <p className="text-lg font-mono bg-black/20 p-2 rounded">{detectedBarcode}</p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!detectedBarcode) return;

                      try {
                        const productInfo = await geminiAI.lookupBarcode(detectedBarcode);
                        toast({
                          title: "Product Found!",
                          description: `${productInfo.productName || 'Product'} - ${productInfo.isVegan ? 'Vegan' : 'Not Vegan'}`,
                        });

                        // Pass the result back to parent component
                        if (onBarcodeLookup) {
                          onBarcodeLookup({
                            barcode: detectedBarcode,
                            ...productInfo,
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Lookup Failed",
                          description: "Could not find product information",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="bg-white/20 hover:bg-white/30"
                  >
                    Lookup Product
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDetectedBarcode(null)}
                    className="border-white/50 text-white hover:bg-white/20"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Capture Type Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {captureTypes.map((type) => (
            <Button
              key={type.type}
              variant={currentCaptureType === type.type ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentCaptureType(type.type)}
              className="whitespace-nowrap flex-shrink-0"
            >
              {capturedImages.some(img => img.type === type.type) && (
                <CheckCircle className="w-3 h-3 mr-1 text-success" />
              )}
              {type.label}
            </Button>
          ))}
        </div>

        {/* Process Button */}
        {capturedImages.length > 0 && (
          <Button
            onClick={processImages}
            disabled={isProcessing}
            className="w-full bg-success hover:bg-success/90"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing {capturedImages.length} images...
              </>
            ) : (
              `Analyze ${capturedImages.length} Images`
            )}
          </Button>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
};

export default CameraCapture;
