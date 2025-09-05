import Foundation
import CoreLocation

class GoogleMapsService: ObservableObject {
    @Published var isSearching = false
    @Published var searchResults: [Restaurant] = []
    @Published var errorMessage: String?
    
    private let apiKey: String
    private let baseURL = "https://maps.googleapis.com/maps/api/place"
    
    init() {
        self.apiKey = ProcessInfo.processInfo.environment["GOOGLE_MAPS_API_KEY"] ?? ""
    }
    
    func searchRestaurants(
        near location: CLLocationCoordinate2D,
        radius: Double = 10000,
        type: String = "restaurant",
        keyword: String? = nil
    ) async throws -> [Restaurant] {
        guard !apiKey.isEmpty else {
            throw GoogleMapsError.apiKeyMissing
        }
        
        var components = URLComponents(string: "\(baseURL)/nearbysearch/json")
        components?.queryItems = [
            URLQueryItem(name: "location", value: "\(location.latitude),\(location.longitude)"),
            URLQueryItem(name: "radius", value: "\(Int(radius))"),
            URLQueryItem(name: "type", value: type),
            URLQueryItem(name: "key", value: apiKey)
        ]
        
        if let keyword = keyword {
            components?.queryItems?.append(URLQueryItem(name: "keyword", value: keyword))
        }
        
        guard let url = components?.url else {
            throw GoogleMapsError.invalidURL
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw GoogleMapsError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw GoogleMapsError.httpError(statusCode: httpResponse.statusCode)
        }
        
        let placesResponse = try JSONDecoder().decode(PlacesResponse.self, from: data)
        
        return try await convertPlacesToRestaurants(placesResponse.results)
    }
    
    func searchRestaurantsByText(_ query: String, near location: CLLocationCoordinate2D) async throws -> [Restaurant] {
        guard !apiKey.isEmpty else {
            throw GoogleMapsError.apiKeyMissing
        }
        
        var components = URLComponents(string: "\(baseURL)/textsearch/json")
        components?.queryItems = [
            URLQueryItem(name: "query", value: query),
            URLQueryItem(name: "location", value: "\(location.latitude),\(location.longitude)"),
            URLQueryItem(name: "key", value: apiKey)
        ]
        
        guard let url = components?.url else {
            throw GoogleMapsError.invalidURL
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw GoogleMapsError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw GoogleMapsError.httpError(statusCode: httpResponse.statusCode)
        }
        
        let placesResponse = try JSONDecoder().decode(PlacesResponse.self, from: data)
        
        return try await convertPlacesToRestaurants(placesResponse.results)
    }
    
    func getRestaurantDetails(placeId: String) async throws -> RestaurantDetails {
        guard !apiKey.isEmpty else {
            throw GoogleMapsError.apiKeyMissing
        }
        
        var components = URLComponents(string: "\(baseURL)/details/json")
        components?.queryItems = [
            URLQueryItem(name: "place_id", value: placeId),
            URLQueryItem(name: "fields", value: "name,formatted_address,geometry,rating,price_level,formatted_phone_number,website,opening_hours,photos,reviews"),
            URLQueryItem(name: "key", value: apiKey)
        ]
        
        guard let url = components?.url else {
            throw GoogleMapsError.invalidURL
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw GoogleMapsError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw GoogleMapsError.httpError(statusCode: httpResponse.statusCode)
        }
        
        let detailsResponse = try JSONDecoder().decode(PlaceDetailsResponse.self, from: data)
        
        return detailsResponse.result
    }
    
    private func convertPlacesToRestaurants(_ places: [Place]) async throws -> [Restaurant] {
        var restaurants: [Restaurant] = []
        
        for place in places {
            let details = try await getRestaurantDetails(placeId: place.placeId)
            let restaurant = try createRestaurant(from: details)
            restaurants.append(restaurant)
        }
        
        return restaurants
    }
    
    private func createRestaurant(from details: RestaurantDetails) throws -> Restaurant {
        let coordinates = Coordinates(
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng
        )
        
        let restaurantType: Restaurant.RestaurantType
        if details.name.lowercased().contains("vegan") {
            restaurantType = .vegan
        } else if details.name.lowercased().contains("vegetarian") {
            restaurantType = .vegetarian
        } else {
            restaurantType = .veganFriendly
        }
        
        let priceRange: Restaurant.PriceRange
        if let priceLevel = details.priceLevel {
            switch priceLevel {
            case 1:
                priceRange = .budget
            case 2:
                priceRange = .moderate
            case 3:
                priceRange = .expensive
            case 4:
                priceRange = .luxury
            default:
                priceRange = .moderate
            }
        } else {
            priceRange = .moderate
        }
        
        let hours: [String: String] = [:]
        // Parse opening hours from details.openingHours if available
        
        return Restaurant(
            name: details.name,
            type: restaurantType,
            address: details.formattedAddress,
            coordinates: coordinates,
            rating: details.rating ?? 0.0,
            priceRange: priceRange,
            phone: details.formattedPhoneNumber,
            website: details.website,
            hours: hours,
            veganMenu: nil, // Would need to be populated separately
            photos: details.photos?.map { $0.photoReference } ?? [],
            reviews: details.reviews?.map { review in
                Review(
                    author: review.authorName,
                    rating: review.rating,
                    comment: review.text,
                    date: Date(), // Parse from review.time
                    helpful: 0
                )
            } ?? []
        )
    }
    
    func isConfigured() -> Bool {
        return !apiKey.isEmpty
    }
}

// MARK: - Response Models

struct PlacesResponse: Codable {
    let results: [Place]
    let status: String
}

struct Place: Codable {
    let placeId: String
    let name: String
    let geometry: PlaceGeometry
    let rating: Double?
    let priceLevel: Int?
    
    enum CodingKeys: String, CodingKey {
        case placeId = "place_id"
        case name
        case geometry
        case rating
        case priceLevel = "price_level"
    }
}

struct PlaceGeometry: Codable {
    let location: Location
}

struct Location: Codable {
    let lat: Double
    let lng: Double
}

struct PlaceDetailsResponse: Codable {
    let result: RestaurantDetails
    let status: String
}

struct RestaurantDetails: Codable {
    let name: String
    let formattedAddress: String
    let geometry: PlaceGeometry
    let rating: Double?
    let priceLevel: Int?
    let formattedPhoneNumber: String?
    let website: String?
    let openingHours: OpeningHours?
    let photos: [Photo]?
    let reviews: [PlaceReview]?
    
    enum CodingKeys: String, CodingKey {
        case name
        case formattedAddress = "formatted_address"
        case geometry
        case rating
        case priceLevel = "price_level"
        case formattedPhoneNumber = "formatted_phone_number"
        case website
        case openingHours = "opening_hours"
        case photos
        case reviews
    }
}

struct OpeningHours: Codable {
    let openNow: Bool
    let periods: [Period]?
    let weekdayText: [String]?
    
    enum CodingKeys: String, CodingKey {
        case openNow = "open_now"
        case periods
        case weekdayText = "weekday_text"
    }
}

struct Period: Codable {
    let open: TimeInfo
    let close: TimeInfo
}

struct TimeInfo: Codable {
    let day: Int
    let time: String
}

struct Photo: Codable {
    let photoReference: String
    let height: Int
    let width: Int
    
    enum CodingKeys: String, CodingKey {
        case photoReference = "photo_reference"
        case height
        case width
    }
}

struct PlaceReview: Codable {
    let authorName: String
    let rating: Int
    let text: String
    let time: Int
    
    enum CodingKeys: String, CodingKey {
        case authorName = "author_name"
        case rating
        case text
        case time
    }
}

// MARK: - Errors

enum GoogleMapsError: LocalizedError {
    case apiKeyMissing
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int)
    case noResults
    case parsingFailed
    
    var errorDescription: String? {
        switch self {
        case .apiKeyMissing:
            return "Google Maps API key is missing"
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let statusCode):
            return "HTTP error: \(statusCode)"
        case .noResults:
            return "No restaurants found"
        case .parsingFailed:
            return "Failed to parse response"
        }
    }
}
