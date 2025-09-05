import Foundation
import SwiftUI

class MealPlannerStore: ObservableObject {
    @Published var weeklyMeals: [String: [String: MealPlanItem]] = [:]
    @Published var shoppingList: [ShoppingListItem] = []
    @Published var savedWeeks: [String: [String: [String: MealPlanItem]]] = [:]
    
    private let userDefaults = UserDefaults.standard
    private let weeklyMealsKey = "weeklyMeals"
    private let shoppingListKey = "shoppingList"
    private let savedWeeksKey = "savedWeeks"
    
    init() {
        loadData()
    }
    
    // MARK: - Meal Management
    
    func addMeal(_ meal: MealPlanItem, for day: String, mealType: String) {
        if weeklyMeals[day] == nil {
            weeklyMeals[day] = [:]
        }
        weeklyMeals[day]?[mealType] = meal
        saveData()
        generateShoppingList()
    }
    
    func removeMeal(for day: String, mealType: String) {
        weeklyMeals[day]?[mealType] = nil
        if weeklyMeals[day]?.isEmpty == true {
            weeklyMeals[day] = nil
        }
        saveData()
        generateShoppingList()
    }
    
    func getMeal(for day: String, mealType: String) -> MealPlanItem? {
        return weeklyMeals[day]?[mealType]
    }
    
    func getMealsForDay(_ day: String) -> [String: MealPlanItem] {
        return weeklyMeals[day] ?? [:]
    }
    
    func getAllMeals() -> [MealPlanItem] {
        var allMeals: [MealPlanItem] = []
        for dayMeals in weeklyMeals.values {
            for meal in dayMeals.values {
                allMeals.append(meal)
            }
        }
        return allMeals
    }
    
    // MARK: - Week Management
    
    func clearWeek() {
        weeklyMeals.removeAll()
        shoppingList.removeAll()
        saveData()
    }
    
    func copyPreviousWeek() {
        // Copy meals from the previous week
        print("Copying previous week...")
    }
    
    func saveCurrentWeek() {
        let weekKey = getCurrentWeekKey()
        savedWeeks[weekKey] = weeklyMeals
        saveData()
    }
    
    func loadWeek(_ weekKey: String) {
        if let savedWeek = savedWeeks[weekKey] {
            weeklyMeals = savedWeek
            generateShoppingList()
            saveData()
        }
    }
    
    func getSavedWeeks() -> [String] {
        return Array(savedWeeks.keys).sorted()
    }
    
    private func getCurrentWeekKey() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let today = Date()
        let weekStart = Calendar.current.dateInterval(of: .weekOfYear, for: today)?.start ?? today
        return formatter.string(from: weekStart)
    }
    
    // MARK: - Shopping List Management
    
    func addShoppingItem(_ item: ShoppingListItem) {
        shoppingList.append(item)
        saveData()
    }
    
    func removeShoppingItem(_ item: ShoppingListItem) {
        if let index = shoppingList.firstIndex(where: { $0.id == item.id }) {
            shoppingList.remove(at: index)
            saveData()
        }
    }
    
    func toggleShoppingItem(_ item: ShoppingListItem) {
        if let index = shoppingList.firstIndex(where: { $0.id == item.id }) {
            shoppingList[index].isCompleted.toggle()
            saveData()
        }
    }
    
    func clearCompletedItems() {
        shoppingList.removeAll { $0.isCompleted }
        saveData()
    }
    
    func generateShoppingList() {
        var newShoppingList: [ShoppingListItem] = []
        let allMeals = getAllMeals()
        
        for meal in allMeals {
            if let recipe = meal.recipe {
                for ingredient in recipe.ingredients {
                    let shoppingItem = ShoppingListItem(
                        name: ingredient,
                        quantity: "1 serving",
                        category: "Ingredients",
                        isCompleted: false,
                        notes: "From \(meal.mealType.rawValue) on \(meal.day)"
                    )
                    newShoppingList.append(shoppingItem)
                }
            }
        }
        
        // Merge with existing shopping list, avoiding duplicates
        let existingItems = shoppingList.filter { !$0.isCompleted }
        let mergedItems = existingItems + newShoppingList
        
        // Remove duplicates based on name
        var uniqueItems: [ShoppingListItem] = []
        var seenNames: Set<String> = []
        
        for item in mergedItems {
            if !seenNames.contains(item.name) {
                uniqueItems.append(item)
                seenNames.insert(item.name)
            }
        }
        
        shoppingList = uniqueItems
        saveData()
    }
    
    // MARK: - Data Persistence
    
    private func saveData() {
        if let weeklyMealsData = try? JSONEncoder().encode(weeklyMeals) {
            userDefaults.set(weeklyMealsData, forKey: weeklyMealsKey)
        }
        
        if let shoppingListData = try? JSONEncoder().encode(shoppingList) {
            userDefaults.set(shoppingListData, forKey: shoppingListKey)
        }
        
        if let savedWeeksData = try? JSONEncoder().encode(savedWeeks) {
            userDefaults.set(savedWeeksData, forKey: savedWeeksKey)
        }
    }
    
    private func loadData() {
        if let weeklyMealsData = userDefaults.data(forKey: weeklyMealsKey),
           let decodedWeeklyMeals = try? JSONDecoder().decode([String: [String: MealPlanItem]].self, from: weeklyMealsData) {
            weeklyMeals = decodedWeeklyMeals
        }
        
        if let shoppingListData = userDefaults.data(forKey: shoppingListKey),
           let decodedShoppingList = try? JSONDecoder().decode([ShoppingListItem].self, from: shoppingListData) {
            shoppingList = decodedShoppingList
        }
        
        if let savedWeeksData = userDefaults.data(forKey: savedWeeksKey),
           let decodedSavedWeeks = try? JSONDecoder().decode([String: [String: [String: MealPlanItem]]].self, from: savedWeeksData) {
            savedWeeks = decodedSavedWeeks
        }
    }
    
    // MARK: - Statistics
    
    func getWeekStats() -> WeekStats {
        let allMeals = getAllMeals()
        let totalMeals = allMeals.count
        let recipesCount = allMeals.filter { $0.recipe != nil }.count
        let customMealsCount = allMeals.filter { $0.customMeal != nil }.count
        
        var totalCalories = 0
        var totalProtein = 0.0
        var totalCarbs = 0.0
        var totalFat = 0.0
        
        for meal in allMeals {
            if let recipe = meal.recipe, let nutrition = recipe.nutrition {
                totalCalories += nutrition.calories
                totalProtein += nutrition.proteinGrams
                totalCarbs += nutrition.carbsGrams
                totalFat += nutrition.fatGrams
            }
        }
        
        return WeekStats(
            totalMeals: totalMeals,
            recipesCount: recipesCount,
            customMealsCount: customMealsCount,
            totalCalories: totalCalories,
            totalProtein: totalProtein,
            totalCarbs: totalCarbs,
            totalFat: totalFat
        )
    }
    
    func getShoppingListStats() -> ShoppingListStats {
        let totalItems = shoppingList.count
        let completedItems = shoppingList.filter { $0.isCompleted }.count
        let pendingItems = totalItems - completedItems
        
        let categories = Dictionary(grouping: shoppingList, by: { $0.category })
        let categoryCounts = categories.mapValues { $0.count }
        
        return ShoppingListStats(
            totalItems: totalItems,
            completedItems: completedItems,
            pendingItems: pendingItems,
            categoryCounts: categoryCounts
        )
    }
}

// MARK: - Supporting Types

struct WeekStats {
    let totalMeals: Int
    let recipesCount: Int
    let customMealsCount: Int
    let totalCalories: Int
    let totalProtein: Double
    let totalCarbs: Double
    let totalFat: Double
}

struct ShoppingListStats {
    let totalItems: Int
    let completedItems: Int
    let pendingItems: Int
    let categoryCounts: [String: Int]
}

// MARK: - Extensions

extension MealPlanItem {
    var displayName: String {
        if let recipe = recipe {
            return recipe.title
        } else if let customMeal = customMeal {
            return customMeal
        } else {
            return "No meal planned"
        }
    }
    
    var hasNotes: Bool {
        return notes != nil && !notes!.isEmpty
    }
}

extension ShoppingListItem {
    var isHighPriority: Bool {
        return category.lowercased().contains("essential") || 
               category.lowercased().contains("fresh") ||
               category.lowercased().contains("perishable")
    }
}
