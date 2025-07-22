import { useEffect, useState } from "react";
import CustomAxios from "../../infrastructure/api/customAxios";

export const useIsMultiTenant = () => {
  const [isMultiTenant, setIsMultiTenant] = useState(false);

  useEffect(() => {
    const fetchOrganizationCount = async () => {
      const response = await CustomAxios.get("/organizations/exists")
      if (!response.data.data.exists || window.location.host === "app.verifywise.ai") {
        setIsMultiTenant(true);
      }
    }
    fetchOrganizationCount()
  }, []);

  return { isMultiTenant };
}
