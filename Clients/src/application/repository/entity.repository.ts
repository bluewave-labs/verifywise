import { apiServices } from "../../infrastructure/api/networkServices";
import { store } from "../redux/store"; // Adjust the import path as necessary

// Define the RootState type
type RootState = {
  auth: {
    authToken: string;
    user: string;
    userExists: boolean;
    isLoading: boolean;
    success: boolean | null;
    message: string | null;
    expirationDate: number | null;
  };
  ui: any; // You should replace 'any' with the actual UI state type
  files: any; // You should replace 'any' with the actual files state type
};

interface RequestParams {
  routeUrl: string;
  body?: any;
  signal?: AbortSignal;
  authToken?: string;
  headers?: any;
}

interface GetRequestParams extends RequestParams {
  responseType?: "json" | "blob";
}

/**
 * Retrieves the authToken from the Redux store.
 *
 * @returns {string} The authToken from the Redux store.
 */
const getAuthToken = (): string => {
  const state = store.getState() as RootState;
  return state.auth.authToken;
};

/**
 * Creates a new user by sending a POST request to the specified route URL with the provided body.
 *
 * @param {RequestParams} params - The parameters for creating a new user.
 * @returns {Promise<any>} A promise that resolves to the response data of the created user.
 * @throws Will throw an error if the user creation fails.
 */
export async function createNewUser({
  routeUrl,
  body,
  authToken = getAuthToken(),
}: RequestParams): Promise<any> {
  const response = await apiServices.post(routeUrl, body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  console.log(
    `The entity with the following details is created: ${response.data}`
  );
  return response;
}

/**
 * Logs in a user by sending a POST request to the specified route URL with the provided credentials.
 *
 * @param {RequestParams} params - The parameters for the login request.
 * @returns {Promise<any>} A promise that resolves to the response data of the logged-in user.
 * @throws Will throw an error if the login fails.
 */
export async function loginUser({
  routeUrl,
  body,
  authToken = getAuthToken(),
}: RequestParams): Promise<any> {
  try {
    const response = await apiServices.post(routeUrl, body, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response;
  } catch (error) {
    console.error("Error logging in user:", error);
    throw error;
  }
}

/**
 * Retrieves a user by their ID from the specified route URL.
 *
 * @param {RequestParams} params - The parameters for the request.
 * @returns {Promise<any>} The user data retrieved from the API.
 * @throws Will throw an error if the request fails.
 */
export async function getEntityById({
  routeUrl,
  signal,
  authToken = getAuthToken(),
  responseType = "json",
}: GetRequestParams): Promise<any> {
  try {
    const response = await apiServices.get(routeUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
      responseType,
    });
    return response.data;
  } catch (error) {
    console.error("Error getting entity by ID:", error);
    throw error;
  }
}

/**
 * Updates a user entity by its ID.
 *
 * @param {RequestParams} params - The parameters for the update operation.
 * @returns {Promise<any>} The updated entity data.
 * @throws Will throw an error if the update operation fails.
 */
export async function updateEntityById({
  routeUrl,
  body,
  authToken = getAuthToken(),
  headers,
}: RequestParams): Promise<any> {
  try {
    const response = await apiServices.patch(routeUrl, body, {
      headers: { Authorization: `Bearer ${authToken}`, ...headers },
    });
    console.log(
      `The entity with the following details is updated: ${response.data}`
    );
    return response;
  } catch (error) {
    console.error("Error updating user by ID:", error);
    throw error;
  }
}

/**
 * Deletes a user by their ID.
 *
 * @param {RequestParams} params - The parameters for the function.
 * @returns {Promise<any>} The response data from the delete operation.
 * @throws Will throw an error if the delete operation fails.
 */
export async function deleteEntityById({
  routeUrl,
  authToken = getAuthToken(),
}: RequestParams): Promise<any> {
  try {
    const response = await apiServices.delete(routeUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(
      `The entity with the following details is removed: ${response}`
    );
    return response;
  } catch (error) {
    console.error("Error deleting user by ID:", error);
    throw error;
  }
}

/**
 * Fetches all users from the API.
 *
 * @param {RequestParams} params - The parameters for the request.
 * @returns {Promise<any>} A promise that resolves to the data of all users.
 * @throws Will throw an error if the API request fails.
 */
export async function getAllEntities({
  routeUrl,
  authToken = getAuthToken(),
}: RequestParams): Promise<any> {
  console.log("getAllEntities, routeUrl : ", routeUrl);
  try {
    const response = await apiServices.get(routeUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
}

/**
 * Checks if any user exists in the database.
 *
 * @param {RequestParams} params - The parameters for the request.
 * @returns {Promise<any>} The response data indicating if a user exists.
 * @throws Will throw an error if the request fails.
 */
export async function checkUserExists({
  routeUrl,
  authToken = getAuthToken(),
}: RequestParams): Promise<any> {
  try {
    const response = await apiServices.get(routeUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log("response :::> ", response);
    return response.data;
  } catch (error) {
    console.error("Error checking if user exists:", error);
    throw error;
  }
}

/**
 * Creates demo data by sending a POST request to the autoDrivers endpoint.
 *
 * @returns {Promise<any>} A promise that resolves to the response data.
 * @throws Will throw an error if the request fails.
 */
export async function postAutoDrivers(
  authToken = getAuthToken()
): Promise<any> {
  try {
    const response = await apiServices.post("/autoDrivers", {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    return response;
  } catch (error) {
    console.error("Error creating demo data:", error);
    throw error;
  }
}

export async function resetPassword({
  routeUrl,
  body,
  authToken = getAuthToken(),
}: RequestParams): Promise<any> {
  const response = await apiServices.post(routeUrl, body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

/**
 * Fetches all users from the database.
 *
 * @param {RequestParams} params - The parameters for the request.
 * @returns {Promise<any>} A promise that resolves to the list of users.
 * @throws Will throw an error if the request fails.
 */
export async function getAllUsers({
  authToken = getAuthToken(),
}: RequestParams): Promise<any> {
  try {
    const response = await apiServices.get("/users", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
}

/**
 * Create generated reports.
 *
 * @param {RequestParams} params - The parameters for the request.
 * @returns {Promise<any>} A promise that resolves returning the generated report.
 * @throws Will throw an error if the request fails.
 */
export async function generateReport({
  routeUrl,
  body,
  signal,
  authToken = getAuthToken(),
}: RequestParams): Promise<any> {
  try { 
    const response = await apiServices.post(routeUrl, body, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
      },
      signal,
      responseType: 'blob'
    });

    return response;
  } catch (error) {
    throw error;
  }
}

export async function getAllFrameworks({
  authToken = getAuthToken(),
}: RequestParams): Promise<any> {
  const response = await apiServices.get("/frameworks", {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response.data;
}