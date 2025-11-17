import { useEffect, useState } from "react";
import { Stack, Typography } from "@mui/material";
import { getEntityById } from "../../../../../application/repository/entity.repository";

const NISTAIRMFGovern = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getEntityById({
          routeUrl: `/nist-ai-rmf/categories/GOVERN`,
        });
        setCategories(response.data || []);
      } catch (err) {
        console.error("Error fetching NIST AI RMF categories:", err);
        setError("Failed to fetch categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <Stack sx={{ p: 2 }}>
        <Typography>Loading categories...</Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Stack>
    );
  }

  return (
    <Stack sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        NIST AI RMF - Govern Categories
      </Typography>
      {categories.length > 0 ? (
        <Stack spacing={2}>
          {categories.map((category: any) => (
            <Stack
              key={category.id}
              sx={{ p: 2, border: "1px solid #ccc", borderRadius: 1 }}
            >
              <Typography variant="subtitle1">
                {category.title || `Category ${category.id}`}
              </Typography>
              {category.description && (
                <Typography variant="body2" color="text.secondary">
                  {category.description}
                </Typography>
              )}
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography>No categories found</Typography>
      )}
    </Stack>
  );
};

export default NISTAIRMFGovern;
