import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var userName = "Alex"
    @State private var notificationsEnabled = true
    @State private var darkModeEnabled = false
    @State private var locationEnabled = true
    
    var body: some View {
        NavigationView {
            ZStack {
                // Custom gradient background
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(red: 0.1, green: 0.8, blue: 0.4),
                        Color(red: 0.05, green: 0.6, blue: 0.3)
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        profileSection
                        preferencesSection
                        accountSection
                        aboutSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                    .fontWeight(.semibold)
                }
            }
        }
    }
    
    private var profileSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Profile")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                
                Spacer()
            }
            
            HStack(spacing: 16) {
                // Profile picture
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.2))
                        .frame(width: 60, height: 60)
                    
                    Text(String(userName.prefix(1)).uppercased())
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    TextField("Enter your name", text: $userName)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .textFieldStyle(PlainTextFieldStyle())
                    
                    Text("Tap to edit your name")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                }
                
                Spacer()
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white.opacity(0.15))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                )
        )
    }
    
    private var preferencesSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Preferences")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                
                Spacer()
            }
            
            VStack(spacing: 12) {
                SettingToggleRow(
                    icon: "bell.fill",
                    title: "Notifications",
                    subtitle: "Get alerts for new features",
                    isOn: $notificationsEnabled,
                    color: Color(red: 0.9, green: 0.3, blue: 0.5)
                )
                
                SettingToggleRow(
                    icon: "moon.fill",
                    title: "Dark Mode",
                    subtitle: "Use dark theme",
                    isOn: $darkModeEnabled,
                    color: Color(red: 0.6, green: 0.4, blue: 0.9)
                )
                
                SettingToggleRow(
                    icon: "location.fill",
                    title: "Location Services",
                    subtitle: "Find nearby restaurants",
                    isOn: $locationEnabled,
                    color: Color(red: 1.0, green: 0.7, blue: 0.2)
                )
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white.opacity(0.15))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                )
        )
    }
    
    private var accountSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Account")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                
                Spacer()
            }
            
            VStack(spacing: 12) {
                SettingRow(
                    icon: "person.fill",
                    title: "Edit Profile",
                    subtitle: "Update your information",
                    color: Color(red: 0.2, green: 0.8, blue: 0.6)
                )
                
                SettingRow(
                    icon: "lock.fill",
                    title: "Privacy",
                    subtitle: "Manage your data",
                    color: Color(red: 0.9, green: 0.3, blue: 0.5)
                )
                
                SettingRow(
                    icon: "shield.fill",
                    title: "Security",
                    subtitle: "Password and authentication",
                    color: Color(red: 0.6, green: 0.4, blue: 0.9)
                )
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white.opacity(0.15))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                )
        )
    }
    
    private var aboutSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("About")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                
                Spacer()
            }
            
            VStack(spacing: 12) {
                SettingRow(
                    icon: "info.circle.fill",
                    title: "App Version",
                    subtitle: "1.0.0",
                    color: Color(red: 0.2, green: 0.8, blue: 0.6)
                )
                
                SettingRow(
                    icon: "questionmark.circle.fill",
                    title: "Help & Support",
                    subtitle: "Get help and contact us",
                    color: Color(red: 1.0, green: 0.7, blue: 0.2)
                )
                
                SettingRow(
                    icon: "hand.thumbsup.fill",
                    title: "Rate App",
                    subtitle: "Share your feedback",
                    color: Color(red: 0.9, green: 0.3, blue: 0.5)
                )
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white.opacity(0.15))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                )
        )
    }
}

struct SettingToggleRow: View {
    let icon: String
    let title: String
    let subtitle: String
    @Binding var isOn: Bool
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
                .frame(width: 30, height: 30)
                .background(Color.white.opacity(0.15))
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.headline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.7))
            }
            
            Spacer()
            
            Toggle("", isOn: $isOn)
                .toggleStyle(SwitchToggleStyle(tint: color))
        }
        .padding(.vertical, 8)
    }
}

struct SettingRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
                .frame(width: 30, height: 30)
                .background(Color.white.opacity(0.15))
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.headline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.7))
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.white.opacity(0.5))
        }
        .padding(.vertical, 8)
    }
}

#Preview {
    SettingsView()
}
