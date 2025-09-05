import Foundation

class UserPreferencesService: ObservableObject {
    @Published var currentPreferences: UserPreferences = UserPreferences(
        dietaryRestrictions: [],
        allergies: [],
        favoriteCuisines: [],
        preferredProteinSources: [],
        cookingSkillLevel: .intermediate,
        mealPrepPreferences: [],
        notificationSettings: NotificationSettings(
            mealReminders: true,
            recipeSuggestions: true,
            newRestaurantAlerts: false,
            weeklyMealPlan: true
        )
    )
    
    func getCurrentPreferences() async -> UserPreferences {
        return currentPreferences
    }
    
    func updatePreferences(_ preferences: UserPreferences) {
        currentPreferences = preferences
        savePreferences()
    }
    
    func getAllergyWarnings(_ userId: String?) async -> [String] {
        return currentPreferences.allergies
    }
    
    private func savePreferences() {
        // Save to UserDefaults or other storage
        print("Saving user preferences...")
    }
}
