import SwiftUI

struct MealPlannerView: View {
    @StateObject private var mealPlannerStore = MealPlannerStore()
    @State private var selectedDate = Date()
    @State private var showingAddMeal = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // Clean background
                Color(.systemBackground)
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 32) {
                        // Clean header
                        cleanHeader
                        
                        // Date selector
                        dateSelectorSection
                        
                        // Meal plan for selected date
                        mealPlanSection
                        
                        // Quick actions
                        quickActionsSection
                        
                        // Weekly overview
                        weeklyOverviewSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    .padding(.bottom, 120)
                }
            }
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $showingAddMeal) {
            AddMealView(selectedDate: selectedDate)
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
                
                Button(action: {}) {
                    Image(systemName: "calendar.badge.plus")
                        .font(.title2)
                        .foregroundColor(.primary)
                }
            }
            
            VStack(spacing: 8) {
                Text("Meal Planning")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Text("Plan your vegan meals for the week")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }
    
    private var dateSelectorSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Select Date")
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Spacer()
            }
            
            DatePicker("", selection: $selectedDate, displayedComponents: .date)
                .datePickerStyle(GraphicalDatePickerStyle())
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(.systemBackground))
                        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
                )
        }
    }
    
    private var mealPlanSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Today's Meals")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button("Add Meal") {
                    showingAddMeal = true
                }
                .font(.subheadline)
                .foregroundColor(.green)
            }
            
            VStack(spacing: 12) {
                MealCard(
                    mealType: "Breakfast",
                    mealName: "Avocado Toast",
                    time: "8:00 AM",
                    calories: "320 cal",
                    color: .orange
                )
                
                MealCard(
                    mealType: "Lunch",
                    mealName: "Buddha Bowl",
                    time: "12:30 PM",
                    calories: "450 cal",
                    color: .green
                )
                
                MealCard(
                    mealType: "Dinner",
                    mealName: "Chickpea Curry",
                    time: "7:00 PM",
                    calories: "380 cal",
                    color: .blue
                )
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
                    title: "Generate Plan",
                    icon: "sparkles",
                    color: .green
                )
                
                QuickActionCard(
                    title: "Shopping List",
                    icon: "cart.fill",
                    color: .blue
                )
                
                QuickActionCard(
                    title: "Favorites",
                    icon: "heart.fill",
                    color: .pink
                )
            }
        }
    }
    
    private var weeklyOverviewSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Weekly Overview")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            HStack(spacing: 12) {
                ForEach(weekDays, id: \.day) { day in
                    WeeklyDayCard(day: day)
                }
            }
        }
    }
    
    private let weekDays = [
        WeeklyDay(day: "Mon", date: "4", isToday: false),
        WeeklyDay(day: "Tue", date: "5", isToday: false),
        WeeklyDay(day: "Wed", date: "6", isToday: true),
        WeeklyDay(day: "Thu", date: "7", isToday: false),
        WeeklyDay(day: "Fri", date: "8", isToday: false),
        WeeklyDay(day: "Sat", date: "9", isToday: false),
        WeeklyDay(day: "Sun", date: "10", isToday: false)
    ]
}

struct MealCard: View {
    let mealType: String
    let mealName: String
    let time: String
    let calories: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            // Meal type indicator
            VStack(spacing: 4) {
                Circle()
                    .fill(color)
                    .frame(width: 12, height: 12)
                
                Text(mealType)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(mealName)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                HStack(spacing: 12) {
                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                            .font(.caption)
                        Text(time)
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                    
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .font(.caption)
                        Text(calories)
                            .font(.caption)
                    }
                    .foregroundColor(.orange)
                }
            }
            
            Spacer()
            
            Button(action: {}) {
                Image(systemName: "ellipsis")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
        )
    }
}


struct WeeklyDayCard: View {
    let day: WeeklyDay
    
    var body: some View {
        VStack(spacing: 8) {
            Text(day.day)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
            
            Text(day.date)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(day.isToday ? .white : .primary)
                .frame(width: 32, height: 32)
                .background(
                    Circle()
                        .fill(day.isToday ? Color.green : Color.clear)
                )
        }
        .frame(maxWidth: .infinity)
    }
}

struct AddMealView: View {
    let selectedDate: Date
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Add Meal")
                    .font(.title2)
                    .fontWeight(.bold)
                    .padding()
                
                Spacer()
                
                Text("Meal addition functionality would go here")
                    .foregroundColor(.secondary)
                
                Spacer()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct WeeklyDay {
    let day: String
    let date: String
    let isToday: Bool
}

#Preview {
    MealPlannerView()
}