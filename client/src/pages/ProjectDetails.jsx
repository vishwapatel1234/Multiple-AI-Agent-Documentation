import React, { useEffect, useState } from 'react';
import { ArrowLeft, Download, ReceiptText, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import EnhancedDocViewer from '../components/EnhancedDocViewer';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        api.getProject(id)
            .then((data) => setProject(data))
            .finally(() => setLoading(false));
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) {
            return;
        }

        try {
            await api.deleteProject(id);
            navigate('/');
        } catch (error) {
            console.error('Failed to delete', error);
            alert('Failed to delete project');
        }
    };

    const handleDownload = async () => {
        try {
            setDownloading(true);
            const { blob, filename } = await api.downloadPdf(project.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error('Download failed', error);
            alert('Failed to download PDF');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <section className="card loading-state">
                <div className="status-card">
                    <div className="spinner" />
                    <div>
                        <strong>Loading project details</strong>
                        <p>Preparing the generated documentation view.</p>
                    </div>
                </div>
            </section>
        );
    }

    if (!project) {
        return (
            <section className="card empty-state">
                <strong>Project not found</strong>
                <p>This record may have been deleted or never finished generating.</p>
            </section>
        );
    }

    return (
        <div className="page-stack">
            <Link to="/" className="back-link">
                <ArrowLeft size={16} />
                Back to Dashboard
            </Link>

            <section className="page-hero compact">
                <div className="hero-copy">
                    <span className="hero-kicker">Project Output</span>
                    <h1 className="hero-title">Generated project documentation</h1>
                    <p className="hero-description">
                        Review the final output, export a PDF, or remove the project from your workspace.
                    </p>
                    <div className="hero-actions">
                        <span className="badge">
                            <ReceiptText size={16} />
                            ID: {project.id}
                        </span>
                    </div>
                </div>

                <div className="hero-actions">
                    <div className="card panel">
                        <div className="metric-label">Recorded API cost</div>
                        <div className="metric-value">₹{project.cost_inr ? Number(project.cost_inr).toFixed(2) : '0.00'}</div>
                    </div>
                    <button className="btn btn-danger" onClick={handleDelete}>
                        <Trash2 size={18} />
                        Delete
                    </button>
                    <button className="btn btn-primary" onClick={handleDownload} disabled={downloading || !project.id}>
                        <Download size={18} />
                        {downloading ? 'Downloading...' : 'Download PDF'}
                    </button>
                </div>
            </section>

            <section className="card doc-shell">
                <EnhancedDocViewer content={project.documentation_md} />
            </section>
        </div>
    );
};

export default ProjectDetails;
