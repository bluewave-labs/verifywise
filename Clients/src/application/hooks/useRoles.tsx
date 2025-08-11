import { useState, useEffect } from 'react';
import { getAllRoles } from '../repository/role.repository';

interface Role {
  id: number;
  name: string;
  description: string;
}

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const response = await getAllRoles();
        setRoles(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const refreshRoles = async () => {
    try {
      setLoading(true);
      const response = await getAllRoles();
      setRoles(response.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { roles, loading, error, refreshRoles };
}; 