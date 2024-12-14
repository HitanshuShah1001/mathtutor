import { ACCESS_KEY, USER } from "../constants/constants";

export const removeDataFromLocalStorage = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(USER);
};

export const addDataToLocalStorage = ({ accessToken, user }) => {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(USER, JSON.stringify({ user }));
};
