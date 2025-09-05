import SwiftUI

struct RecipesView: View {
    @StateObject private var recipeGenerator = RecipeGenerator()
    @State private var searchText = ""
    @State private var selectedCuisine = "All"
    @State private var maxTimeMinutes: Double = 60
    @State private var showingGeneratedRecipe = false
    
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
                    VStack(spacing: 32) {
                        // Clean header
                        cleanHeader
                        
                        // Search and filters
                        searchSection
                        
                        // Featured recipes
                        featuredRecipesSection
                        
                        // Quick actions
                        quickActionsSection
                        
                        // Recipe categories
                        categoriesSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    .padding(.bottom, 160)
                }
            }
        }
        .navigationBarHidden(true)
    }
    
    private var cleanHeader: some View {
        VStack(spacing: 16) {
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
                
                Button(action: {}) {
                    Image(systemName: "magnifyingglass")
                        .font(.title2)
                        .foregroundColor(.primary)
                }
            }
            
            VStack(spacing: 8) {
                Text("Discover Vegan Recipes")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Text("Find delicious plant-based meals for any occasion")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }
    
    private var searchSection: some View {
        VStack(spacing: 16) {
            // Search bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.gray)
                
                TextField("Search recipes...", text: $searchText)
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
            
            // Generate recipe button
            Button(action: { generateRecipe() }) {
                HStack(spacing: 8) {
                    Image(systemName: "sparkles")
                        .font(.subheadline)
                    
                    Text("Generate AI Recipe")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.green)
                )
            }
            .buttonStyle(PlainButtonStyle())
        }
    }
    
    private var featuredRecipesSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Featured Recipes")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button("View All") {
                    // Navigate to all recipes
                }
                .font(.subheadline)
                .foregroundColor(.green)
            }
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(featuredRecipes, id: \.name) { recipe in
                        FeaturedRecipeCard(recipe: recipe)
                    }
                }
                .padding(.horizontal, 4)
            }
        }
    }
    
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Quick Actions")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            HStack(spacing: 16) {
                QuickActionCard(
                    title: "Breakfast",
                    icon: "sunrise.fill",
                    color: .orange
                )
                
                QuickActionCard(
                    title: "Lunch",
                    icon: "sun.max.fill",
                    color: .yellow
                )
                
                QuickActionCard(
                    title: "Dinner",
                    icon: "moon.fill",
                    color: .blue
                )
            }
        }
    }
    
    private var categoriesSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Categories")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                ForEach(recipeCategories, id: \.name) { category in
                    CategoryCard(category: category)
                }
            }
        }
    }
    
    private func generateRecipe() {
        // Generate AI recipe logic
        showingGeneratedRecipe = true
    }
    
    private let featuredRecipes = [
        FeaturedRecipe(name: "Vegan Buddha Bowl", time: "25 min", difficulty: "Easy", rating: 4.8),
        FeaturedRecipe(name: "Chickpea Curry", time: "30 min", difficulty: "Medium", rating: 4.6),
        FeaturedRecipe(name: "Avocado Toast", time: "10 min", difficulty: "Easy", rating: 4.9)
    ]
    
    private let recipeCategories = [
        RecipeCategory(name: "Smoothies", icon: "drop.fill", color: .blue),
        RecipeCategory(name: "Salads", icon: "leaf.fill", color: .green),
        RecipeCategory(name: "Pasta", icon: "fork.knife", color: .orange),
        RecipeCategory(name: "Desserts", icon: "heart.fill", color: .pink)
    ]
}

struct FeaturedRecipeCard: View {
    let recipe: FeaturedRecipe
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Recipe image placeholder
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.gray.opacity(0.2))
                .frame(width: 200, height: 120)
                .overlay(
                    Image(systemName: "photo")
                        .foregroundColor(.gray)
                        .font(.title2)
                )
            
            VStack(alignment: .leading, spacing: 4) {
                Text(recipe.name)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                    .lineLimit(2)
                
                HStack(spacing: 12) {
                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                            .font(.caption)
                        Text(recipe.time)
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                    
                    HStack(spacing: 4) {
                        Image(systemName: "star.fill")
                            .font(.caption)
                        Text(String(format: "%.1f", recipe.rating))
                            .font(.caption)
                    }
                    .foregroundColor(.orange)
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
}


struct CategoryCard: View {
    let category: RecipeCategory
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: category.icon)
                .font(.title2)
                .foregroundColor(category.color)
                .frame(width: 30, height: 30)
                .background(category.color.opacity(0.1))
                .clipShape(Circle())
            
            Text(category.name)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
        )
    }
}

struct FeaturedRecipe {
    let name: String
    let time: String
    let difficulty: String
    let rating: Double
}

struct RecipeCategory {
    let name: String
    let icon: String
    let color: Color
}

#Preview {
    RecipesView()
}