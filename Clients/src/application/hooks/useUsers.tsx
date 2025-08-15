import { useState, useEffect } from 'react';
import { User } from '../../domain/types/User';
import { getAllUsers } from '../repository/user.repository';
interface ApiUser {
  id: number;
  name: string;
  surname: string;
  email: string;
  role_id?: number;
}
interface ApiResponse {
  data: ApiUser[];
}

const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();

      // Convert role_id to roleId
      const formattedUsers: User[] = (response as ApiResponse).data.map((user: ApiUser): User => ({
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        roleId: user.role_id
      }));

      setUsers(formattedUsers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, refreshUsers: fetchUsers };
};

export default useUsers;