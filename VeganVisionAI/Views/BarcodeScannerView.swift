import SwiftUI
import AVFoundation

struct BarcodeScannerView: UIViewRepresentable {
    @StateObject private var scanner = BarcodeScanner()
    
    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.backgroundColor = .black
        
        scanner.delegate = context.coordinator
        scanner.setupCamera(in: view)
        
        return view
    }
    
    func updateUIView(_ uiView: UIView, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, BarcodeScannerDelegate {
        let parent: BarcodeScannerView
        
        init(_ parent: BarcodeScannerView) {
            self.parent = parent
        }
        
        func didDetectBarcode(_ code: String) {
            print("Detected barcode: \(code)")
        }
        
        func didFailWithError(_ error: Error) {
            print("Barcode scanning error: \(error)")
        }
    }
}

class BarcodeScanner: NSObject, ObservableObject {
    weak var delegate: BarcodeScannerDelegate?
    
    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var isScanning = false
    
    func setupCamera(in view: UIView) {
        guard let captureDevice = AVCaptureDevice.default(for: .video) else {
            print("Failed to get camera device")
            return
        }
        
        do {
            let input = try AVCaptureDeviceInput(device: captureDevice)
            let captureSession = AVCaptureSession()
            
            if captureSession.canAddInput(input) {
                captureSession.addInput(input)
            } else {
                print("Failed to add camera input")
                return
            }
            
            let metadataOutput = AVCaptureMetadataOutput()
            
            if captureSession.canAddOutput(metadataOutput) {
                captureSession.addOutput(metadataOutput)
                
                metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
                metadataOutput.metadataObjectTypes = [
                    .ean8,
                    .ean13,
                    .pdf417,
                    .qr,
                    .code128,
                    .code39,
                    .upce
                ]
            } else {
                print("Failed to add metadata output")
                return
            }
            
            let previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
            previewLayer.frame = view.bounds
            previewLayer.videoGravity = .resizeAspectFill
            view.layer.addSublayer(previewLayer)
            
            self.captureSession = captureSession
            self.previewLayer = previewLayer
            
            startScanning()
            
        } catch {
            print("Failed to setup camera: \(error)")
        }
    }
    
    func startScanning() {
        guard !isScanning else { return }
        
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession?.startRunning()
            DispatchQueue.main.async {
                self?.isScanning = true
            }
        }
    }
    
    func stopScanning() {
        guard isScanning else { return }
        
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession?.stopRunning()
            DispatchQueue.main.async {
                self?.isScanning = false
            }
        }
    }
    
    func toggleTorch() {
        guard let device = AVCaptureDevice.default(for: .video) else { return }
        
        do {
            try device.lockForConfiguration()
            
            if device.hasTorch {
                device.torchMode = device.torchMode == .on ? .off : .on
            }
            
            device.unlockForConfiguration()
        } catch {
            print("Failed to toggle torch: \(error)")
        }
    }
}

extension BarcodeScanner: AVCaptureMetadataOutputObjectsDelegate {
    func metadataOutput(
        _ output: AVCaptureMetadataOutput,
        didOutput metadataObjects: [AVMetadataObject],
        from connection: AVCaptureConnection
    ) {
        guard let metadataObject = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let stringValue = metadataObject.stringValue else {
            return
        }
        
        delegate?.didDetectBarcode(stringValue)
        
        // Add haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
        
        // Stop scanning temporarily to avoid multiple detections
        stopScanning()
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
            self?.startScanning()
        }
    }
}

protocol BarcodeScannerDelegate: AnyObject {
    func didDetectBarcode(_ code: String)
    func didFailWithError(_ error: Error)
}

// MARK: - Camera Permission Handler

extension BarcodeScanner {
    func requestCameraPermission(completion: @escaping (Bool) -> Void) {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            completion(true)
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async {
                    completion(granted)
                }
            }
        case .denied, .restricted:
            completion(false)
        @unknown default:
            completion(false)
        }
    }
}

// MARK: - Error Handling

enum BarcodeScannerError: LocalizedError {
    case cameraNotAvailable
    case permissionDenied
    case setupFailed
    
    var errorDescription: String? {
        switch self {
        case .cameraNotAvailable:
            return "Camera is not available on this device"
        case .permissionDenied:
            return "Camera permission is required to scan barcodes"
        case .setupFailed:
            return "Failed to setup camera for barcode scanning"
        }
    }
}
