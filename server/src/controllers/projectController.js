const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { validateProjectInputs } = require('../rules/validation');
const aiService = require('../ai/aiService');

exports.createProject = async (req, res) => {
    try {
        console.log("CreateProject Payload:", JSON.stringify(req.body, null, 2));
        const { requirements, team, stack } = req.body;

        // 1. Validation
        const validation = validateProjectInputs(requirements, team, stack);
        if (validation.valid) {
            // Already handled
        } else {
            return res.status(400).json({ error: "Validation Failed", details: validation.errors });
        }


        const projectId = uuidv4();

        // Store initial project (status pending)
        const insertStmt = db.prepare('INSERT INTO projects (id, requirements, team_selection, tech_stack) VALUES (?, ?, ?, ?)');
        insertStmt.run(projectId, requirements, JSON.stringify(team), JSON.stringify(stack));

        // 2. AI Pipeline execution
        // Note: In a real production app, this might be a background job. For this demo, we await it.

        // Step 1: Requirements Analysis
        const reqAnalysis = await aiService.analyzeRequirements(projectId, requirements);

        // Step 2: Research Tech Stack
        const researchData = await aiService.researchTechStack(projectId, reqAnalysis);

        // Step 3: Cost & Timeline (Merged)
        const costAndTimeline = await aiService.estimateCostAndTimeline(projectId, reqAnalysis, researchData);

        // Step 4: Module Breakdown
        const modules = await aiService.breakdownModules(projectId, reqAnalysis);

        // Aggregate Data for Final Doc
        const projectData = {
            requirements: reqAnalysis,
            user_team_input: team, // Keep original user input for reference
            user_stack_input: stack,
            research: researchData,
            planning: costAndTimeline,
            modules: modules
        };

        // Step 5: Final Doc
        const finalDoc = await aiService.generateFinalDoc(projectId, projectData);

        // Save Final Doc
        const updateStmt = db.prepare('UPDATE projects SET documentation_md = ? WHERE id = ?');
        updateStmt.run(finalDoc, projectId);

        res.json({
            projectId,
            documentation: finalDoc,
            data: projectData
        });

    } catch (error) {
        console.error("Project Creation Error:", error);
        res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
};

exports.exportPdf = async (req, res) => {
    try {
        const { id } = req.params;
        const stmt = db.prepare('SELECT documentation_md FROM projects WHERE id = ?');
        const project = stmt.get(id);

        if (!project || !project.documentation_md) {
            return res.status(404).json({ error: "Project or documentation not found" });
        }

        const { generatePdfFromMarkdown } = require('../services/pdfService');
        const pdfBuffer = await generatePdfFromMarkdown(project.documentation_md);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=project-${id}.pdf`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error("PDF Export Error:", error);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
};


exports.getProject = (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
    const project = stmt.get(id);

    if (!project) return res.status(404).json({ error: "Project not found" });

    res.json(project);
};

// Helper function to extract project name from markdown
function extractProjectName(markdownText) {
    if (!markdownText) return null;

    // Look for patterns like:
    // "# Project Proposal: Pet-Adoption Platform"
    // "# Project Documentation: Internal Leave Management Portal"
    // "# Software Project Documentation: [name]"
    const match = markdownText.match(/^#\s+(?:Project\s+(?:Proposal|Documentation)|Software\s+Project\s+Documentation):\s*(.+?)$/m);

    if (match && match[1]) {
        return match[1].trim();
    }

    // Fallback: try to find any first-level heading
    const firstHeading = markdownText.match(/^#\s+(.+)$/m);
    if (firstHeading && firstHeading[1]) {
        // Remove "Project Documentation: " if present
        return firstHeading[1].replace(/^(?:Project\s+(?:Proposal|Documentation)|Software\s+Project\s+Documentation):\s*/i, '').trim();
    }

    return null;
}

exports.getAllProjects = (req, res) => {
    const stmt = db.prepare('SELECT id, created_at, cost_inr, documentation_md FROM projects ORDER BY created_at DESC');
    const projects = stmt.all();

    // Extract project names from documentation
    const projectsWithNames = projects.map(p => ({
        id: p.id,
        created_at: p.created_at,
        cost_inr: p.cost_inr,
        name: extractProjectName(p.documentation_md)
    }));

    res.json(projectsWithNames);
};

exports.suggestConfiguration = async (req, res) => {
    try {
        const { requirements } = req.body;
        if (!requirements) {
            return res.status(400).json({ error: "Requirements are required" });
        }

        // Use a persistent System ID for tracking suggestions
        const projectId = 'system-suggestions';

        // Ensure system project exists to satisfy FK constraint
        const checkStmt = db.prepare('SELECT id FROM projects WHERE id = ?');
        const existing = checkStmt.get(projectId);
        console.log(`[Suggest Config] System project exists? ${!!existing}`);

        if (!existing) {
            console.log('[Suggest Config] Creating system project...');
            const insertStmt = db.prepare('INSERT INTO projects (id, requirements, team_selection, tech_stack) VALUES (?, ?, ?, ?)');
            try {
                insertStmt.run(projectId, "System Project for Suggestions", "{}", "{}");
                console.log('[Suggest Config] System project created.');
            } catch (err) {
                console.error('[Suggest Config] Failed to create system project:', err);
            }
        }

        const suggestion = await aiService.suggestTeamAndStack(projectId, requirements);

        res.json(suggestion);
    } catch (error) {
        console.error("Suggestion Error:", error);
        res.status(500).json({ error: "Failed to suggest configuration" });
    }
};

exports.deleteProject = (req, res) => {
    const { id } = req.params;
    try {
        // Delete dependent usage logs first (CASCADE manually if needed)
        const deleteLogs = db.prepare('DELETE FROM usage_logs WHERE project_id = ?');
        deleteLogs.run(id);

        const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
        const info = stmt.run(id);

        if (info.changes === 0) {
            return res.status(404).json({ error: "Project not found" });
        }
        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: "Failed to delete project" });
    }
};
