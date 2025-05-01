import { User } from "../../domain/types/User";

//helper function for error logging
export function getUserForLogging(user: User) {
  return {
    id: String(user.id),
    email: user.email ?? "N/A",
    firstname: user.name,
    lastname: user.surname,
  };
}
