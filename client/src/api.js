const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4000/api';

export const api = {
    getProjects: async () => {
        const res = await fetch(`${API_BASE_URL}/projects`);
        return res.json();
    },

    getProject: async (id) => {
        const res = await fetch(`${API_BASE_URL}/projects/${id}`);
        return res.json();
    },

    createProject: async (data) => {
        const res = await fetch(`${API_BASE_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    deleteProject: async (id) => {
        const res = await fetch(`${API_BASE_URL}/projects/${id}`, { method: 'DELETE' });
        return res.json();
    },

    getStats: async () => {
        const res = await fetch(`${API_BASE_URL}/stats`);
        return res.json();
    },

    suggestConfiguration: async (requirements) => {
        const res = await fetch(`${API_BASE_URL}/suggest-config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requirements })
        });
        return res.json();
    },

    downloadPdf: async (id) => {
        const res = await fetch(`${API_BASE_URL}/projects/${id}/pdf`);
        if (!res.ok) throw new Error('Failed to download PDF');

        const blob = await res.blob();
        const disposition = res.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename="?([^"]+)"?/i);

        return {
            blob,
            filename: match?.[1] || `project-${id}.pdf`
        };
    }
};

export { API_BASE_URL };
