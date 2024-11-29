import { apiServices } from "../../infrastructure/api/networkServices";

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
  routeUrl: string;
  body: any;
}): Promise<any> {
  const response = await apiServices.post(routeUrl, body);
  console.log(
    `The entity with the following details is created: ${response.data}`
  );
  return response;
}

/**
 * Logs in a user by sending a POST request to the specified route URL with the provided credentials.
 *
 * @param {Object} params - The parameters for the login request.
 * @param {string} [params.routeUrl] - The route URL to which the POST request will be sent.
 * @param {any} params.body - The body of the POST request containing login credentials.
 * @returns {Promise<any>} A promise that resolves to the response data of the logged-in user.
 * @throws Will throw an error if the login fails.
 */
export async function loginUser({
  routeUrl,
  body,
}: {
  routeUrl: string;
  body: any;
}): Promise<any> {
  try {
    const response = await apiServices.post(routeUrl, body);
    return response;
  } catch (error) {
    console.error("Error logging in user:", error);
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
export async function getEntityById({
  routeUrl,
}: {
  routeUrl: string;
}): Promise<any> {
  try {
    const response = await apiServices.get(routeUrl);
    return response.data;
  } catch (error) {
    console.error("Error getting etity by ID:", error);
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
export async function updateEntityById({
  routeUrl,
  body,
}: {
  routeUrl: string;
  body: any;
}): Promise<any> {
  try {
    const response = await apiServices.patch(routeUrl, body);
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
export async function deleteEntityById({
  routeUrl,
}: {
  routeUrl: string;
}): Promise<any> {
  try {
    const response = await apiServices.delete(routeUrl);
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
 * @returns {Promise<any>} A promise that resolves to the data of all users.
 * @throws Will throw an error if the API request fails.
 */
export async function getAllEntities({
  routeUrl,
}: {
  routeUrl: string;
}): Promise<any> {
  console.log("getAllEntities, routeUrl : ", routeUrl);
  try {
    const response = await apiServices.get(routeUrl);
    console.log("response ==> ", response);
    return response.data;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
}