import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ArrowLeft, Trash2 } from 'lucide-react';
import EnhancedDocViewer from '../components/EnhancedDocViewer';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this project? This cannot be undone.')) {
            try {
                await api.deleteProject(id);
                navigate('/');
            } catch (err) {
                console.error("Failed to delete", err);
                alert("Failed to delete project");
            }
        }
    };

    useEffect(() => {
        api.getProject(id).then(data => {
            setProject(data);
            setLoading(false);
        });
    }, [id]);

    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        try {
            setDownloading(true);
            const blob = await api.downloadPdf(project.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `project-${project.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Download failed", err);
            alert("Failed to download PDF");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <div>Loading details...</div>;
    if (!project) return <div>Project not found</div>;

    return (
        <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>Project Documentation</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>ID: {project.id}</p>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Estimated Cost</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
                        ₹{project.cost_inr ? project.cost_inr.toFixed(2) : '0.00'}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        className="btn"
                        style={{ backgroundColor: 'var(--error-color)', color: 'white', width: 'auto' }}
                        onClick={handleDelete}
                    >
                        <Trash2 size={18} style={{ marginRight: '0.5rem' }} /> Delete
                    </button>
                    <button
                        className="btn btn-primary"
                        style={{ width: '200px' }}
                        onClick={handleDownload}
                        disabled={downloading}
                    >
                        {downloading ? 'Downloading...' : 'Export PDF'}
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginTop: '2rem', minHeight: '500px' }}>
                <EnhancedDocViewer content={project.documentation_md} />
            </div>
        </div>
    );
};

export default ProjectDetails;
