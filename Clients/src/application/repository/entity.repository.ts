import { apiServices } from "../../infrastructure/api/networkServices";

const routeAddress = process.env.BASE_URL || "http://localhost:3000";

/**
 * Creates a new user by sending a POST request to the specified route URL with the provided body.
 *
 * @param {Object} params - The parameters for creating a new user.
 * @param {string} [params.routeUrl] - The route URL to which the POST request will be sent.
 * @param {any} params.body - The body of the POST request containing user details.
 * @returns {Promise<any>} A promise that resolves to the response data of the created user.
 * @throws Will throw an error if the user creation fails.
 */
export async function createNewUser({
  routeUrl,
  body,
}: {
  routeUrl?: string;
  body: any;
}): Promise<any> {
  try {
    const response = await apiServices.post(routeAddress + routeUrl, body);
    console.log(
      `The entity with the following details is created: ${response.data}`
    );
    return response.data;
  } catch (error) {
    console.error("Error creating new user:", error);
    throw error;
  }
}

/**
 * Retrieves a user by their ID from the specified route URL.
 *
 * @param {Object} params - The parameters for the request.
 * @param {string} params.routeUrl - The URL route to fetch the user data from.
 * @returns {Promise<any>} The user data retrieved from the API.
 * @throws Will throw an error if the request fails.
 */
export async function getUserById({
  routeUrl,
}: {
  routeUrl: string;
}): Promise<any> {
  try {
    const response = await apiServices.get(routeAddress + routeUrl);
    return response.data;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    throw error;
  }
}

/**
 * Updates a user entity by its ID.
 *
 * @param {Object} params - The parameters for the update operation.
 * @param {string} params.routeUrl - The URL route for the update request.
 * @param {any} params.body - The request body containing the update details.
 * @returns {Promise<any>} The updated entity data.
 * @throws Will throw an error if the update operation fails.
 */
export async function updateUserById({
  routeUrl,
  body,
}: {
  routeUrl: string;
  body: any;
}): Promise<any> {
  try {
    const response = await apiServices.patch(routeAddress + routeUrl, body);
    console.log(
      `The entity with the following details is updated: ${response.data}`
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user by ID:", error);
    throw error;
  }
}

/**
 * Deletes a user by their ID.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.routeUrl - The URL route to delete the user.
 * @returns {Promise<any>} The response data from the delete operation.
 * @throws Will throw an error if the delete operation fails.
 */
export async function deleteUserById({
  routeUrl,
}: {
  routeUrl: string;
}): Promise<any> {
  try {
    const response = await apiServices.delete(routeAddress + routeUrl);
    console.log(
      `The entity with the following details is removed: ${response.data}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting user by ID:", error);
    throw error;
  }
}

/**
 * Fetches all users from the API.
 *
 * @returns {Promise<any>} A promise that resolves to the data of all users.
 * @throws Will throw an error if the API request fails.
 */
export async function getAllUsers(): Promise<any> {
  try {
    const response = await apiServices.get(routeAddress);
    return response.data;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
}
