import Foundation

class MenuScraperService: ObservableObject {
    func scrapeVeganMenuForRestaurant(_ restaurantId: String) async -> [MenuItem]? {
        // Simulate API call delay
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        
        // Return sample menu items for now
        return [
            MenuItem(
                name: "Vegan Buddha Bowl",
                description: "Quinoa, roasted vegetables, tahini dressing",
                price: 14.99,
                category: "Main Course",
                isVegan: true,
                allergens: ["Nuts"],
                nutrition: nil
            ),
            MenuItem(
                name: "Plant-Based Burger",
                description: "Beyond Meat patty with vegan cheese",
                price: 16.99,
                category: "Main Course",
                isVegan: true,
                allergens: ["Soy"],
                nutrition: nil
            )
        ]
    }
}
