import { Platform } from 'react-native';

const BASE_URL = 'https://maveshi-sehat-api.onrender.com';

let records = [];
let listeners = [];

export const resolveAppImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://') || url.startsWith('data:')) {
    return url;
  }
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const getRecords = () => records;

export const loadRecords = async (ownerName) => {
  try {
    const response = await fetch(`${BASE_URL}/api/detections?ownerName=${encodeURIComponent(ownerName)}`);
    if (response.ok) {
      const data = await response.json();
      records = data.map(item => ({
        ...item,
        uri: resolveAppImageUrl(item.uri || item.imageUrl || item.image_url),
        imageUrl: resolveAppImageUrl(item.imageUrl || item.image_url || item.uri)
      }));
      
      listeners.forEach(listener => {
        try {
          listener(records);
        } catch (e) {
          console.error("Error in recordsStore listener during load:", e);
        }
      });
      return records;
    }
  } catch (error) {
    console.error("Failed to load records from backend:", error);
  }
  return records;
};

export const addRecord = async (record, ownerName) => {
  const resolvedRecord = {
    ...record,
    uri: resolveAppImageUrl(record.uri || record.imageUrl),
    imageUrl: resolveAppImageUrl(record.imageUrl || record.uri)
  };

  records = [resolvedRecord, ...records];
  listeners.forEach(listener => {
    try {
      listener(records);
    } catch (e) {
      console.error("Error in recordsStore listener during add:", e);
    }
  });

  try {
    let uploadedImageUrl = record.uri;
    if (record.uri && !record.uri.startsWith('http')) {
      const formData = new FormData();
      formData.append('license', {
        uri: record.uri,
        name: 'scan.jpg',
        type: 'image/jpeg'
      });
      const uploadRes = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        uploadedImageUrl = resolveAppImageUrl(uploadData.fileUrl);
      }
    }

    const postRes = await fetch(`${BASE_URL}/api/detections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: record.animalId,
        ownerName: ownerName || 'Farmer',
        animalType: record.animalType,
        disease: record.disease,
        diseaseUrdu: record.diseaseUrdu,
        confidence: parseFloat(String(record.confidence).replace('%', '')),
        riskLevel: record.risk === 'High Risk' ? 'High' : (record.risk === 'Medium Risk' ? 'Medium' : 'Low'),
        imageUrl: uploadedImageUrl,
        description: record.description,
        firstAid: record.firstAid,
        province: 'Punjab'
      })
    });
    
    if (postRes.ok) {
      console.log('Record saved to backend successfully');
    }
  } catch (error) {
    console.error("Failed to save record to backend:", error);
  }
};

export const deleteRecord = async (recordId) => {
  records = records.filter(r => r.id !== recordId && r.animalId !== recordId);
  listeners.forEach(listener => {
    try {
      listener(records);
    } catch (e) {
      console.error("Error in recordsStore listener during delete:", e);
    }
  });

  try {
    const res = await fetch(`${BASE_URL}/api/detections/${encodeURIComponent(recordId)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (error) {
    console.error("Failed to delete record from backend:", error);
    return false;
  }
};

export const subscribe = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};
