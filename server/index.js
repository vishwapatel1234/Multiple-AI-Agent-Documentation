const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

process.on('exit', (code) => {
    console.log('Process exit event with code: ', code);
    console.log(new Error('Process exited').stack);
});

const projectController = require('./src/controllers/projectController');
const { getCostStats } = require('./src/services/costService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/projects', projectController.createProject);
app.get('/api/projects', projectController.getAllProjects);
app.get('/api/projects/:id', projectController.getProject);
app.get('/api/projects/:id/pdf', projectController.exportPdf);
app.delete('/api/projects/:id', projectController.deleteProject);
app.post('/api/suggest-config', projectController.suggestConfiguration);

app.get('/api/stats', (req, res) => {
    const stats = getCostStats();
    res.json(stats);
});

// Serve frontend in production (optional for this setup but good practice)
// Serve frontend (Production or Shared Mode)
const clientDistPath = path.resolve(__dirname, '../client/dist');
const fs = require('fs');

if (fs.existsSync(clientDistPath)) {
    console.log("Serving frontend from:", clientDistPath);
    app.use(express.static(clientDistPath));

    // SPA catch-all: serve index.html for all non-matched routes
    // This MUST come AFTER all API routes (which are already defined above)
    // The API routes will match first, then this catches everything else
    // Handles /stats, /projects/:id, etc. on page refresh
    // Using fs.readFileSync instead of sendFile to avoid conflict with static middleware
    app.get(/^(?!\/api).*$/, (req, res) => {
        const indexPath = path.resolve(clientDistPath, 'index.html');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        res.type('html').send(indexContent);
    });
} else {
    console.log("Frontend build not found. API only mode.");
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

setInterval(() => { }, 1000 * 60 * 60); // keep alive
