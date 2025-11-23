import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PreflightReport, CheckStatus, Category } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the response schema for structured JSON output
const reportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.INTEGER, description: "A score from 0 to 100 indicating print readiness." },
    summary: { type: Type.STRING, description: "A concise executive summary of the preflight findings." },
    finalVerdict: { 
      type: Type.STRING, 
      enum: ["READY_FOR_PRINT", "NEEDS_REVIEW", "DO_NOT_PRINT"],
      description: "The final recommendation." 
    },
    specs: {
      type: Type.OBJECT,
      properties: {
        pageCount: { type: Type.INTEGER },
        detectedDimensions: { type: Type.STRING, description: "Estimated physical dimensions (e.g., 8.5x11 in, A4, 3.5x2 in)." },
        colorProfileEstimate: { type: Type.STRING, description: "e.g., CMYK, RGB Detected, Grayscale, Spot Colors." },
        hasCropMarks: { type: Type.BOOLEAN, description: "True if crop marks/printer marks are visible." }
      },
      required: ["pageCount", "detectedDimensions", "colorProfileEstimate", "hasCropMarks"]
    },
    checks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, enum: ["LAYOUT", "TYPOGRAPHY", "IMAGERY", "CONTENT", "COLOR"] },
          status: { type: Type.STRING, enum: ["PASS", "WARN", "FAIL"] },
          title: { type: Type.STRING, description: "Short title of the check." },
          description: { type: Type.STRING, description: "Detailed explanation of the finding." },
          location: { type: Type.STRING, description: "Text description of location (e.g. 'Page 1 Top Right')." },
          visualZone: { 
            type: Type.STRING, 
            enum: ['TOP_LEFT', 'TOP_CENTER', 'TOP_RIGHT', 'MIDDLE_LEFT', 'CENTER', 'MIDDLE_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_CENTER', 'BOTTOM_RIGHT', 'FULL_PAGE'],
            description: "The approximate visual region on the page where this issue is located."
          }
        },
        required: ["category", "status", "title", "description"]
      }
    }
  },
  required: ["overallScore", "summary", "finalVerdict", "specs", "checks"]
};

export const analyzePdf = async (base64Pdf: string): Promise<PreflightReport> => {
  const modelId = "gemini-2.5-flash"; // Flash is efficient for document analysis

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Pdf
            }
          },
          {
            text: `You are a Senior Print Production Specialist and Preflight Technician. 
            Analyze the attached PDF file for commercial printing suitability. 
            
            Perform a strict technical preflight check. 
            For every error or warning found, you MUST estimate the 'visualZone' (where on the page it is).
            
            1. LAYOUT & MARGINS:
               - Identify the artwork size.
               - CHECK FOR CROP MARKS: Look carefully for printer's marks. Professional files often have "double crop marks" (inner for trim, outer for bleed) or registration targets. If ANY valid crop/trim marks are present, set hasCropMarks to true.
               - BLEED: Does artwork extend past the trim line? 
               - SAFE AREA: Are logos/text too close to the edge?

            2. COLOR & INK (Critical):
               - COLOR MODE: Detect if images appear to be RGB (neon/bright gamut) vs CMYK. Mark as FAIL/WARN if RGB is detected for print.
               - RICH BLACK: Check body text. Is it 100% Black (K) or 4-Color Black (Rich Black)? 4-color black on small text is a major error.
               - OVERPRINT: Visual check for white text that might accidentally be set to overprint.

            3. IMAGERY:
               - Resolution check: Do images look pixelated (low DPI)?
               - Artifacts: Are there compression artifacts?

            4. TYPOGRAPHY:
               - Legibility and font embedding issues.
               - Contrast issues.

            5. CONTENT & SPELLING (New Requirement):
               - Read ALL text content in the document.
               - Perform a spell check. Identify any typos or misspelled words.
               - Check for placeholder text (e.g., "Lorem Ipsum", "Insert Text Here").
               - Check for grammar or awkward phrasing that might be a mistake.
               - Categorize these findings under 'CONTENT'.

            Provide a strict professional assessment. If crop marks are missing on a full-bleed doc, that is a fail. If 4-color black text is found, that is a fail. If obvious typos are found, mark as WARN.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: reportSchema,
        temperature: 0.0,
      }
    });

    const text = response.text;
    
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    return JSON.parse(text) as PreflightReport;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw new Error("Failed to analyze the PDF. Please try again.");
  }
};

export const generateImage = async (prompt: string, size: '1K' | '2K' | '4K'): Promise<string> => {
  try {
    // Always create a new instance to ensure we use the latest API key if it was just selected
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
          imageSize: size,
          aspectRatio: "1:1"
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated in response.");
  } catch (error) {
    console.error("Image Generation Failed:", error);
    throw error;
  }
};

export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          },
          { text: prompt }
        ]
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No edited image generated in response.");
  } catch (error) {
    console.error("Image Editing Failed:", error);
    throw error;
  }
};