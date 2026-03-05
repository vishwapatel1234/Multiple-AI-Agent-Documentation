const db = require('../db/connection');

// Pricing per 1M tokens (approximate/placeholder for now)
const PRICING = {
    'gemini-2.5-flash': { input: 0.10, output: 0.40 },
    'gemini-2.5-flash-lite': { input: 0.05, output: 0.20 },
    'gemini-3-flash-preview': { input: 0.15, output: 0.60 },
    'gpt-4o': { input: 5.00, output: 15.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 }
};

const USD_TO_INR = 84; // Approx conversion rate

/**
 * Logs AI usage and calculates cost.
 * @param {string} projectId 
 * @param {string} stepName 
 * @param {string} modelName 
 * @param {number} inputTokens 
 * @param {number} outputTokens 
 */
function logUsage(projectId, stepName, modelName, inputTokens, outputTokens) {
    console.log(`[CostService] Logging usage for Project: ${projectId}, Step: ${stepName}, Model: ${modelName}`);
    const price = PRICING[modelName] || PRICING['gpt-4o-mini']; // Default to mini price if unknown

    const costUSD = (inputTokens / 1000000 * price.input) + (outputTokens / 1000000 * price.output);
    const costINR = costUSD * USD_TO_INR;

    const stmt = db.prepare(`
    INSERT INTO usage_logs (project_id, step_name, model_name, input_tokens, output_tokens, cost_inr)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

    stmt.run(projectId, stepName, modelName, inputTokens, outputTokens, costINR);

    // Update project total cost
    const updateStmt = db.prepare(`
    UPDATE projects SET cost_inr = cost_inr + ? WHERE id = ?
  `);
    updateStmt.run(costINR, projectId);

    return costINR;
}

/**
 * Gets aggregated cost stats.
 */
function getCostStats() {
    const totalCost = db.prepare('SELECT SUM(cost_inr) as total FROM usage_logs').get().total || 0;
    const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get().count || 0;
    const avgCost = projectCount > 0 ? totalCost / projectCount : 0;

    return {
        totalCost: totalCost.toFixed(2),
        projectCount,
        avgCost: avgCost.toFixed(2)
    };
}

module.exports = {
    logUsage,
    getCostStats
};
