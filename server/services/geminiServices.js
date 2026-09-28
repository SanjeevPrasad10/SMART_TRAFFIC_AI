const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper: Convert local image file to generative part
function fileToGenerativePart(filePath, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType
        },
    };
}

/**
 * Analyzes traffic incident image + description using Gemini 1.5 Flash
 */
async function analyzeIncident(imagePath, mimeType, description) {
    try {
        const prompt = `
You are an expert Traffic Incident Management and Emergency Dispatch AI.
Analyze the provided traffic incident image and citizen description: "${description}".

Provide your analysis strictly in this valid JSON format (do not include markdown ticks or any extra text outside the JSON):
{
  "detectedSeverity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "detectedType": "accident" | "traffic_jam" | "road_damage" | "signal_failure" | "illegal_parking" | "hazard" | "other",
  "summary": "1-2 sentence factual summary of what is visible",
  "recommendedActions": [
    "action 1",
    "action 2"
  ],
  "confidenceScore": 0.95
}

Guidelines for severity:
- CRITICAL: Life-threatening accidents, vehicles flipped, fires, major roadblocks.
- HIGH: Multi-car fender benders, blocked main arteries, fallen trees.
- MEDIUM: Minor road damage, moderate traffic jams, malfunctioning signals.
- LOW: Illegal parking, minor potholes, minor obstructions.
`;

        let contents = [prompt];

        // Attach image if provided
        if (imagePath && fs.existsSync(imagePath)) {
            const imagePart = fileToGenerativePart(imagePath, mimeType || 'image/jpeg');
            contents.push(imagePart);
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const resultText = response.text;
        return JSON.parse(resultText);

    } catch (error) {
        console.error("❌ Gemini Analysis Error:", error.message);
        // Graceful fallback if AI fails (keeps system resilient!)
        return {
            detectedSeverity: "MEDIUM",
            detectedType: "other",
            summary: description || "Reported incident awaiting manual review.",
            recommendedActions: ["Manual inspection required by traffic patrol."],
            confidenceScore: 0.50
        };
    }
}

module.exports = { analyzeIncident };