import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // For demo purposes, we'll simulate AI detection based on image characteristics
    // In production, you would integrate with actual AI detection services like:
    // - Hive AI Detection API
    // - Microsoft Computer Vision
    // - Google Cloud Vision AI
    // - Custom ML models
    
    const buffer = Buffer.from(image, 'base64');
    
    // Simple heuristic for demo - analyze image characteristics
    const confidence = await simulateAIDetection(buffer);
    const isAI = confidence > 0.7;

    return NextResponse.json({
      isAI,
      confidence: Math.round(confidence * 100) / 100
    });

  } catch (error: any) {
    console.error("AI detection error:", error);
    return NextResponse.json(
      { error: error?.message || "AI detection failed" }, 
      { status: 500 }
    );
  }
}

async function simulateAIDetection(buffer: Buffer): Promise<number> {
  // This is a simulation for demo purposes
  // Replace with actual AI detection service integration
  
  try {
    const imageSize = buffer.length;
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple heuristics for demo (replace with real AI detection)
    let confidence = 0.3; // Base confidence
    
    // Size-based heuristic
    if (imageSize > 1000000) confidence += 0.1; // Large files might be AI-generated
    if (imageSize < 50000) confidence += 0.2; // Very small files might be AI
    
    // Random factor for demo variation
    confidence += Math.random() * 0.4;
    
    // Clamp between 0 and 1
    return Math.min(Math.max(confidence, 0), 1);
    
  } catch (error) {
    console.error("Simulation error:", error);
    return 0.3; // Default confidence
  }
}

// Alternative: Integration with external AI detection services
/*
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

async function detectWithOpenAI(imageBase64: string): Promise<{ isAI: boolean; confidence: number }> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and determine if it's AI-generated. Respond with only a number between 0 and 1 representing confidence that it's AI-generated."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 10
    })
  });
  
  if (!response.ok) {
    throw new Error("OpenAI API request failed");
  }
  
  const result = await response.json();
  const confidence = parseFloat(result.choices[0]?.message?.content || "0.3");
  
  return {
    isAI: confidence > 0.5,
    confidence
  };
}
*/
