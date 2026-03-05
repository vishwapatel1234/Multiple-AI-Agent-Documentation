import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { FileText, Calendar, DollarSign } from 'lucide-react';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getProjects()
            .then(data => {
                setProjects(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading projects...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Your Projects</h1>
                <Link to="/create" className="btn btn-primary">Create New Project</Link>
            </div>

            {projects.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No projects found. Start by creating one!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {projects.map(p => (
                        <Link to={`/projects/${p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                    <FileText size={24} color="var(--primary-color)" />
                                    <h3 style={{ marginLeft: '1rem', marginBottom: 0 }}>
                                        {p.name || `Project ${p.id.substring(0, 8)}`}
                                    </h3>
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Calendar size={14} />
                                        {new Date(p.created_at).toLocaleDateString()}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <DollarSign size={14} />
                                        Est. Cost: ₹{p.cost_inr ? p.cost_inr.toFixed(2) : '0.00'}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
