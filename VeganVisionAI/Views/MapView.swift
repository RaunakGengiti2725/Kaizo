import SwiftUI
import MapKit

struct MapView: View {
    @State private var searchText = ""
    @State private var restaurants: [Restaurant] = []
    @State private var selectedRestaurant: Restaurant?
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
    )
    
    var body: some View {
        NavigationView {
            ZStack {
                // Clean background
                Color(.systemBackground)
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Clean header
                    cleanHeader
                    
                    // Search bar
                    searchBar
                    
                    // Map
                    mapSection
                    
                    // Restaurant list
                    if !restaurants.isEmpty {
                        restaurantListSection
                    }
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear {
            loadSampleRestaurants()
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
                    Image(systemName: "location.fill")
                        .font(.title2)
                        .foregroundColor(.primary)
                }
            }
            
            VStack(spacing: 8) {
                Text("Find Vegan Restaurants")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Text("Discover plant-based dining near you")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
    }
    
    private var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)
            
            TextField("Search restaurants...", text: $searchText)
                .textFieldStyle(PlainTextFieldStyle())
            
            if !searchText.isEmpty {
                Button(action: { searchText = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.secondarySystemBackground))
        )
        .padding(.horizontal, 20)
        .padding(.bottom, 16)
    }
    
    private var mapSection: some View {
        Map(coordinateRegion: $region, annotationItems: restaurants) { restaurant in
            MapAnnotation(coordinate: CLLocationCoordinate2D(latitude: restaurant.coordinates.latitude, longitude: restaurant.coordinates.longitude)) {
                Button(action: { selectedRestaurant = restaurant }) {
                    VStack {
                        Image(systemName: "leaf.fill")
                            .font(.title2)
                            .foregroundColor(.white)
                            .padding(8)
                            .background(Color.green)
                            .clipShape(Circle())
                            .shadow(radius: 4)
                        
                        Text(restaurant.name)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.black.opacity(0.7))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
        }
        .frame(height: 300)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .padding(.horizontal, 20)
    }
    
    private var restaurantListSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Nearby Restaurants")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button("View All") {
                    // Navigate to full list
                }
                .font(.subheadline)
                .foregroundColor(.green)
            }
            .padding(.horizontal, 20)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(restaurants) { restaurant in
                        RestaurantCard(restaurant: restaurant) {
                            selectedRestaurant = restaurant
                        }
                    }
                }
                .padding(.horizontal, 20)
            }
        }
        .padding(.top, 20)
    }
    
    private func loadSampleRestaurants() {
        restaurants = [
            Restaurant(
                name: "Green Earth Cafe",
                type: .vegan,
                address: "123 Main St, San Francisco, CA",
                coordinates: Coordinates(latitude: 37.7749, longitude: -122.4194),
                rating: 4.5,
                priceRange: .moderate,
                phone: "+1-555-0123",
                website: "https://greenearthcafe.com",
                hours: ["Monday": "8:00 AM - 9:00 PM"],
                veganMenu: nil,
                photos: [],
                reviews: []
            ),
            Restaurant(
                name: "Plant-Based Kitchen",
                type: .veganFriendly,
                address: "456 Oak Ave, San Francisco, CA",
                coordinates: Coordinates(latitude: 37.7849, longitude: -122.4094),
                rating: 4.2,
                priceRange: .expensive,
                phone: "+1-555-0456",
                website: "https://plantbasedkitchen.com",
                hours: ["Monday": "11:00 AM - 10:00 PM"],
                veganMenu: nil,
                photos: [],
                reviews: []
            ),
            Restaurant(
                name: "Vegan Delight",
                type: .vegan,
                address: "789 Market St, San Francisco, CA",
                coordinates: Coordinates(latitude: 37.7649, longitude: -122.4294),
                rating: 4.8,
                priceRange: .moderate,
                phone: "+1-555-0789",
                website: "https://vegandelight.com",
                hours: ["Monday": "9:00 AM - 8:00 PM"],
                veganMenu: nil,
                photos: [],
                reviews: []
            )
        ]
    }
}

struct RestaurantCard: View {
    let restaurant: Restaurant
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Restaurant image placeholder
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 200, height: 120)
                    .overlay(
                        Image(systemName: "photo")
                            .foregroundColor(.gray)
                            .font(.title2)
                    )
                
                VStack(alignment: .leading, spacing: 8) {
                    Text(restaurant.name)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                        .lineLimit(1)
                    
                    Text(restaurant.address)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                    
                    HStack(spacing: 12) {
                        HStack(spacing: 4) {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                                .font(.caption)
                            Text(String(format: "%.1f", restaurant.rating))
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(.primary)
                        }
                        
                        Text(restaurant.priceRange.rawValue)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .frame(width: 200)
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color(.systemBackground))
                    .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    MapView()
}