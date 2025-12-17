/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from "react";
import { getAllEntities } from "../../application/repository/entity.repository";

export interface User {
  id: number;
  name: string;
  surname: string;
  [key: string]: any;
}

export const useUserMap = () => {
  const [users, setUsers] = useState<User[]>([]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getAllEntities({ routeUrl: "/users" });
        if (res?.data) setUsers(res.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Create a mapping of user IDs to full names
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((user) => {
      map.set(user.id.toString(), `${user.name} ${user.surname}`.trim());
    });
    return map;
  }, [users]);

  return { users, userMap };
};
