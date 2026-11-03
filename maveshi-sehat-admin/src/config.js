export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://maveshi-sehat-api.onrender.com';

export const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('10.0.2.2:5000') || url.includes('localhost:5000') || url.includes('127.0.0.1:5000')) {
      const part = url.split('/uploads/')[1];
      return part ? `${API_BASE_URL}/uploads/${part}` : url;
    }
    return url;
  }
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default API_BASE_URL;
