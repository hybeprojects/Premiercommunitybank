const axios = require('axios');

const client = axios.create({
  baseURL: process.env.FINERACT_BASE_URL,
  timeout: 10000
});

client.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers['Fineract-Platform-TenantId'] = process.env.FINERACT_TENANT;
  const username = process.env.FINERACT_USERNAME;
  const password = process.env.FINERACT_PASSWORD;
  const basic = Buffer.from(`${username}:${password}`).toString('base64');
  config.headers['Authorization'] = `Basic ${basic}`;
  return config;
});

async function getClientById(clientId) {
  const { data } = await client.get(`/clients/${clientId}`);
  return data;
}

async function getClientAccounts(clientId) {
  const { data } = await client.get(`/clients/${clientId}/accounts`);
  return data;
}

module.exports = { client, getClientById, getClientAccounts };
