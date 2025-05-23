import { RootState } from "../../domain/types/RootState";
import { store } from "./store";

/**
 * Retrieves the authToken from the Redux store.
 *
 * @returns {string} The authToken from the Redux store.
 */
export const getAuthToken = (): string => {
  const state = store.getState() as RootState;
  return state.auth.authToken;
};
