import Foundation
import SwiftUI

// MARK: - Core Models

struct VeganCheckResult: Identifiable, Codable {
    let id = UUID()
    let isVegan: Bool
    let confidence: Double
    let productName: String?
    let brandName: String?
    let ingredients: [String]
    let problematicIngredients: [String]
    let proteinSources: [String]
    let allergens: [String]
    let ecoScore: Int?
    let reasoning: String
    let healthScore: Int?
    let certifications: [String]
    let crossContactRisk: CrossContactRisk
    let crossContactDetails: String?
    let verificationDate: Date
    let carbonFootprint: CarbonFootprint?
    let ethicalRating: EthicalRating?
    
    enum CrossContactRisk: String, CaseIterable, Codable {
        case low = "low"
        case medium = "medium"
        case high = "high"
    }
}

struct CarbonFootprint: Codable {
    let score: Int
    let grade: String
    let reasons: [String]
}

struct EthicalRating: Codable {
    let overallScore: Int
    let palmOil: PalmOilInfo
    let fairTrade: FairTradeInfo
    let laborPractices: LaborPractices
    let animalTesting: AnimalTesting
    
    struct PalmOilInfo: Codable {
        let present: Bool
        let sustainable: Bool?
        let certification: String?
        let concerns: [String]
    }
    
    struct FairTradeInfo: Codable {
        let certified: Bool
        let certification: String?
        let details: String?
    }
    
    struct LaborPractices: Codable {
        let score: Int
        let concerns: [String]
        let certifications: [String]
    }
    
    struct AnimalTesting: Codable {
        let policy: String
        let details: String?
    }
}

struct Recipe: Identifiable, Codable {
    let id = UUID()
    let title: String
    let shortDescription: String
    let timeMinutes: Int
    let mealType: String
    let proteinSource: String
    let cuisine: String
    let ingredients: [String]
    let steps: [String]
    let servings: Int
    let nutrition: NutritionInfo?
    let imageURL: String?
    let tags: [String]
    let difficulty: Difficulty
    let isFavorite: Bool
    
    enum Difficulty: String, CaseIterable, Codable {
        case easy = "Easy"
        case medium = "Medium"
        case hard = "Hard"
    }
}

struct NutritionInfo: Codable {
    let calories: Int
    let proteinGrams: Double
    let carbsGrams: Double
    let fatGrams: Double
    let fiberGrams: Double?
    let sugarGrams: Double?
}

struct Restaurant: Identifiable, Codable {
    let id = UUID()
    let name: String
    let type: RestaurantType
    let address: String
    let coordinates: Coordinates
    let rating: Double
    let priceRange: PriceRange
    let phone: String?
    let website: String?
    let hours: [String: String]
    let veganMenu: [MenuItem]?
    let photos: [String]
    let reviews: [Review]
    
    enum RestaurantType: String, CaseIterable, Codable {
        case vegan = "vegan"
        case vegetarian = "vegetarian"
        case veganFriendly = "vegan-friendly"
    }
    
    enum PriceRange: String, CaseIterable, Codable {
        case budget = "$"
        case moderate = "$$"
        case expensive = "$$$"
        case luxury = "$$$$"
    }
}

struct MenuItem: Identifiable, Codable {
    let id = UUID()
    let name: String
    let description: String
    let price: Double
    let category: String
    let isVegan: Bool
    let allergens: [String]
    let nutrition: NutritionInfo?
}

struct Review: Identifiable, Codable {
    let id = UUID()
    let author: String
    let rating: Int
    let comment: String
    let date: Date
    let helpful: Int
}

struct Coordinates: Codable {
    let latitude: Double
    let longitude: Double
}

struct MealPlanItem: Identifiable, Codable {
    let id = UUID()
    let day: String
    let mealType: MealType
    let recipe: Recipe?
    let customMeal: String?
    let notes: String?
    
    enum MealType: String, CaseIterable, Codable {
        case breakfast = "Breakfast"
        case lunch = "Lunch"
        case dinner = "Dinner"
        case snack = "Snack"
    }
}

struct ShoppingListItem: Identifiable, Codable {
    let id = UUID()
    let name: String
    let quantity: String
    let category: String
    var isCompleted: Bool
    let notes: String?
}

struct UserPreferences: Codable {
    let dietaryRestrictions: [String]
    let allergies: [String]
    let favoriteCuisines: [String]
    let preferredProteinSources: [String]
    let cookingSkillLevel: CookingSkillLevel
    let mealPrepPreferences: [String]
    let notificationSettings: NotificationSettings
    
    enum CookingSkillLevel: String, CaseIterable, Codable {
        case beginner = "Beginner"
        case intermediate = "Intermediate"
        case advanced = "Advanced"
    }
}

struct NotificationSettings: Codable {
    let mealReminders: Bool
    let recipeSuggestions: Bool
    let newRestaurantAlerts: Bool
    let weeklyMealPlan: Bool
}

struct ScanHistoryItem: Identifiable, Codable {
    let id = UUID()
    let timestamp: Date
    let barcode: String
    let productName: String
    let brandName: String
    let isVegan: Bool
    let dietClass: String
    let healthScore: Int?
    let imageData: Data?
}

struct AIAnalysisResult: Codable {
    let isVegan: String
    let confidence: Double
    let reasoning: [String]
    let problematicIngredients: [ProblematicIngredient]
    let veganIngredients: [String]
    let unclearIngredients: [UnclearIngredient]
    let productInfo: ProductInfo
    let nutritionalInsights: NutritionalInsights?
    let environmentalImpact: EnvironmentalImpact?
    let ethicalRating: EthicalRating?
    let trustScore: Int
    let recommendations: [String]
}

struct ProblematicIngredient: Codable {
    let ingredient: String
    let reason: String
    let severity: String
    let alternatives: [String]?
}

struct UnclearIngredient: Codable {
    let ingredient: String
    let reason: String
    let recommendation: String
}

struct ProductInfo: Codable {
    let brand: String?
    let productName: String?
    let category: String?
    let certifications: [String]
}

struct NutritionalInsights: Codable {
    let proteinSources: [String]
    let allergens: [String]
    let additives: [String]
}

struct EnvironmentalImpact: Codable {
    let carbonFootprint: CarbonFootprintInfo?
    let waterUsage: WaterUsageInfo?
    let packaging: PackagingInfo?
}

struct CarbonFootprintInfo: Codable {
    let score: Int
    let level: String
    let details: String
    let factors: [String]?
}

struct WaterUsageInfo: Codable {
    let score: Int
    let level: String
    let details: String
    let estimatedLiters: Double?
}

struct PackagingInfo: Codable {
    let recyclable: Bool
    let materials: [String]
    let sustainabilityScore: Int
}

// MARK: - Enums

enum DietMode: String, CaseIterable {
    case vegan = "vegan"
    case vegetarian = "vegetarian"
    case flexitarian = "flexitarian"
}

enum ScanMode: String, CaseIterable {
    case barcode = "barcode"
    case camera = "camera"
    case manual = "manual"
}

// MARK: - Extensions

extension Recipe {
    var formattedTime: String {
        if timeMinutes < 60 {
            return "\(timeMinutes) min"
        } else {
            let hours = timeMinutes / 60
            let minutes = timeMinutes % 60
            if minutes == 0 {
                return "\(hours) hr"
            } else {
                return "\(hours) hr \(minutes) min"
            }
        }
    }
    
    var difficultyColor: Color {
        switch difficulty {
        case .easy:
            return .green
        case .medium:
            return .orange
        case .hard:
            return .red
        }
    }
}

extension Restaurant {
    var formattedRating: String {
        return String(format: "%.1f", rating)
    }
    
    var priceRangeText: String {
        return priceRange.rawValue
    }
}

extension VeganCheckResult {
    var confidenceColor: Color {
        if confidence >= 0.8 {
            return .green
        } else if confidence >= 0.6 {
            return .orange
        } else {
            return .red
        }
    }
    
    var confidenceText: String {
        return "\(Int(confidence * 100))%"
    }
}
