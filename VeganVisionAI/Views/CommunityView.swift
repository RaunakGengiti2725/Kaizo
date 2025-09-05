import SwiftUI

struct CommunityView: View {
    @State private var selectedTab = 0
    @State private var showingNewPost = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // Clean background
                Color(.systemBackground)
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Clean header
                    cleanHeader
                    
                    // Tab selector
                    tabSelector
                    
                    // Content based on selected tab
                    contentSection
                }
            }
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $showingNewPost) {
            NewPostView()
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
                
                Button(action: { showingNewPost = true }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                        .foregroundColor(.green)
                }
            }
            
            VStack(spacing: 8) {
                Text("Community")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Text("Connect with fellow vegans")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
    }
    
    private var tabSelector: some View {
        HStack(spacing: 0) {
            ForEach(0..<3) { index in
                Button(action: { selectedTab = index }) {
                    VStack(spacing: 8) {
                        Text(tabTitles[index])
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(selectedTab == index ? .green : .secondary)
                        
                        Rectangle()
                            .fill(selectedTab == index ? Color.green : Color.clear)
                            .frame(height: 2)
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
    }
    
    private var contentSection: some View {
        ScrollView {
            VStack(spacing: 24) {
                switch selectedTab {
                case 0:
                    feedSection
                case 1:
                    recipesSection
                case 2:
                    tipsSection
                default:
                    feedSection
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 24)
            .padding(.bottom, 120)
        }
    }
    
    private var feedSection: some View {
        VStack(spacing: 16) {
            ForEach(samplePosts, id: \.id) { post in
                PostCard(post: post)
            }
        }
    }
    
    private var recipesSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Shared Recipes")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                ForEach(sharedRecipes, id: \.name) { recipe in
                    SharedRecipeCard(recipe: recipe)
                }
            }
        }
    }
    
    private var tipsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Vegan Tips")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            VStack(spacing: 12) {
                ForEach(veganTips, id: \.title) { tip in
                    TipCard(tip: tip)
                }
            }
        }
    }
    
    private let tabTitles = ["Feed", "Recipes", "Tips"]
    
    private let samplePosts = [
        SamplePost(id: 1, username: "Sarah_Vegan", content: "Just tried this amazing vegan burger recipe! 🍔", likes: 24, comments: 8),
        SamplePost(id: 2, username: "Mike_PlantBased", content: "Found a new vegan restaurant downtown. The food was incredible! 🌱", likes: 18, comments: 12),
        SamplePost(id: 3, username: "Emma_Green", content: "Meal prep Sunday! All set for the week 💚", likes: 32, comments: 15)
    ]
    
    private let sharedRecipes = [
        SharedRecipe(name: "Vegan Pasta", author: "Sarah_Vegan", rating: 4.8),
        SharedRecipe(name: "Chickpea Curry", author: "Mike_PlantBased", rating: 4.6),
        SharedRecipe(name: "Avocado Toast", author: "Emma_Green", rating: 4.9),
        SharedRecipe(name: "Smoothie Bowl", author: "Alex_Vegan", rating: 4.7)
    ]
    
    private let veganTips = [
        VeganTip(title: "Read Labels Carefully", description: "Look for hidden animal-derived ingredients like whey, casein, and gelatin."),
        VeganTip(title: "Plan Your Meals", description: "Meal planning helps ensure you get all necessary nutrients."),
        VeganTip(title: "Try New Foods", description: "Explore different plant-based proteins like tempeh, seitan, and legumes.")
    ]
}

struct PostCard: View {
    let post: SamplePost
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                // Profile picture
                Circle()
                    .fill(Color.green.opacity(0.2))
                    .frame(width: 40, height: 40)
                    .overlay(
                        Text(String(post.username.prefix(1)))
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                    )
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(post.username)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                    
                    Text("2 hours ago")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Button(action: {}) {
                    Image(systemName: "ellipsis")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            
            Text(post.content)
                .font(.subheadline)
                .foregroundColor(.primary)
                .lineLimit(nil)
            
            HStack(spacing: 20) {
                Button(action: {}) {
                    HStack(spacing: 4) {
                        Image(systemName: "heart")
                            .font(.caption)
                        Text("\(post.likes)")
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                }
                
                Button(action: {}) {
                    HStack(spacing: 4) {
                        Image(systemName: "message")
                            .font(.caption)
                        Text("\(post.comments)")
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Button(action: {}) {
                    Image(systemName: "square.and.arrow.up")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
        )
    }
}

struct SharedRecipeCard: View {
    let recipe: SharedRecipe
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Recipe image placeholder
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.gray.opacity(0.2))
                .frame(height: 120)
                .overlay(
                    Image(systemName: "photo")
                        .foregroundColor(.gray)
                        .font(.title2)
                )
            
            VStack(alignment: .leading, spacing: 4) {
                Text(recipe.name)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                    .lineLimit(1)
                
                Text("by \(recipe.author)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                HStack(spacing: 4) {
                    Image(systemName: "star.fill")
                        .font(.caption)
                        .foregroundColor(.orange)
                    Text(String(format: "%.1f", recipe.rating))
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                }
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
        )
    }
}

struct TipCard: View {
    let tip: VeganTip
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: "lightbulb.fill")
                .font(.title3)
                .foregroundColor(.yellow)
                .frame(width: 30, height: 30)
                .background(Color.yellow.opacity(0.1))
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(tip.title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Text(tip.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(3)
            }
            
            Spacer()
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
        )
    }
}

struct SamplePost {
    let id: Int
    let username: String
    let content: String
    let likes: Int
    let comments: Int
}

struct SharedRecipe {
    let name: String
    let author: String
    let rating: Double
}

struct VeganTip {
    let title: String
    let description: String
}

#Preview {
    CommunityView()
}