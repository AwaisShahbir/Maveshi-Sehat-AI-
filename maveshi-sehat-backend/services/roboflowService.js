const axios = require('axios');
const fs = require('fs');

/**
 * Cattle Disease Metadata Knowledge Base
 * Maps Roboflow inference prediction classes to veterinary clinical records,
 * Urdu translations, severity colors, detailed pathology descriptions, and field first-aid steps.
 */
const DISEASE_KNOWLEDGE_BASE = {
  'LSD': {
    name: 'Lumpy Skin Disease (LSD)',
    urdu: 'لمپی جلد کی بیماری',
    riskLevel: 'High',
    severity: 'High Severity',
    severityColor: '#FF4D4D',
    severityBg: '#FFEBEB',
    description: 'Nodular lesions and firm circumscribed lumps across the hide, high fever, enlarged superficial lymph nodes, nasal discharge, and significant drop in milk production.',
    firstAid: [
      'Isolate the infected animal immediately from the herd to prevent contagious transmission.',
      'Apply antiseptic solution (povidone-iodine 5%) gently to open, weeping, or ruptured skin nodules.',
      'Spray veterinary-approved anti-fly and anti-tick repellent in the barn to eliminate biting vectors.',
      'Administer oral electrolytes and offer fresh, soft green fodder and clean drinking water.'
    ]
  },
  'FMD': {
    name: 'Foot and Mouth Disease (FMD)',
    urdu: 'منہ کھر کی بیماری',
    riskLevel: 'High',
    severity: 'Severe Stress',
    severityColor: '#FF9500',
    severityBg: '#FFF5E5',
    description: 'Erosive vesicles and painful blisters on dental pad, tongue, muzzle, and interdigital cleft of hooves, accompanied by profuse frothy ropy salivation, lameness, and high fever.',
    firstAid: [
      'Gently wash oral lesions with mild potassium permanganate solution (1:1000) or 2% sodium bicarbonate.',
      'Apply pure honey mixed with boric acid powder to mouth blisters to soothe pain and assist healing.',
      'House the animal on clean, dry, soft straw bedding and keep hooves away from muddy standing water.',
      'Provide soft, lukewarm wheat gruel or mashes to ensure adequate caloric intake during oral soreness.'
    ]
  },
  'IBK': {
    name: 'Infectious Bovine Keratoconjunctivitis (Pinkeye)',
    urdu: 'آنکھوں کی سوزش اور سرخی (پنک آئی)',
    riskLevel: 'Medium',
    severity: 'Moderate Risk',
    severityColor: '#FFB020',
    severityBg: '#FFF8EA',
    description: 'Corneal cloudiness (opacity), excessive tearing (lacrimation), photophobia (squinting), inflamed conjunctiva, and potential corneal ulceration.',
    firstAid: [
      'Move animal to a dark, shaded stall away from direct sunlight and dust.',
      'Rinse eye gently with sterile saline or eye wash to clear discharge.',
      'Apply prescribed veterinary oxytetracycline ophthalmic ointment or eye spray.',
      'Fit face fly patches or tags to prevent flies from transmitting Moraxella bovis between animals.'
    ]
  },
  'Ringworm': {
    name: 'Ringworm (Dermatophytosis)',
    urdu: 'داد / پھپھوندی کا جلدی انفیکشن',
    riskLevel: 'Medium',
    severity: 'Medium Risk',
    severityColor: '#FFB020',
    severityBg: '#FFF8EA',
    description: 'Circular, grayish-white crusty circumscribed skin patches with hair loss (alopecia), typically concentrated around eyes, ears, and neck.',
    firstAid: [
      'Gently brush and soften surface crusts with warm soapy water without causing bleeding.',
      'Apply topical povidone-iodine (2-5%) or copper sulfate solution directly to the affected ringworm spots.',
      'Disinfect grooming brushes, halters, and rub posts with 1:10 bleach solution.',
      'Wear protective gloves during treatment as fungal spores can spread to humans (zoonotic).'
    ]
  },
  'Healthy': {
    name: 'Healthy (No Symptoms)',
    urdu: 'تندرست (کوئی علامت نہیں پائی گئی)',
    riskLevel: 'Low',
    severity: 'No Stress',
    severityColor: '#4CB85C',
    severityBg: '#E8F8EA',
    description: 'Normal feed intake, clear skin, bright clear eyes, clean hooves, active rumination, and alert posture.',
    firstAid: [
      'Maintain routine scheduled vaccination for FMD, LSD, and Hemorrhagic Septicemia (HS).',
      'Keep shelter well-ventilated, dry, and disinfect housing facilities on a weekly basis.',
      'Provide clean drinking water, quality forage, and daily mineral premix supplements.'
    ]
  }
};

/**
 * Runs image disease detection via Roboflow Hosted Inference API
 * @param {string} imagePath - Local filesystem path of the uploaded image
 * @param {number} [confidenceThreshold=30] - Minimum confidence percentage (0-100)
 */
async function detectDiseaseFromImage(imagePath, confidenceThreshold = 30) {
  const apiKey = process.env.ROBOFLOW_API_KEY;
  const modelId = process.env.ROBOFLOW_MODEL_ID || 'bovine-disease-detection-combined';
  const version = process.env.ROBOFLOW_MODEL_VERSION || '1';

  if (!apiKey) {
    throw new Error('ROBOFLOW_API_KEY is not configured in backend environment variables.');
  }

  // Read image and encode as base64
  const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });

  // Roboflow inference endpoint
  const url = `https://detect.roboflow.com/${modelId}/${version}?api_key=${apiKey}&confidence=${confidenceThreshold}`;

  try {
    const response = await axios({
      method: 'POST',
      url: url,
      data: imageBase64,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 20000 // 20s timeout
    });

    const predictions = response.data.predictions || [];

    // Filter out predictions that might be below threshold
    const validPredictions = predictions.filter(p => (p.confidence * 100) >= confidenceThreshold);

    if (validPredictions.length === 0) {
      // No disease detected, animal evaluated as healthy
      return {
        detected: false,
        status: 'Healthy',
        confidence: '95.0%',
        ...DISEASE_KNOWLEDGE_BASE['Healthy'],
        predictions: []
      };
    }

    // Sort predictions by highest confidence first
    validPredictions.sort((a, b) => b.confidence - a.confidence);
    const top = validPredictions[0];
    const rawClass = top.class;

    // Check if the top prediction is a healthy class
    const isHealthyClass = rawClass.toLowerCase().includes('healthy');

    if (isHealthyClass) {
      return {
        detected: false,
        status: 'Healthy',
        confidence: `${(top.confidence * 100).toFixed(1)}%`,
        rawClass: rawClass,
        ...DISEASE_KNOWLEDGE_BASE['Healthy'],
        predictions: validPredictions
      };
    }

    // Identify disease category
    let matchedCategory = 'Healthy';
    const cLower = rawClass.toLowerCase();

    if (cLower === 'lsd' || cLower.includes('lumpy')) {
      matchedCategory = 'LSD';
    } else if (cLower === 'fmd' || cLower.includes('foot') || cLower.includes('mouth')) {
      matchedCategory = 'FMD';
    } else if (cLower === 'ibk' || cLower.includes('eye') || cLower.includes('pinkeye')) {
      matchedCategory = 'IBK';
    } else if (cLower.includes('ringworm')) {
      matchedCategory = 'Ringworm';
    } else {
      // General disease fallback
      matchedCategory = 'FMD';
    }

    const diseaseInfo = DISEASE_KNOWLEDGE_BASE[matchedCategory];

    return {
      detected: true,
      status: diseaseInfo.name,
      confidence: `${(top.confidence * 100).toFixed(1)}%`,
      rawClass: rawClass,
      ...diseaseInfo,
      predictions: validPredictions
    };
  } catch (error) {
    console.error('Roboflow Inference Error:', error.response?.data || error.message);
    throw new Error(`Roboflow detection failed: ${error.response?.data?.message || error.message}`);
  }
}

module.exports = {
  detectDiseaseFromImage,
  DISEASE_KNOWLEDGE_BASE
};
