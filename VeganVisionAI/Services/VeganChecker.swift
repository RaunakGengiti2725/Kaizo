import Foundation
import Vision
import UIKit

class VeganChecker: ObservableObject {
    @Published var isAnalyzing = false
    @Published var lastResult: VeganCheckResult?
    @Published var errorMessage: String?
    
    private let geminiService = GeminiAIService()
    private let userPreferences = UserPreferencesService()
    
    func checkVeganStatus(
        ingredients: String,
        productName: String? = nil,
        brandName: String? = nil,
        images: [UIImage]? = nil
    ) async -> VeganCheckResult? {
        await MainActor.run {
            isAnalyzing = true
            errorMessage = nil
        }
        
        do {
            let result = try await performVeganAnalysis(
                ingredients: ingredients,
                productName: productName,
                brandName: brandName,
                images: images
            )
            
            await MainActor.run {
                self.lastResult = result
                self.isAnalyzing = false
            }
            
            return result
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isAnalyzing = false
            }
            return nil
        }
    }
    
    private func performVeganAnalysis(
        ingredients: String,
        productName: String?,
        brandName: String?,
        images: [UIImage]?
    ) async throws -> VeganCheckResult {
        
        var aiAnalysis: AIAnalysisResult?
        
        if let images = images, !images.isEmpty {
            aiAnalysis = try await geminiService.analyzeImages(images, ingredients: ingredients)
        } else {
            aiAnalysis = try await geminiService.analyzeText(ingredients)
        }
        
        let result = VeganCheckResult(
            isVegan: aiAnalysis?.isVegan == "vegan",
            confidence: aiAnalysis?.confidence ?? 0.0,
            productName: productName,
            brandName: brandName,
            ingredients: parseIngredients(ingredients),
            problematicIngredients: aiAnalysis?.problematicIngredients.map { $0.ingredient } ?? [],
            proteinSources: aiAnalysis?.nutritionalInsights?.proteinSources ?? [],
            allergens: aiAnalysis?.nutritionalInsights?.allergens ?? [],
            ecoScore: calculateEcoScore(aiAnalysis),
            reasoning: aiAnalysis?.reasoning.joined(separator: ". ") ?? "Analysis completed",
            healthScore: calculateHealthScore(aiAnalysis),
            certifications: aiAnalysis?.productInfo.certifications ?? [],
            crossContactRisk: determineCrossContactRisk(aiAnalysis),
            crossContactDetails: generateCrossContactDetails(aiAnalysis),
            verificationDate: Date(),
            carbonFootprint: mapCarbonFootprint(aiAnalysis),
            ethicalRating: mapEthicalRating(aiAnalysis)
        )
        
        return result
    }
    
    private func parseIngredients(_ ingredientsText: String) -> [String] {
        return ingredientsText
            .components(separatedBy: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }
    
    private func calculateEcoScore(_ analysis: AIAnalysisResult?) -> Int? {
        guard let analysis = analysis,
              let environmentalImpact = analysis.environmentalImpact else {
            return nil
        }
        
        var score = 0
        var factors = 0
        
        if let carbonFootprint = environmentalImpact.carbonFootprint {
            score += carbonFootprint.score
            factors += 1
        }
        
        if let waterUsage = environmentalImpact.waterUsage {
            score += waterUsage.score
            factors += 1
        }
        
        if let packaging = environmentalImpact.packaging {
            score += packaging.sustainabilityScore
            factors += 1
        }
        
        return factors > 0 ? score / factors : nil
    }
    
    private func calculateHealthScore(_ analysis: AIAnalysisResult?) -> Int? {
        guard let analysis = analysis else { return nil }
        
        var score = 100
        
        if !analysis.problematicIngredients.isEmpty {
            score -= analysis.problematicIngredients.count * 10
        }
        
        if let nutritionalInsights = analysis.nutritionalInsights {
            if !nutritionalInsights.allergens.isEmpty {
                score -= nutritionalInsights.allergens.count * 15
            }
        }
        
        return max(0, min(100, score))
    }
    
    private func determineCrossContactRisk(_ analysis: AIAnalysisResult?) -> VeganCheckResult.CrossContactRisk {
        guard let analysis = analysis else { return .medium }
        
        let problematicCount = analysis.problematicIngredients.count
        let unclearCount = analysis.unclearIngredients.count
        
        if problematicCount > 3 || unclearCount > 2 {
            return .high
        } else if problematicCount > 1 || unclearCount > 1 {
            return .medium
        } else {
            return .low
        }
    }
    
    private func generateCrossContactDetails(_ analysis: AIAnalysisResult?) -> String? {
        guard let analysis = analysis else { return nil }
        
        var details: [String] = []
        
        if !analysis.problematicIngredients.isEmpty {
            details.append("Contains \(analysis.problematicIngredients.count) non-vegan ingredients")
        }
        
        if !analysis.unclearIngredients.isEmpty {
            details.append("\(analysis.unclearIngredients.count) ingredients require verification")
        }
        
        return details.isEmpty ? nil : details.joined(separator: ". ")
    }
    
    private func mapCarbonFootprint(_ analysis: AIAnalysisResult?) -> CarbonFootprint? {
        guard let analysis = analysis,
              let environmentalImpact = analysis.environmentalImpact,
              let carbonFootprint = environmentalImpact.carbonFootprint else {
            return nil
        }
        
        let grade = determineGrade(score: carbonFootprint.score)
        
        return CarbonFootprint(
            score: carbonFootprint.score,
            grade: grade,
            reasons: carbonFootprint.factors ?? []
        )
    }
    
    private func mapEthicalRating(_ analysis: AIAnalysisResult?) -> EthicalRating? {
        guard let analysis = analysis,
              let ethicalRating = analysis.ethicalRating else {
            return nil
        }
        
        return EthicalRating(
            overallScore: ethicalRating.overallScore,
            palmOil: mapPalmOilInfo(ethicalRating.palmOil),
            fairTrade: mapFairTradeInfo(ethicalRating.fairTrade),
            laborPractices: mapLaborPractices(ethicalRating.laborPractices),
            animalTesting: mapAnimalTesting(ethicalRating.animalTesting)
        )
    }
    
    private func determineGrade(score: Int) -> String {
        switch score {
        case 80...100:
            return "A"
        case 60..<80:
            return "B"
        case 40..<60:
            return "C"
        case 20..<40:
            return "D"
        default:
            return "E"
        }
    }
    
    private func mapPalmOilInfo(_ palmOil: EthicalRating.PalmOilInfo) -> EthicalRating.PalmOilInfo {
        return EthicalRating.PalmOilInfo(
            present: palmOil.present,
            sustainable: palmOil.sustainable,
            certification: palmOil.certification,
            concerns: palmOil.concerns
        )
    }
    
    private func mapFairTradeInfo(_ fairTrade: EthicalRating.FairTradeInfo) -> EthicalRating.FairTradeInfo {
        return EthicalRating.FairTradeInfo(
            certified: fairTrade.certified,
            certification: fairTrade.certification,
            details: fairTrade.details
        )
    }
    
    private func mapLaborPractices(_ labor: EthicalRating.LaborPractices) -> EthicalRating.LaborPractices {
        return EthicalRating.LaborPractices(
            score: labor.score,
            concerns: labor.concerns,
            certifications: labor.certifications
        )
    }
    
    private func mapAnimalTesting(_ animalTesting: EthicalRating.AnimalTesting) -> EthicalRating.AnimalTesting {
        return EthicalRating.AnimalTesting(
            policy: animalTesting.policy,
            details: animalTesting.details
        )
    }
}


