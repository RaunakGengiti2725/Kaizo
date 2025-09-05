import Foundation
import UIKit

class GeminiAIService: ObservableObject {
    @Published var isProcessing = false
    @Published var errorMessage: String?
    
    private let apiKey: String
    private let baseURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent"
    
    init() {
        self.apiKey = ProcessInfo.processInfo.environment["GEMINI_API_KEY"] ?? ""
    }
    
    func analyzeImages(_ images: [UIImage], ingredients: String) async throws -> AIAnalysisResult {
        guard !apiKey.isEmpty else {
            throw GeminiError.apiKeyMissing
        }
        
        let imageData = try await processImages(images)
        let prompt = createAnalysisPrompt(ingredients: ingredients)
        
        let request = GeminiRequest(
            contents: [
                GeminiContent(
                    parts: [
                        GeminiPart(text: prompt),
                        GeminiPart(inlineData: GeminiInlineData(mimeType: "image/jpeg", data: imageData))
                    ]
                )
            ]
        )
        
        return try await performRequest(request)
    }
    
    func analyzeText(_ ingredients: String) async throws -> AIAnalysisResult {
        guard !apiKey.isEmpty else {
            throw GeminiError.apiKeyMissing
        }
        
        let prompt = createAnalysisPrompt(ingredients: ingredients)
        
        let request = GeminiRequest(
            contents: [
                GeminiContent(
                    parts: [
                        GeminiPart(text: prompt)
                    ]
                )
            ]
        )
        
        return try await performRequest(request)
    }
    
    func generateRecipe(
        ingredients: [String],
        mealType: String,
        cuisine: String,
        timeMinutes: Int
    ) async throws -> Recipe {
        guard !apiKey.isEmpty else {
            throw GeminiError.apiKeyMissing
        }
        
        let prompt = createRecipePrompt(
            ingredients: ingredients,
            mealType: mealType,
            cuisine: cuisine,
            timeMinutes: timeMinutes
        )
        
        let request = GeminiRequest(
            contents: [
                GeminiContent(
                    parts: [
                        GeminiPart(text: prompt)
                    ]
                )
            ]
        )
        
        let response = try await performRequest(request)
        
        return try parseRecipeFromResponse(response)
    }
    
    private func processImages(_ images: [UIImage]) async throws -> String {
        var allImageData: [Data] = []
        
        for image in images {
            guard let imageData = image.jpegData(compressionQuality: 0.8) else {
                throw GeminiError.imageProcessingFailed
            }
            allImageData.append(imageData)
        }
        
        return allImageData.map { $0.base64EncodedString() }.joined(separator: ",")
    }
    
    private func createAnalysisPrompt(ingredients: String) -> String {
        return """
        Analyze the following product ingredients for vegan/vegetarian compliance and provide detailed insights:
        
        Ingredients: \(ingredients)
        
        Please provide a comprehensive analysis in the following JSON format:
        {
            "isVegan": "vegan/not-vegan/unclear",
            "confidence": 0.0-1.0,
            "reasoning": ["reason1", "reason2"],
            "problematicIngredients": [
                {
                    "ingredient": "ingredient_name",
                    "reason": "why_it's_problematic",
                    "severity": "high/medium/low",
                    "alternatives": ["alt1", "alt2"]
                }
            ],
            "veganIngredients": ["ingredient1", "ingredient2"],
            "unclearIngredients": [
                {
                    "ingredient": "ingredient_name",
                    "reason": "why_it's_unclear",
                    "recommendation": "what_to_do"
                }
            ],
            "productInfo": {
                "brand": "brand_name",
                "productName": "product_name",
                "category": "food_category",
                "certifications": ["cert1", "cert2"]
            },
            "nutritionalInsights": {
                "proteinSources": ["source1", "source2"],
                "allergens": ["allergen1", "allergen2"],
                "additives": ["additive1", "additive2"]
            },
            "environmentalImpact": {
                "carbonFootprint": {
                    "score": 0-100,
                    "level": "low/medium/high",
                    "details": "explanation",
                    "factors": ["factor1", "factor2"]
                },
                "waterUsage": {
                    "score": 0-100,
                    "level": "low/medium/high",
                    "details": "explanation",
                    "estimatedLiters": 0.0
                },
                "packaging": {
                    "recyclable": true/false,
                    "materials": ["material1", "material2"],
                    "sustainabilityScore": 0-100
                }
            },
            "ethicalRating": {
                "overallScore": 0-100,
                "palmOil": {
                    "present": true/false,
                    "sustainable": true/false/null,
                    "certification": "cert_name",
                    "concerns": ["concern1", "concern2"]
                },
                "fairTrade": {
                    "certified": true/false,
                    "certification": "cert_name",
                    "details": "explanation"
                },
                "laborPractices": {
                    "score": 0-100,
                    "concerns": ["concern1", "concern2"],
                    "certifications": ["cert1", "cert2"]
                },
                "animalTesting": {
                    "policy": "not-tested/tested/unclear",
                    "details": "explanation"
                }
            },
            "trustScore": 0-100,
            "recommendations": ["rec1", "rec2"]
        }
        
        Focus on accuracy and provide detailed reasoning for each assessment.
        """
    }
    
    private func createRecipePrompt(
        ingredients: [String],
        mealType: String,
        cuisine: String,
        timeMinutes: Int
    ) -> String {
        return """
        Create a delicious vegan recipe using the following ingredients:
        \(ingredients.joined(separator: ", "))
        
        Requirements:
        - Meal Type: \(mealType)
        - Cuisine: \(cuisine)
        - Maximum Time: \(timeMinutes) minutes
        - Must be 100% vegan
        - Include nutritional information
        - Provide clear, step-by-step instructions
        
        Please provide the recipe in the following JSON format:
        {
            "title": "Recipe Title",
            "shortDescription": "Brief description",
            "timeMinutes": \(timeMinutes),
            "mealType": "\(mealType)",
            "proteinSource": "primary_protein_source",
            "cuisine": "\(cuisine)",
            "ingredients": ["ingredient1", "ingredient2"],
            "steps": ["step1", "step2"],
            "servings": 4,
            "nutrition": {
                "calories": 0,
                "proteinGrams": 0.0,
                "carbsGrams": 0.0,
                "fatGrams": 0.0,
                "fiberGrams": 0.0,
                "sugarGrams": 0.0
            },
            "tags": ["tag1", "tag2"],
            "difficulty": "Easy/Medium/Hard"
        }
        
        Make the recipe creative, flavorful, and suitable for the specified time constraint.
        """
    }
    
    private func performRequest(_ request: GeminiRequest) async throws -> AIAnalysisResult {
        guard let url = URL(string: "\(baseURL)?key=\(apiKey)") else {
            throw GeminiError.invalidURL
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let encoder = JSONEncoder()
        urlRequest.httpBody = try encoder.encode(request)
        
        let (data, response) = try await URLSession.shared.data(for: urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw GeminiError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw GeminiError.httpError(statusCode: httpResponse.statusCode)
        }
        
        let geminiResponse = try JSONDecoder().decode(GeminiResponse.self, from: data)
        
        guard let text = geminiResponse.candidates.first?.content.parts.first?.text else {
            throw GeminiError.noContent
        }
        
        return try parseAnalysisFromResponse(text)
    }
    
    private func parseAnalysisFromResponse(_ responseText: String) throws -> AIAnalysisResult {
        let cleanText = responseText.trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard let jsonStart = cleanText.firstIndex(of: "{"),
              let jsonEnd = cleanText.lastIndex(of: "}") else {
            throw GeminiError.invalidJSON
        }
        
        let jsonString = String(cleanText[jsonStart...jsonEnd])
        
        do {
            let data = jsonString.data(using: .utf8)!
            return try JSONDecoder().decode(AIAnalysisResult.self, from: data)
        } catch {
            throw GeminiError.parsingFailed(error.localizedDescription)
        }
    }
    
    private func parseRecipeFromResponse(_ response: AIAnalysisResult) throws -> Recipe {
        // This would need to be implemented based on the actual response structure
        // For now, returning a placeholder recipe
        return Recipe(
            title: "Generated Recipe",
            shortDescription: "AI-generated vegan recipe",
            timeMinutes: 30,
            mealType: "Dinner",
            proteinSource: "Legumes",
            cuisine: "International",
            ingredients: ["Ingredient 1", "Ingredient 2"],
            steps: ["Step 1", "Step 2"],
            servings: 4,
            nutrition: nil,
            imageURL: nil,
            tags: ["vegan", "healthy"],
            difficulty: .medium,
            isFavorite: false
        )
    }
}

// MARK: - Request/Response Models

struct GeminiRequest: Codable {
    let contents: [GeminiContent]
}

struct GeminiContent: Codable {
    let parts: [GeminiPart]
}

struct GeminiPart: Codable {
    let text: String?
    let inlineData: GeminiInlineData?
    
    init(text: String) {
        self.text = text
        self.inlineData = nil
    }
    
    init(inlineData: GeminiInlineData) {
        self.text = nil
        self.inlineData = inlineData
    }
}

struct GeminiInlineData: Codable {
    let mimeType: String
    let data: String
}

struct GeminiResponse: Codable {
    let candidates: [GeminiCandidate]
}

struct GeminiCandidate: Codable {
    let content: GeminiContent
}

// MARK: - Errors

enum GeminiError: LocalizedError {
    case apiKeyMissing
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int)
    case noContent
    case invalidJSON
    case parsingFailed(String)
    case imageProcessingFailed
    
    var errorDescription: String? {
        switch self {
        case .apiKeyMissing:
            return "Gemini API key is missing"
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let statusCode):
            return "HTTP error: \(statusCode)"
        case .noContent:
            return "No content in response"
        case .invalidJSON:
            return "Invalid JSON in response"
        case .parsingFailed(let details):
            return "Failed to parse response: \(details)"
        case .imageProcessingFailed:
            return "Failed to process image"
        }
    }
}
