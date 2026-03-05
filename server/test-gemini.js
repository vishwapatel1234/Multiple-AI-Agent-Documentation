const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Hack: The SDK doesn't expose listModels directly on genAI instance easily in some versions, 
    // but we can try to use the ModelManager if exposed, or just try a generateContent on a few known models to see which one works.

    // Actually, simpler: just try to generate 'Hello' with a few candidate names.
    const candidates = [
        'gemini-2.0-flash',
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
        'gemini-1.5-flash-001',
        'gemini-1.5-flash-002',
        'gemini-1.5-pro',
        'gemini-pro'
    ];

    console.log("Testing Model Availability...");

    for (const modelName of candidates) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`[SUCCESS] ${modelName} is available.`);
        } catch (error) {
            console.log(`[FAILED] ${modelName}: ${error.message.split('\n')[0]}`);
        }
    }
}

listModels();
