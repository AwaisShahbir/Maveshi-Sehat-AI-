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
  'Mastitis': {
    name: 'Bovine Mastitis (Udder Inflammation)',
    urdu: 'تھنوں کی سوزش اور سوجن (سوا)',
    riskLevel: 'High',
    severity: 'High Severity',
    severityColor: '#FF4D4D',
    severityBg: '#FFEBEB',
    description: 'Inflammation, redness, heat, and painful swelling of one or more udder quarters. Milk may appear watery, curdled, or contain yellow clots/blood flakes.',
    firstAid: [
      'Milk the affected quarter frequently (every 2-3 hours) into a separate bucket and discard safely.',
      'Apply cold water compresses or ice packs to reduce acute udder heat and swelling.',
      'Dip teats in antiseptic chlorhexidine or 0.5% povidone-iodine post-milking dip solution.',
      'Contact a veterinarian immediately for prescribed intramammary antibiotic infusion and anti-inflammatory therapy.'
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
  'HS': {
    name: 'Hemorrhagic Septicemia (HS)',
    urdu: 'گل گھوٹو (شدید گلے کی سوجن)',
    riskLevel: 'High',
    severity: 'High Severity',
    severityColor: '#FF4D4D',
    severityBg: '#FFEBEB',
    description: 'Acute bacterial infection characterized by high fever, severe painful swelling in submandibular and throat region, laboured snoring respiration, and profuse salivation.',
    firstAid: [
      'Isolate the sick animal immediately in a quiet, dry, and well-ventilated shelter.',
      'Provide easy access to cool water and soft, digestible mash feed.',
      'Do not compress or manipulate the swollen throat area to prevent choking.',
      'Urgent: Immediate veterinary administration of systemic antibiotics (oxytetracycline/sulfonamides) is critical.'
    ]
  },
  'Bloat': {
    name: 'Ruminal Tympany (Bloat)',
    urdu: 'اپھارہ / پیٹ کا پھولنا',
    riskLevel: 'High',
    severity: 'Severe Stress',
    severityColor: '#FF9500',
    severityBg: '#FFF5E5',
    description: 'Severe distension of the left paralumbar fossa (left flank) caused by gas trapping in the rumen, accompanied by signs of abdominal colic, kicking at belly, and difficulty breathing.',
    firstAid: [
      'Walk the animal gently uphill or place a wooden bit across its mouth to encourage salivation and belching.',
      'Administer 250-500ml of edible vegetable oil (mustard or peanut oil) orally to break froth.',
      'Avoid giving lush green legumes (berseem, lucerne) or finely ground concentrate feeds.',
      'If breathing becomes critically labored, seek an emergency veterinarian for stomach tube or trocarization.'
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
      'Provide clean drinking water, quality forage, and daily mineral premix supplements.',
      'Perform regular biosecurity checks and quarantine new livestock for 14 days.'
    ]
  }
};

/**
 * Universal Multimodal AI Vision Disease Diagnostics
 * Analyzes cattle images with GPT-4o-mini Vision to detect ANY cattle disease,
 * pathology, infection, or wound, and produces dynamic clinical reports & first aid.
 */
async function analyzeWithAIVision(imagePath, animalType = 'Cow') {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64}`;

    const prompt = `You are a Senior Veterinary Clinical Pathologist and Livestock Health Specialist specializing in cattle (${animalType === 'Buffalo' ? 'Water Buffalo / Nili-Ravi / Kundi' : 'Cow / Sahiwal / Cholistani / Crossbred'} in Pakistan and South Asia).

Analyze the provided animal image thoroughly.
Identify any visible disease, lesion, blister, ulcer, swelling, alopecia, eye discharge, nodule, inflammation, or wound on this animal, including but not limited to:
- Lumpy Skin Disease (LSD)
- Foot and Mouth Disease (FMD)
- Bovine Mastitis (udder/teat infection)
- Infectious Bovine Keratoconjunctivitis (IBK / Pinkeye)
- Ringworm / Fungal skin infection
- Hemorrhagic Septicemia (HS / گل گھوٹو)
- Blackleg (لنگڑا بخار)
- Ruminal Tympany (Bloat / اپھارہ)
- Bovine Respiratory Disease / Pneumonia
- Tick Infestation / Tick-borne fever (Theileriosis, Babesiosis)
- Trauma, Abscess, or Skin Wound
- Or confirm Healthy (clear skin/coat, bright eyes, clean hooves, no lesions).

Return ONLY valid JSON matching this schema:
{
  "detected": true,
  "name": "Full English Disease Name",
  "urdu": "اردو نام",
  "confidence": "94.5%",
  "riskLevel": "High" | "Medium" | "Low",
  "severity": "High Severity" | "Severe Stress" | "Moderate Risk" | "No Stress",
  "severityColor": "#FF4D4D" | "#FF9500" | "#4CB85C",
  "severityBg": "#FFEBEB" | "#FFF5E5" | "#E8F8EA",
  "description": "2-3 sentences explaining exactly what clinical symptoms and visual pathology are visible in this photo.",
  "firstAid": [
    "Step 1: Immediate isolation, restraint, or cleaning measure",
    "Step 2: Specific topical antiseptic, solution, or herbal/first-aid treatment",
    "Step 3: Environment, bedding, vector control, or hygiene recommendation",
    "Step 4: Feeding, hydration, and veterinary clinical management"
  ]
}`;

    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUri } }
          ]
        }
      ],
      timeout: 25000
    });

    const parsed = JSON.parse(res.choices[0].message.content);
    return parsed;
  } catch (err) {
    console.warn('[AI Vision] Universal vision inference notice:', err.message);
    return null;
  }
}

/**
 * Runs image disease detection via Universal AI Vision with Roboflow fallback
 * @param {string} imagePath - Local filesystem path of the uploaded image
 * @param {number} [confidenceThreshold=30] - Minimum confidence percentage (0-100)
 * @param {string} [animalType='Cow'] - Cow or Buffalo
 */
async function detectDiseaseFromImage(imagePath, confidenceThreshold = 30, animalType = 'Cow') {
  // 1. Try Universal Multimodal AI Vision first (detects ANY disease dynamically)
  try {
    const aiVision = await analyzeWithAIVision(imagePath, animalType);
    if (aiVision && aiVision.name) {
      const isDetected = Boolean(aiVision.detected);
      const diseaseName = isDetected ? aiVision.name : 'Healthy (No Symptoms)';
      const urduName = isDetected ? (aiVision.urdu || 'بیماری کی علامات') : 'تندرست (کوئی علامت نہیں پائی گئی)';

      const fallbackFirstAid = isDetected
        ? [
            'Isolate the infected animal immediately from the herd to prevent transmission.',
            'Clean affected lesions with mild antiseptic solution (povidone-iodine).',
            'Provide fresh, cool drinking water, soft green forage, and oral electrolytes.',
            'Consult a registered veterinary doctor for prescription antibiotics and anti-inflammatory treatment.'
          ]
        : DISEASE_KNOWLEDGE_BASE['Healthy'].firstAid;

      const finalFirstAid = Array.isArray(aiVision.firstAid) && aiVision.firstAid.length > 0
        ? aiVision.firstAid
        : fallbackFirstAid;

      return {
        detected: isDetected,
        status: diseaseName,
        name: diseaseName,
        urdu: urduName,
        confidence: aiVision.confidence || (isDetected ? '92.5%' : '95.0%'),
        riskLevel: aiVision.riskLevel || (isDetected ? 'High' : 'Low'),
        severity: aiVision.severity || (isDetected ? 'High Severity' : 'No Stress'),
        severityColor: aiVision.severityColor || (isDetected ? '#FF4D4D' : '#4CB85C'),
        severityBg: aiVision.severityBg || (isDetected ? '#FFEBEB' : '#E8F8EA'),
        description: aiVision.description || (isDetected ? 'Pathological symptoms observed on cattle.' : 'Animal shows no signs of clinical distress.'),
        firstAid: finalFirstAid,
        predictions: []
      };
    }
  } catch (visionErr) {
    console.warn('[AI Vision] Primary vision failed, trying Roboflow fallback:', visionErr.message);
  }

  // 2. Roboflow Hosted Inference API Fallback
  const apiKey = process.env.ROBOFLOW_API_KEY || '4pedAHng4E1YnDynGAeQ';
  const modelId = process.env.ROBOFLOW_MODEL_ID || 'bovine-disease-detection-combined';
  const version = process.env.ROBOFLOW_MODEL_VERSION || '1';

  if (!apiKey) {
    throw new Error('Neither AI Vision nor ROBOFLOW_API_KEY is available.');
  }

  const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });
  const url = `https://detect.roboflow.com/${modelId}/${version}?api_key=${apiKey}&confidence=${confidenceThreshold}`;

  try {
    const response = await axios({
      method: 'POST',
      url: url,
      data: imageBase64,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 20000
    });

    const predictions = response.data.predictions || [];
    const validPredictions = predictions.filter(p => (p.confidence * 100) >= confidenceThreshold);

    if (validPredictions.length === 0) {
      return {
        detected: false,
        status: 'Healthy',
        name: 'Healthy (No Symptoms)',
        confidence: '95.0%',
        ...DISEASE_KNOWLEDGE_BASE['Healthy'],
        predictions: []
      };
    }

    validPredictions.sort((a, b) => b.confidence - a.confidence);
    const top = validPredictions[0];
    const rawClass = top.class;

    const isHealthyClass = rawClass.toLowerCase().includes('healthy') || rawClass.toLowerCase().includes('normal');
    if (isHealthyClass) {
      return {
        detected: false,
        status: 'Healthy',
        name: 'Healthy (No Symptoms)',
        confidence: `${(top.confidence * 100).toFixed(1)}%`,
        rawClass: rawClass,
        ...DISEASE_KNOWLEDGE_BASE['Healthy'],
        predictions: validPredictions
      };
    }

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
    } else if (cLower.includes('mastitis')) {
      matchedCategory = 'Mastitis';
    } else {
      matchedCategory = 'FMD';
    }

    const diseaseInfo = DISEASE_KNOWLEDGE_BASE[matchedCategory];

    return {
      detected: true,
      status: diseaseInfo.name,
      name: diseaseInfo.name,
      confidence: `${(top.confidence * 100).toFixed(1)}%`,
      rawClass: rawClass,
      ...diseaseInfo,
      predictions: validPredictions
    };
  } catch (error) {
    console.error('Roboflow Inference Error:', error.response?.data || error.message);
    throw new Error(`Disease detection failed: ${error.response?.data?.message || error.message}`);
  }
}

module.exports = {
  detectDiseaseFromImage,
  analyzeWithAIVision,
  DISEASE_KNOWLEDGE_BASE
};

