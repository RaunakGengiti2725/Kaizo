import Foundation

class ProductLookupService: ObservableObject {
    func lookupProductByBarcode(_ barcode: String) async -> ProductData? {
        // Simulate API call delay
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        
        // Return sample data for now
        return ProductData(
            productName: "Sample Product",
            brand: "Sample Brand",
            imageUrl: nil,
            ingredientsText: "Water, sugar, natural flavors",
            ecoscoreScore: 75
        )
    }
}

struct ProductData {
    let productName: String
    let brand: String
    let imageUrl: String?
    let ingredientsText: String
    let ecoscoreScore: Int
}
