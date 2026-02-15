import axios from 'axios';

export const apiClient = axios.create({
  withCredentials: true
});

export function authHeadersForSocket() {
  return {};
}
