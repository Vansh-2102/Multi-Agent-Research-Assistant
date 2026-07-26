import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

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
