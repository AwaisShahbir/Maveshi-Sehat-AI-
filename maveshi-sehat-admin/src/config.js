export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://maveshi-sehat-api.onrender.com';

export const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    let clean = url;
    if (clean.startsWith('http://maveshi-sehat-api.onrender.com')) {
      clean = clean.replace('http://', 'https://');
    }
    if (clean.includes('10.0.2.2:5000') || clean.includes('localhost:5000') || clean.includes('127.0.0.1:5000')) {
      const part = clean.split('/uploads/')[1];
      return part ? `${API_BASE_URL}/uploads/${part}` : clean;
    }
    return clean;
  }
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default API_BASE_URL;
