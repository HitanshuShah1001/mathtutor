import { ACCESS_KEY, USER } from "../constants/constants";

export const removeDataFromLocalStorage = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(USER);
};

export const addDataToLocalStorage = ({ accessToken, user }) => {
  console.log(accessToken, user);
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(USER, JSON.stringify({ user }));
};

export const getDataFromLocalStorage = () => {
  return {
    USER: localStorage.getItem(USER),
    ACCESS_KEY: localStorage.getItem(ACCESS_KEY),
  };
};
