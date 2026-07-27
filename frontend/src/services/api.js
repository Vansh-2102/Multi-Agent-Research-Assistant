import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || 'https://backend-gateway-ut97.onrender.com/api/v1';

const formatApiUrl = (url) => {
  let cleaned = (url || '').trim().replace(/\/+$/, '');
  if (cleaned.endsWith('/research')) {
    cleaned = cleaned.substring(0, cleaned.length - 9);
  }
  if (!cleaned.endsWith('/api/v1')) {
    if (cleaned.endsWith('/api')) {
      cleaned = `${cleaned}/v1`;
    } else {
      cleaned = `${cleaned}/api/v1`;
    }
  }
  return cleaned;
};

export const API_BASE_URL = formatApiUrl(rawUrl);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchResearch = async (topic) => {
  const response = await apiClient.post('/research', { topic });
  return response.data;
};

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/research/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const clearDocuments = async () => {
  const response = await apiClient.delete('/research/clear-docs');
  return response.data;
};

export const fetchIndexedDocs = async () => {
  const response = await apiClient.get('/research/indexed-docs');
  return response.data;
};
