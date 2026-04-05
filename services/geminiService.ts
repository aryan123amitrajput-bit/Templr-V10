
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function validateWebsitePreview(base64Image: string): Promise<{ isWebsite: boolean; reason?: string }> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                {
                    parts: [
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: base64Image
                            }
                        },
                        {
                            text: "Analyze this image. Is it a website preview, app interface, or a digital UI design? Or is it a realistic photo of the real world (like a person, landscape, object in a room)? Respond in JSON format with two fields: 'isWebsite' (boolean) and 'reason' (string). 'isWebsite' should be true if it's a UI/UX design or website/app screenshot, and false if it's a realistic photo or unrelated content."
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json"
            }
        });

        const result = JSON.parse(response.text || "{}");
        return {
            isWebsite: result.isWebsite ?? true,
            reason: result.reason
        };
    } catch (error) {
        console.error("Gemini validation error:", error);
        return { isWebsite: true }; // Fallback to true on error to not block users unnecessarily
    }
}
