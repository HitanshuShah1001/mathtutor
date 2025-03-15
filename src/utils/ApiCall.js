// apiUtils.js

import { ACCESS_KEY } from "../constants/constants";
import { removeDataFromLocalStorage } from "./LocalStorageOps";

// Define your localStorage key for the access token.

/**
 * Helper function to build headers.
 * - Always retrieves the token from localStorage and appends it as the Authorization header.
 * - Optionally adds the "Content-Type": "application/json" header for requests sending JSON data.
 * - Merges in any additional headers (ignoring any "Authorization" key from the caller).
 */
const buildHeaders = () => {
  let myHeaders = new Headers();

  // Always add the token from localStorage as the Authorization header.
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) {
    myHeaders.append("Authorization", token);
  }

  // For POST/PUT requests, ensure the Content-Type header is set.
  myHeaders.append("Content-Type", "application/json");
  return Object.fromEntries(myHeaders.entries());
};

// Function to make GET requests
export const getRequest = async (url, params = {}) => {
  const myHeaders = buildHeaders();

  // Append query parameters to the URL if any
  const queryParams = new URLSearchParams(params).toString();
  const finalUrl = queryParams ? `${url}?${queryParams}` : url;

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const response = await fetch(finalUrl, requestOptions);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("GET request failed:", error);
  }
};

// Function to make POST requests
export const postRequest = async (url, body = {}) => {
  // Pass 'true' to include the Content-Type header.
  const myHeaders = buildHeaders();

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(body),
    redirect: "follow",
  };

  try {
    const response = await fetch(url, requestOptions);
    if (response.status === 401) {
      removeDataFromLocalStorage();
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("POST request failed:", error);
  }
};

export const postRequestWithoutStringified = async (url, body = {}) => {
  // Pass 'true' to include the Content-Type header.
  const myHeaders = buildHeaders();

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body,
    redirect: "follow",
  };

  try {
    const response = await fetch(url, requestOptions);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("POST request failed:", error);
  }
};

// Function to make PUT requests
export const putRequest = async (url, body = {}) => {
  // Pass 'true' to include the Content-Type header.
  const myHeaders = buildHeaders();

  const requestOptions = {
    method: "PUT",
    headers: myHeaders,
    body: JSON.stringify(body),
    redirect: "follow",
  };

  try {
    const response = await fetch(url, requestOptions);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("PUT request failed:", error);
  }
};

// Function to make DELETE requests
export const deleteRequest = async (url, body = {}) => {
  const myHeaders = buildHeaders();

  const requestOptions = {
    method: "DELETE",
    headers: {
      ...myHeaders,
    },
    body: JSON.stringify(body),
  };

  try {
    const response = await fetch(url, requestOptions);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("DELETE request failed:", error);
  }
};
