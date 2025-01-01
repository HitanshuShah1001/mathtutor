// apiUtils.js

// Function to make GET requests

export const getRequest = async (url, headers = {}, params = {}) => {
  const myHeaders = new Headers();

  // Append Authorization if present
  if (headers.Authorization) {
    myHeaders.append("Authorization", headers.Authorization);
  }

  // Append other headers
  for (const [key, value] of Object.entries(headers)) {
    if (key !== "Authorization") {
      myHeaders.append(key, value);
    }
  }

  // Add query parameters to URL if any
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
export const postRequest = async (url, headers = {}, body = {}) => {
  const myHeaders = new Headers();

  // Append Authorization if present
  if (headers.Authorization) {
    myHeaders.append("Authorization", headers.Authorization);
    myHeaders.append("Content-Type", "application/json");
  }

  // Append other headers
  for (const [key, value] of Object.entries(headers)) {
    if (key !== "Authorization") {
      myHeaders.append(key, value);
    }
  }

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(body),
    redirect: "follow",
  };

  try {
    const response = await fetch(url, requestOptions);
    console.log(response, "repsonse received");

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("POST request failed:", error);
  }
};

// Function to make PUT requests
export const putRequest = async (url, headers = {}, body = {}) => {
  const myHeaders = new Headers();
  
  // Append Authorization if present
  if (headers.Authorization) {
    myHeaders.append("Authorization", headers.Authorization);
  }

  // Append other headers
  for (const [key, value] of Object.entries(headers)) {
    if (key !== "Authorization") {
      myHeaders.append(key, value);
    }
  }

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
export const deleteRequest = async (url, headers = {}, params = {}) => {
  const myHeaders = new Headers();

  // Append Authorization if present
  if (headers.Authorization) {
    myHeaders.append("Authorization", headers.Authorization);
  }

  // Append other headers
  for (const [key, value] of Object.entries(headers)) {
    if (key !== "Authorization") {
      myHeaders.append(key, value);
    }
  }

  // Add query parameters to URL if any
  const queryParams = new URLSearchParams(params).toString();
  const finalUrl = queryParams ? `${url}?${queryParams}` : url;

  const requestOptions = {
    method: "DELETE",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const response = await fetch(finalUrl, requestOptions);

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("DELETE request failed:", error);
  }
};
