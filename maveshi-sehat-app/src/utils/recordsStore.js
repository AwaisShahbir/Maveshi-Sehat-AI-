import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

let records = [];
let listeners = [];

export const getRecords = () => records;

export const loadRecords = async (ownerName) => {
  try {
    const response = await fetch(`${BASE_URL}/api/detections?ownerName=${encodeURIComponent(ownerName)}`);
    if (response.ok) {
      const data = await response.json();
      records = data;
      
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
  
  records = [record, ...records];
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
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        uploadedImageUrl = uploadData.fileUrl;
      }
    }

    
    const postRes = await fetch(`${BASE_URL}/api/detections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: record.animalId,
        ownerName: ownerName || 'Muhammad Ahmed',
        animalType: record.animalType,
        disease: record.disease,
        diseaseUrdu: record.diseaseUrdu,
        confidence: parseFloat(record.confidence.replace('%', '')),
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

export const subscribe = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};
