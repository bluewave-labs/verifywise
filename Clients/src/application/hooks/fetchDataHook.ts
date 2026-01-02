import { getAllEntities } from "../repository/entity.repository";

/**
 * Generic data fetching hook that retrieves entities from a specified route
 * and updates state via a setter function.
 *
 * @template T - The type of data expected from the API response
 * @param {string} routeUrl - The API endpoint to fetch data from
 * @param {function} setData - State setter function to update with fetched data
 * @returns {Promise<void>}
 *
 * @example
 * fetchData<User[]>('/users', setUsers);
 */
export const fetchData = async <T>(
  routeUrl: string,
  setData: (data: T) => void
): Promise<void> => {
  try {
    const response = await getAllEntities({ routeUrl });
    setData(response.data as T);
  } catch (error) {
    console.error(`Error fetching data from ${routeUrl}:`, error);
  }
};
