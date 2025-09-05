import SwiftUI
import AVFoundation

struct ScanView: View {
    @StateObject private var veganChecker = VeganChecker()
    @State private var showingImagePicker = false
    @State private var showingCamera = false
    @State private var showingManualInput = false
    @State private var selectedImages: [UIImage] = []
    
    var body: some View {
        NavigationView {
            ZStack {
                // Clean background
                Color(.systemBackground)
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 32) {
                        // Clean header
                        cleanHeader
                        
                        // Main scan options
                        scanOptionsSection
                        
                        // Recent scans
                        recentScansSection
                        
                        // Quick tips
                        quickTipsSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    .padding(.bottom, 120)
                }
            }
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $showingImagePicker) {
            ImagePicker(selectedImages: $selectedImages)
        }
        .sheet(isPresented: $showingCamera) {
            CameraView(selectedImages: $selectedImages)
        }
        .sheet(isPresented: $showingManualInput) {
            ManualInputView(ingredientsText: .constant(""), productName: .constant(""), brandName: .constant(""))
        }
    }
    
    private var cleanHeader: some View {
        VStack(spacing: 16) {
            HStack {
                // Kaizo logo
                HStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 32, height: 32)
                        
                        Text("K")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    }
                    
                    Text("Kaizo")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                Button(action: {}) {
                    Image(systemName: "bell")
                        .font(.title2)
                        .foregroundColor(.primary)
                }
            }
            
            VStack(spacing: 8) {
                Text("Scan your products")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Text("Discover if products are vegan-friendly")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }
    
    private var scanOptionsSection: some View {
        VStack(spacing: 20) {
            // Primary scan button
            Button(action: { showingCamera = true }) {
                VStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 80, height: 80)
                            .shadow(color: .green.opacity(0.3), radius: 8, x: 0, y: 4)
                        
                        Image(systemName: "camera.fill")
                            .font(.title)
                            .foregroundColor(.white)
                    }
                    
                    VStack(spacing: 4) {
                        Text("Scan Product")
                            .font(.headline)
                            .fontWeight(.semibold)
                            .foregroundColor(.primary)
                        
                        Text("Use camera to scan barcode or ingredients")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(24)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color(.systemBackground))
                        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
                )
            }
            .buttonStyle(PlainButtonStyle())
            
            // Secondary options
            HStack(spacing: 16) {
                ScanOptionCard(
                    title: "Gallery",
                    icon: "photo.on.rectangle",
                    color: .blue,
                    action: { showingImagePicker = true }
                )
                
                ScanOptionCard(
                    title: "Manual",
                    icon: "keyboard",
                    color: .orange,
                    action: { showingManualInput = true }
                )
            }
        }
    }
    
    private var recentScansSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Recent Scans")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button("View All") {
                    // Navigate to history
                }
                .font(.subheadline)
                .foregroundColor(.green)
            }
            
            VStack(spacing: 12) {
                ForEach(sampleScans, id: \.name) { scan in
                    RecentScanRow(scan: scan)
                }
            }
        }
    }
    
    private var quickTipsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Quick Tips")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            VStack(spacing: 12) {
                QuickTipCard(
                    title: "Look for Vegan Labels",
                    description: "Products with certified vegan labels are always safe",
                    icon: "checkmark.seal.fill",
                    color: .green
                )
                
                QuickTipCard(
                    title: "Check Ingredients",
                    description: "Watch out for hidden animal-derived ingredients",
                    icon: "eye.fill",
                    color: .blue
                )
            }
        }
    }
    
    private let sampleScans = [
        SampleScan(name: "Almond Milk", brand: "Silk", rating: "Excellent", color: .green),
        SampleScan(name: "Protein Bar", brand: "Clif", rating: "Good", color: .green),
        SampleScan(name: "Cereal", brand: "Kellogg's", rating: "Poor", color: .orange)
    ]
}

struct ScanOptionCard: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                    .frame(width: 40, height: 40)
                    .background(color.opacity(0.1))
                    .clipShape(Circle())
                
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding(20)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color(.systemBackground))
                    .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct RecentScanRow: View {
    let scan: SampleScan
    
    var body: some View {
        HStack(spacing: 16) {
            // Product image placeholder
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.gray.opacity(0.2))
                .frame(width: 50, height: 50)
                .overlay(
                    Image(systemName: "photo")
                        .foregroundColor(.gray)
                        .font(.caption)
                )
            
            VStack(alignment: .leading, spacing: 4) {
                Text(scan.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                
                Text(scan.brand)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            HStack(spacing: 8) {
                Circle()
                    .fill(scan.color)
                    .frame(width: 10, height: 10)
                
                Text(scan.rating)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(scan.color)
            }
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding(.vertical, 8)
    }
}

struct QuickTipCard: View {
    let title: String
    let description: String
    let icon: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
                .frame(width: 30, height: 30)
                .background(color.opacity(0.1))
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            Spacer()
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
        )
    }
}

struct SampleScan {
    let name: String
    let brand: String
    let rating: String
    let color: Color
}

#Preview {
    ScanView()
}