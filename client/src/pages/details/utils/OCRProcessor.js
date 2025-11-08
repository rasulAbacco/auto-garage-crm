import Tesseract from "tesseract.js";
import { preprocessImage } from "./preprocessImage";
import { parseOCRText } from "./parseOCRText";

export const processImage = async (imageData, onProgress) => {
    if (!imageData) throw new Error("No image provided");

    const preprocessed = await preprocessImage(imageData);

    const result = await Tesseract.recognize(preprocessed, "eng", {
        logger: (m) => {
            if (m.progress && onProgress) onProgress(m.progress);
        },
    });

    const text = result.data.text.trim();
    const parsed = parseOCRText(text, result.data.confidence);
    return { text, parsed, confidence: result.data.confidence };
};
