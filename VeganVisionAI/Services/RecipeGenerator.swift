import Foundation

class RecipeGenerator: ObservableObject {
    @Published var isGenerating = false
    @Published var generatedRecipe: Recipe?
    @Published var errorMessage: String?
    
    private let geminiService = GeminiAIService()
    
    func generateRecipe(
        ingredients: [String],
        mealType: String,
        cuisine: String,
        timeMinutes: Int
    ) async {
        await MainActor.run {
            isGenerating = true
            errorMessage = nil
            generatedRecipe = nil
        }
        
        do {
            let recipe = try await geminiService.generateRecipe(
                ingredients: ingredients,
                mealType: mealType,
                cuisine: cuisine,
                timeMinutes: timeMinutes
            )
            
            await MainActor.run {
                self.generatedRecipe = recipe
                self.isGenerating = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isGenerating = false
            }
        }
    }
    
    func generateRecipeFromAvailableIngredients(_ ingredients: [String]) async {
        await generateRecipe(
            ingredients: ingredients,
            mealType: "Dinner",
            cuisine: "International",
            timeMinutes: 45
        )
    }
    
    func generateQuickRecipe(timeMinutes: Int) async {
        let commonIngredients = [
            "Chickpeas", "Quinoa", "Sweet potato", "Kale", "Tofu",
            "Mushrooms", "Bell peppers", "Onions", "Garlic", "Olive oil"
        ]
        
        await generateRecipe(
            ingredients: commonIngredients,
            mealType: "Quick Meal",
            cuisine: "Fusion",
            timeMinutes: timeMinutes
        )
    }
    
    func generateHighProteinRecipe() async {
        let proteinIngredients = [
            "Tempeh", "Lentils", "Chickpeas", "Quinoa", "Hemp seeds",
            "Nutritional yeast", "Tofu", "Edamame", "Black beans"
        ]
        
        await generateRecipe(
            ingredients: proteinIngredients,
            mealType: "High Protein",
            cuisine: "International",
            timeMinutes: 60
        )
    }
    
    func generateBudgetFriendlyRecipe() async {
        let budgetIngredients = [
            "Rice", "Beans", "Potatoes", "Carrots", "Onions",
            "Cabbage", "Lentils", "Oats", "Bananas", "Peanut butter"
        ]
        
        await generateRecipe(
            ingredients: budgetIngredients,
            mealType: "Budget Friendly",
            cuisine: "International",
            timeMinutes: 45
        )
    }
    
    func generateSeasonalRecipe(for season: String) async {
        let seasonalIngredients: [String: [String]] = [
            "Spring": ["Asparagus", "Peas", "Strawberries", "Spinach", "Radishes"],
            "Summer": ["Tomatoes", "Zucchini", "Corn", "Berries", "Fresh herbs"],
            "Fall": ["Pumpkin", "Squash", "Apples", "Mushrooms", "Root vegetables"],
            "Winter": ["Citrus", "Winter squash", "Kale", "Sweet potatoes", "Nuts"]
        ]
        
        let ingredients = seasonalIngredients[season] ?? ["Seasonal vegetables", "Grains", "Legumes"]
        
        await generateRecipe(
            ingredients: ingredients,
            mealType: "Seasonal",
            cuisine: "International",
            timeMinutes: 60
        )
    }
    
    func generateRecipeForDietaryRestriction(_ restriction: String) async {
        let baseIngredients = [
            "Quinoa", "Chickpeas", "Sweet potatoes", "Kale", "Avocado",
            "Nuts", "Seeds", "Legumes", "Whole grains", "Fresh vegetables"
        ]
        
        // For now, we'll use a basic recipe generation
        // In a full implementation, this would use a more sophisticated prompt
        await generateRecipe(
            ingredients: baseIngredients,
            mealType: "Special Diet",
            cuisine: "International",
            timeMinutes: 45
        )
    }
    
    func saveGeneratedRecipe(_ recipe: Recipe) {
        // Save to local storage or user's recipe collection
        // This would integrate with a data persistence layer
        print("Saving recipe: \(recipe.title)")
    }
    
    func shareGeneratedRecipe(_ recipe: Recipe) {
        // Generate shareable content for the recipe
        let shareText = """
        Check out this vegan recipe I generated with Vegan Vision AI!
        
        \(recipe.title)
        \(recipe.shortDescription)
        
        Time: \(recipe.formattedTime)
        Difficulty: \(recipe.difficulty.rawValue)
        
        #VeganVisionAI #VeganRecipes #PlantBased
        """
        
        // In a real app, this would use UIActivityViewController
        print("Share text: \(shareText)")
    }
}

// MARK: - Recipe Generation Prompts

extension RecipeGenerator {
    private func createAdvancedPrompt(
        ingredients: [String],
        mealType: String,
        cuisine: String,
        timeMinutes: Int,
        additionalRequirements: [String] = []
    ) -> String {
        var prompt = """
        Create a delicious, nutritious vegan recipe using these ingredients:
        \(ingredients.joined(separator: ", "))
        
        Requirements:
        - Meal Type: \(mealType)
        - Cuisine Style: \(cuisine)
        - Maximum Time: \(timeMinutes) minutes
        - Must be 100% vegan with no animal products
        - Include complete nutritional information
        - Provide clear, step-by-step cooking instructions
        - Ensure the recipe is practical and achievable
        """
        
        if !additionalRequirements.isEmpty {
            prompt += "\n\nAdditional Requirements:\n"
            for requirement in additionalRequirements {
                prompt += "- \(requirement)\n"
            }
        }
        
        prompt += """
        
        Please provide the recipe in this exact JSON format:
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
        Ensure all measurements are clear and the instructions are easy to follow.
        """
        
        return prompt
    }
}

// MARK: - Recipe Validation

extension RecipeGenerator {
    func validateRecipe(_ recipe: Recipe) -> [String] {
        var issues: [String] = []
        
        if recipe.title.isEmpty {
            issues.append("Recipe title is missing")
        }
        
        if recipe.ingredients.isEmpty {
            issues.append("Recipe has no ingredients")
        }
        
        if recipe.steps.isEmpty {
            issues.append("Recipe has no cooking steps")
        }
        
        if recipe.timeMinutes <= 0 {
            issues.append("Invalid cooking time")
        }
        
        if recipe.servings <= 0 {
            issues.append("Invalid number of servings")
        }
        
        return issues
    }
    
    func isRecipeComplete(_ recipe: Recipe) -> Bool {
        return validateRecipe(recipe).isEmpty
    }
}
