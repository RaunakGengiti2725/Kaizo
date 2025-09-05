# 🌱 Vegan Vision AI - iOS App

**A native iOS app that transforms how conscious consumers make food choices with AI-powered vegan detection.**

## 📱 What This Is

This is a complete conversion of the Vegan Vision AI web application to a native iOS Swift app. The app provides the same core functionality with a native, performant iOS experience:

- **Smart Product Scanning**: Barcode scanning and camera-based ingredient analysis
- **AI-Powered Analysis**: Google Gemini Pro Vision integration for ingredient verification
- **Recipe Discovery**: AI-generated vegan recipes based on available ingredients
- **Restaurant Finder**: Locate vegan-friendly dining options with detailed menus
- **Meal Planning**: Complete weekly meal planning with shopping lists
- **Community Features**: Share discoveries and connect with like-minded individuals

## 🏗️ Architecture

The app is built using modern iOS development practices:

- **SwiftUI**: Modern declarative UI framework
- **MVVM Pattern**: Clean separation of concerns
- **Combine**: Reactive programming for state management
- **Core Data**: Local data persistence
- **AVFoundation**: Camera and barcode scanning
- **MapKit**: Location services and restaurant mapping

## 🚀 Getting Started

### Prerequisites

- Xcode 15.0+
- iOS 17.0+
- macOS 14.0+
- Apple Developer Account (for device testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vegan-vision-ai
   ```

2. **Open in Xcode**
   ```bash
   open VeganVisionAI.xcodeproj
   ```

3. **Configure API Keys**
   Create a `.env` file in the project root with:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

4. **Build and Run**
   - Select your target device or simulator
   - Press `Cmd + R` to build and run

## 🔧 Configuration

### Environment Variables

The app reads API keys from environment variables. In Xcode:

1. Select your target
2. Go to "Edit Scheme"
3. Select "Run" → "Arguments"
4. Add environment variables:
   - `GEMINI_API_KEY`: Your Google Gemini Pro Vision API key
   - `GOOGLE_MAPS_API_KEY`: Your Google Maps API key

### Permissions

The app requires several permissions that are configured in `Info.plist`:

- **Camera**: For barcode scanning and ingredient analysis
- **Location**: For finding nearby restaurants
- **Photo Library**: For analyzing ingredient labels from photos
- **Microphone**: For voice input features

## 📁 Project Structure

```
VeganVisionAI/
├── AppDelegate.swift          # App lifecycle management
├── SceneDelegate.swift        # Scene-based app architecture
├── ContentView.swift          # Main app entry point
├── MainTabView.swift          # Tab-based navigation
├── Views/                     # UI Views
│   ├── ScanView.swift        # Product scanning interface
│   ├── RecipesView.swift     # Recipe discovery and generation
│   ├── MapView.swift         # Restaurant finder
│   ├── MealPlannerView.swift # Weekly meal planning
│   ├── CommunityView.swift   # Social features
│   └── BarcodeScannerView.swift # Camera integration
├── Services/                  # Business logic and API calls
│   ├── VeganChecker.swift    # Core ingredient analysis
│   ├── GeminiAIService.swift # AI integration
│   ├── RecipeGenerator.swift # Recipe creation
│   ├── MealPlannerStore.swift # Data management
│   ├── GoogleMapsService.swift # Location services
│   └── UserPreferencesService.swift # User settings
├── Models/                    # Data models
│   └── Models.swift          # Core data structures
└── Resources/                 # Assets and configuration
    ├── Assets.xcassets       # App icons and images
    └── Info.plist            # App configuration
```

## 🎯 Core Features

### 1. Smart Product Scanning
- **Barcode Scanner**: Real-time barcode detection using AVFoundation
- **Camera Integration**: Photo capture for ingredient label analysis
- **AI Analysis**: Google Gemini Pro Vision for ingredient verification
- **Results Display**: Comprehensive vegan compliance information

### 2. Recipe Discovery
- **AI Generation**: Create custom recipes based on available ingredients
- **Filtering**: Sort by meal type, cuisine, cooking time, and difficulty
- **Nutritional Info**: Complete nutritional breakdown for each recipe
- **Save & Share**: Save favorite recipes and share with the community

### 3. Restaurant Finder
- **Map Integration**: Native MapKit for location services
- **Search & Filters**: Find restaurants by type, rating, and price
- **Menu Analysis**: AI-powered menu scanning for vegan options
- **Directions**: Integrated navigation to selected restaurants

### 4. Meal Planning
- **Weekly Planner**: Visual weekly meal organization
- **Shopping Lists**: Auto-generated shopping lists from meal plans
- **Recipe Integration**: Drag-and-drop recipe assignment
- **Export Options**: Share meal plans and shopping lists

### 5. Community Features
- **Social Feed**: Share discoveries and connect with users
- **Recipe Sharing**: Post and discover community recipes
- **User Profiles**: Personalized user experience
- **Trending Topics**: Discover popular vegan topics

## 🔌 API Integrations

### Google Gemini Pro Vision
- **Purpose**: Ingredient analysis and recipe generation
- **Features**: Multi-modal analysis (text + images)
- **Response Format**: Structured JSON with confidence scoring

### Google Maps API
- **Purpose**: Restaurant search and location services
- **Features**: Nearby search, place details, reviews
- **Integration**: Native MapKit with custom overlays

## 🎨 UI/UX Design

The app follows Apple's Human Interface Guidelines with:

- **Dark Mode Support**: Automatic theme switching
- **Accessibility**: VoiceOver and Dynamic Type support
- **Haptic Feedback**: Tactile responses for better engagement
- **Smooth Animations**: 60fps animations using SwiftUI
- **Responsive Design**: Optimized for all iOS device sizes

## 🧪 Testing

### Unit Tests
- Service layer testing
- Data model validation
- API response parsing

### UI Tests
- User flow validation
- Accessibility testing
- Cross-device compatibility

### Manual Testing
- Camera functionality
- Location services
- API integrations

## 📱 Device Support

- **iOS Version**: 17.0+
- **Devices**: iPhone and iPad
- **Orientations**: Portrait and landscape
- **Accessibility**: VoiceOver, Dynamic Type, Reduce Motion

## 🚀 Deployment

### App Store Preparation
1. **Code Signing**: Configure with your Apple Developer account
2. **App Icons**: Generate all required icon sizes
3. **Screenshots**: Create device-specific screenshots
4. **Metadata**: Prepare app description and keywords

### TestFlight
1. **Archive**: Build release version
2. **Upload**: Submit to App Store Connect
3. **Testing**: Invite beta testers via TestFlight

## 🔒 Security & Privacy

- **API Key Management**: Environment-based configuration
- **Data Privacy**: Local storage for user preferences
- **Camera Permissions**: Explicit user consent
- **Location Services**: Optional and user-controlled

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔮 Future Enhancements

- **Offline Mode**: Enhanced offline functionality
- **Voice Commands**: Siri integration
- **Apple Watch**: Companion app for quick scanning
- **Machine Learning**: On-device ingredient recognition
- **Social Features**: Enhanced community interactions

---

**Built with ❤️ for the vegan community**
