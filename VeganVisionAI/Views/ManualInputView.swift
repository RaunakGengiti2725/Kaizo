import SwiftUI

struct ManualInputView: View {
    @Binding var ingredientsText: String
    @Binding var productName: String
    @Binding var brandName: String
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                productInfoSection
                ingredientsSection
                Spacer()
            }
            .padding()
            .navigationTitle("Manual Input")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .disabled(ingredientsText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
    
    private var productInfoSection: some View {
        VStack(spacing: 16) {
            Text("Product Information")
                .font(.headline)
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            VStack(spacing: 12) {
                TextField("Product Name (Optional)", text: $productName)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                TextField("Brand Name (Optional)", text: $brandName)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }
        }
    }
    
    private var ingredientsSection: some View {
        VStack(spacing: 16) {
            Text("Ingredients")
                .font(.headline)
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            TextEditor(text: $ingredientsText)
                .frame(minHeight: 200)
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                )
            
            Text("Enter ingredients separated by commas or new lines")
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

#Preview {
    ManualInputView(
        ingredientsText: .constant(""),
        productName: .constant(""),
        brandName: .constant("")
    )
}
