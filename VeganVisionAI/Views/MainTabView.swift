import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Main content
                Group {
                    switch selectedTab {
                    case 0:
                        HomeView()
                    case 1:
                        ScanView()
                    case 2:
                        RecipesView()
                    case 3:
                        MapView()
                    case 4:
                        MealPlannerView()
                    default:
                        HomeView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                
                // Floating bottom navigation bar
                VStack {
                    Spacer()
                    floatingNavigationBar
                }
                .ignoresSafeArea(.container, edges: .bottom)
            }
        }
        .ignoresSafeArea(.keyboard, edges: .bottom)
    }
    
    private var floatingNavigationBar: some View {
        ZStack {
            // Main navigation bar container (skinny, doesn't touch edges)
            HStack(spacing: 0) {
                // Home tab
                TabButton(
                    icon: "house.fill",
                    title: "Home",
                    isSelected: selectedTab == 0,
                    action: { selectedTab = 0 }
                )
                
                // Recipes tab
                TabButton(
                    icon: "book.fill",
                    title: "Recipes",
                    isSelected: selectedTab == 2,
                    action: { selectedTab = 2 }
                )
                
                // Spacer for central button (maintains container size)
                Spacer()
                    .frame(width: 60, height: 60)
                
                // Map tab
                TabButton(
                    icon: "map.fill",
                    title: "Map",
                    isSelected: selectedTab == 3,
                    action: { selectedTab = 3 }
                )
                
                // Planner tab
                TabButton(
                    icon: "calendar",
                    title: "Planner",
                    isSelected: selectedTab == 4,
                    action: { selectedTab = 4 }
                )
            }
            .padding(.horizontal, 30)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 50)
                    .fill(Color(.systemGray4))
                    .overlay(
                        RoundedRectangle(cornerRadius: 50)
                            .stroke(Color(.systemGray2), lineWidth: 2)
                    )
                    .shadow(color: .black.opacity(0.15), radius: 10, x: 0, y: -5)
            )
            .padding(.horizontal, 20)
            .padding(.bottom, 8)
            
            // Central scan button as separate component
            Button(action: { selectedTab = 1 }) {
                ZStack {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 70, height: 70)
                        .shadow(color: .green.opacity(0.6), radius: 20, x: 0, y: 8)
                        .shadow(color: .green.opacity(0.3), radius: 40, x: 0, y: 16)
                    
                    Image(systemName: "camera.fill")
                        .font(.title2)
                        .foregroundColor(.white)
                }
            }
            .offset(y: -20) // moved lower
            .buttonStyle(PlainButtonStyle())
        }
    }
}

struct TabButton: View {
    let icon: String
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(isSelected ? .green : .gray)
                
                Text(title)
                    .font(.caption2)
                    .fontWeight(.medium)
                    .foregroundColor(isSelected ? .green : .gray)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct HomeView: View {
    @State private var showingSettings = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // Clean white background
                Color(.systemBackground)
                    .ignoresSafeArea()
                
                // Green splashes
                ZStack {
                    // Splash 1 - top right
                    Circle()
                        .fill(Color.green.opacity(0.08))
                        .frame(width: 200, height: 200)
                        .blur(radius: 30)
                        .offset(x: 120, y: -250)
                    
                    // Splash 2 - bottom left
                    Circle()
                        .fill(Color.green.opacity(0.06))
                        .frame(width: 180, height: 180)
                        .blur(radius: 25)
                        .offset(x: -100, y: 200)
                }
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Header section
                        headerSection
                        
                        // Quick Actions section (moved to top)
                        quickActionsSection
                        
                        // Recent Analysis section (redesigned)
                        recentAnalysisSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    .padding(.bottom, 160) // Space for floating nav bar
                }
            }
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $showingSettings) {
            SettingsView()
        }
    }
    
    private var headerSection: some View {
        HStack {
            // Kaizo logo
            HStack(spacing: 8) {
                Image("Kaizo")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 32, height: 32)
                
                Text("Kaizo")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
            }
            
            Spacer()
            
            Button(action: { showingSettings = true }) {
                Image(systemName: "line.3.horizontal")
                    .font(.title2)
                    .foregroundColor(.primary)
            }
        }
    }
    
    private var recentAnalysisSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Recent Analysis")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            // Enhanced product card
            VStack(spacing: 0) {
                // Main product info
                HStack(spacing: 16) {
                    // Product image with better styling
                    RoundedRectangle(cornerRadius: 16)
                        .fill(
                            LinearGradient(
                                colors: [Color.green.opacity(0.1), Color.green.opacity(0.05)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 80, height: 80)
                        .overlay(
                            VStack(spacing: 4) {
                                Image(systemName: "leaf.fill")
                                    .font(.title2)
                                    .foregroundColor(.green)
                                Text("100%")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.green)
                            }
                        )
                    
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Organic Almond Milk")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                        
                        Text("Silk")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        HStack(spacing: 8) {
                            ZStack {
                                Circle()
                                    .fill(Color.green)
                                    .frame(width: 12, height: 12)
                                
                                Image(systemName: "checkmark")
                                    .font(.caption2)
                                    .foregroundColor(.white)
                            }
                            
                            Text("Excellent")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(.green)
                        }
                    }
                    
                    Spacer()
                    
                    Button(action: {}) {
                        Image(systemName: "chevron.right")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                            .padding(8)
                            .background(
                                Circle()
                                    .fill(Color.gray.opacity(0.1))
                            )
                    }
                }
                .padding(20)
                
                // Divider
                Rectangle()
                    .fill(Color.gray.opacity(0.1))
                    .frame(height: 1)
                    .padding(.horizontal, 20)
                
            }
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color(.systemGray4))
                    .shadow(color: .black.opacity(0.12), radius: 12, x: 0, y: 4)
            )
        }
    }
    
    
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Quick Actions")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            HStack(spacing: 20) {
                QuickActionCard(
                    title: "Scan Product",
                    icon: "camera.fill",
                    color: .green
                )
                
                QuickActionCard(
                    title: "Find Recipe",
                    icon: "book.fill",
                    color: .blue
                )
                
                QuickActionCard(
                    title: "Restaurants",
                    icon: "map.fill",
                    color: .orange
                )
            }
        }
    }
}

struct AnalysisChip: View {
    let icon: String
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.subheadline)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(.primary)
            
            Text(value)
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(color.opacity(0.1))
        )
    }
}


struct QuickActionCard: View {
    let title: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .frame(width: 30, height: 30)
                .background(color.opacity(0.1))
                .clipShape(Circle())
            
            Text(title)
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(.primary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, minHeight: 50)
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemGray4))
                .shadow(color: .black.opacity(0.08), radius: 6, x: 0, y: 3)
        )
    }
}

#Preview {
    MainTabView()
}