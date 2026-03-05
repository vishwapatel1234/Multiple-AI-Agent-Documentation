// Rules and Validation Logic

/**
 * Validates the project inputs before processing.
 * @param {Object} requirements - Client requirements text
 * @param {Object} team - Team composition { role: { count, level } }
 * @param {Object} stack - Tech stack selection
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateProjectInputs(requirements, team, stack) {
    const errors = [];

    if (!requirements || requirements.trim().length < 10) {
        errors.push("Project requirements are too short. Please provide more details.");
    }

    if (!team || Object.keys(team).length === 0) {
        errors.push("Team composition is required.");
    }

    // Example Rule: AI Feature requires AI Engineer
    // Check if requirements mention 'AI' or 'Machine Learning' and if team has AI role
    const reqLower = requirements.toLowerCase();
    const needsAI = reqLower.includes('ai ') || reqLower.includes('machine learning') || reqLower.includes('gpt');
    const hasAIEngineer = team.ai_engineer && team.ai_engineer.count > 0;

    if (needsAI && !hasAIEngineer) {
        errors.push("Project requirements involve AI, but no AI Engineer is selected in the team.");
    }

    // Example Rule: Scaling requires DevOps
    const needsScaling = reqLower.includes('scale') || reqLower.includes('high traffic') || (stack && stack.cloud);
    // checking if cloud is selected implies deployment, usually needs basic devops for enterprise
    // strict rule: if "scale" mentioned, need devops
    const hasDevOps = team.devops && team.devops.count > 0;

    if (reqLower.includes('scale') && !hasDevOps) {
        errors.push("High scalability requested, but no DevOps engineer selected.");
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateProjectInputs
};
