import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, DollarSign, FileText, Sparkles } from 'lucide-react';
import { api } from '../api';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.getProjects()
            .then((data) => {
                setProjects(data);
                setError('');
            })
            .catch((error) => {
                console.error(error);
                setError('Unable to reach the backend right now. Your projects are still in the database, but the dashboard could not load them.');
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="page-stack">
                <section className="card loading-state">
                    <div className="status-card">
                        <div className="spinner" />
                        <div>
                            <strong>Loading your workspace</strong>
                            <p>Pulling saved project documentation and recent runs.</p>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="page-stack">
            <section className="page-hero">
                <div className="hero-copy">
                    <span className="hero-kicker">Workspace</span>
                    <h1 className="hero-title">Documentation that feels organized before you even open it.</h1>
                    <p className="hero-description">
                        Review generated specs, revisit previous projects, and start a fresh documentation run from one clean dashboard.
                    </p>
                </div>
                <div className="hero-actions">
                    <Link to="/create" className="btn btn-primary">
                        <Sparkles size={18} />
                        Create New Project
                    </Link>
                </div>
            </section>

            {error && (
                <section className="card empty-state">
                    <strong>Could not load projects</strong>
                    <p>{error}</p>
                </section>
            )}

            {!error && projects.length === 0 ? (
                <section className="card empty-state">
                    <strong>No projects yet</strong>
                    <p>Start your first run and the generated documentation will appear here.</p>
                </section>
            ) : (
                <section className="project-grid">
                    {projects.map((project) => (
                        <Link to={`/projects/${project.id}`} key={project.id} className="card project-card">
                            <div className="project-card-body">
                                <div className="project-card-head">
                                    <div className="metric-icon">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="project-title">
                                            {project.name || `Project ${project.id.substring(0, 8)}`}
                                        </h3>
                                        <p className="muted">Generated documentation bundle</p>
                                    </div>
                                </div>

                                <div className="project-meta">
                                    <span>
                                        <Calendar size={15} />
                                        {new Date(project.created_at).toLocaleDateString()}
                                    </span>
                                    <span>
                                        <DollarSign size={15} />
                                        ₹{project.cost_inr ? Number(project.cost_inr).toFixed(2) : '0.00'}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </section>
            )}
        </div>
    );
};

export default Dashboard;
