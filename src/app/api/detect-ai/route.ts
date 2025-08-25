import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Try SightEngine first, fallback to simulation
    try {
      const result = await detectWithSightEngine(image);
      return NextResponse.json(result);
    } catch (sightEngineError) {
      console.warn("SightEngine detection failed, using simulation:", sightEngineError);
      
      // Fallback to simulation
      const buffer = Buffer.from(image, 'base64');
      const confidence = await simulateAIDetection(buffer);
      const isAI = confidence > 0.7;

      return NextResponse.json({
        isAI,
        confidence: Math.round(confidence * 100) / 100,
        source: 'simulation'
      });
    }

  } catch (error: any) {
    console.error("AI detection error:", error);
    return NextResponse.json(
      { error: error?.message || "AI detection failed" }, 
      { status: 500 }
    );
  }
}

// SightEngine AI Detection Integration
async function detectWithSightEngine(imageBase64: string): Promise<{ isAI: boolean; confidence: number; source: string }> {
  const SIGHTENGINE_API_USER = process.env.SIGHTENGINE_API_USER;
  const SIGHTENGINE_API_SECRET = process.env.SIGHTENGINE_API_SECRET;
  
  if (!SIGHTENGINE_API_USER || !SIGHTENGINE_API_SECRET) {
    throw new Error("SightEngine API credentials not configured");
  }
  
  // Create form data for SightEngine API
  const formData = new FormData();
  formData.append('media', `data:image/jpeg;base64,${imageBase64}`);
  formData.append('models', 'genai'); // AI-generated content detection model
  formData.append('api_user', SIGHTENGINE_API_USER);
  formData.append('api_secret', SIGHTENGINE_API_SECRET);
  
  const response = await fetch('https://api.sightengine.com/1.0/check.json', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SightEngine API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  // Check for API errors
  if (result.status === 'failure') {
    throw new Error(`SightEngine API failure: ${result.error?.message || 'Unknown error'}`);
  }
  
  // Extract AI detection results
  const aiGenerated = result.type?.ai_generated || 0;
  const isAI = aiGenerated > 0.5; // Threshold for AI detection
  
  return {
    isAI,
    confidence: Math.round(aiGenerated * 100) / 100,
    source: 'sightengine'
  };
}

// Fallback simulation for when SightEngine is not available
async function simulateAIDetection(buffer: Buffer): Promise<number> {
  // Fast simulation for demo purposes
  // Used as fallback when SightEngine is not configured

  try {
    const imageSize = buffer.length;

    // Much faster analysis delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    // Enhanced heuristics for more realistic demo results
    let confidence = 0.25; // Base confidence

    // File size analysis (AI images often have specific size patterns)
    if (imageSize > 2000000) confidence += 0.3; // Very large files often AI-generated
    if (imageSize < 100000) confidence += 0.2; // Very small files might be AI-compressed

    // Simulate different AI detection scenarios for variety
    const scenarios = [
      0.15, // Clearly human-made
      0.25, // Probably human-made
      0.45, // Uncertain
      0.75, // Likely AI-generated
      0.85, // Very likely AI-generated
      0.95  // Almost certainly AI-generated
    ];

    // Add weighted random selection for more realistic results
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    confidence = (confidence + randomScenario) / 2;

    // Add small random variation for realism
    confidence += (Math.random() - 0.5) * 0.1;

    // Clamp between 0.05 and 0.95 for realistic bounds
    return Math.min(Math.max(confidence, 0.05), 0.95);

  } catch (error) {
    console.error("Simulation error:", error);
    return 0.3; // Default confidence
  }
}

// SightEngine API Documentation:
// https://sightengine.com/docs/ai-generated-detection
// Models available: 'genai' for AI-generated content detection
// Response format: { type: { ai_generated: number } } where ai_generated is 0-1 confidence

// Alternative detection services (for reference)
/*
// Hive AI Detection
async function detectWithHiveAI(imageBase64: string): Promise<{ isAI: boolean; confidence: number }> {
  const HIVE_API_KEY = process.env.HIVE_AI_API_KEY;
  
  if (!HIVE_API_KEY) {
    throw new Error("Hive AI API key not configured");
  }
  
  const response = await fetch("https://api.thehive.ai/api/v2/task/sync", {
    method: "POST",
    headers: {
      "Authorization": `Token ${HIVE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: `data:image/jpeg;base64,${imageBase64}`,
      models: ["ai_generated"]
    })
  });
  
  if (!response.ok) {
    throw new Error("Hive AI API request failed");
  }
  
  const result = await response.json();
  const aiScore = result.status[0]?.response?.output?.[0]?.classes?.find(
    (cls: any) => cls.class === "ai_generated"
  )?.score || 0;
  
  return {
    isAI: aiScore > 0.5,
    confidence: aiScore
  };
}
*/
