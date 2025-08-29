// Centralized style tokens for Bias & Fairness UI
// Reuse these with `sx={styles.token}` to keep the component clean and consistent

export const styles = {
  // Typography
  sectionTitle: { fontWeight: 600, mb: 4, color: "#13715B", fontSize: "1rem" },
  dialogDescription: { color: "#6B7280", fontSize: "0.875rem", lineHeight: 1.5 },
  subLabel: { mb: 1, color: "#374151", fontSize: "0.875rem", fontWeight: 500 },
  smallLabel: { mb: 1, color: "#6B7280", fontSize: "0.75rem" },
  helperMuted: { mb: 2, color: "#6B7280", fontSize: "0.75rem", fontStyle: "italic" },
  advancedLabel: { mb: 1, color: "#374151", fontSize: "0.75rem", fontWeight: 500 },

  // Inputs
  inputSmall: { "& .MuiInputBase-input": { fontSize: "0.8rem", padding: "8px 12px" } },

  // Layout grids
  gridCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 },
  gridAutoFit250: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3 },
  gridAutoFit200: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 },

  // Buttons
  createButton: { backgroundColor: "#13715B", color: "white", textTransform: "none", fontSize: "0.875rem", fontWeight: 500, padding: "8px 20px", borderRadius: "6px" },
  primaryButton: { backgroundColor: "#13715B", color: "white", textTransform: "none", fontSize: "0.875rem", fontWeight: 500, padding: "8px 24px" },
  outlinedButton: { borderColor: "#13715B", color: "#13715B", textTransform: "none", fontSize: "0.875rem" },

  // Surfaces
  card: { border: "1px solid #E5E7EB", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" },
  emptyPaper: { p: 4, textAlign: "center", color: "#6B7280", backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" },
};


