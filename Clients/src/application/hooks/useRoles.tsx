import { useState, useEffect } from 'react';
import { getEntityById } from '../repository/entity.repository';
import { Role } from '../../domain/types/Role';

/**
 * Custom hook to fetch and manage user roles.
 *
 * @returns {Object} An object containing:
 *   - `roles` {Role[]} - The list of available roles
 *   - `loading` {boolean} - Loading state
 *   - `error` {Error | null} - Error object if fetch failed
 *   - `refreshRoles` {function} - Function to refetch roles
 *
 * @example
 * const { roles, loading, error, refreshRoles } = useRoles();
 */
export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const response = await getEntityById({
          routeUrl: '/roles',
        });
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
      const response = await getEntityById({
        routeUrl: '/roles',
      });
      setRoles(response.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { roles, loading, error, refreshRoles };
}; 