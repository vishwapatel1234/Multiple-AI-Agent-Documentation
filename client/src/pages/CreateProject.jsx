import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const CreateProject = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        requirements: '',
        team: {
            product_manager: { count: 1, level: 'senior' },
            frontend_dev: { count: 1, level: 'mid' },
            backend_dev: { count: 1, level: 'senior' },
            ai_engineer: { count: 1, level: 'senior' },
            qa_engineer: { count: 1, level: 'mid' },
            devops: { count: 1, level: 'senior' }
        },
        stack: {
            frontend: 'React',
            backend: 'Node.js',
            database: 'PostgreSQL',
            cloud: 'AWS'
        }
    });

    const handleReqChange = (e) => setFormData({ ...formData, requirements: e.target.value });

    const handleTeamChange = (role, field, value) => {
        setFormData(prev => ({
            ...prev,
            team: {
                ...prev.team,
                [role]: {
                    ...prev.team[role],
                    [field]: value
                }
            }
        }));
    };

    const handleStackChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            stack: {
                ...prev.stack,
                [field]: value
            }
        }));
    };

    const handleAutoFill = async () => {
        if (!formData.requirements) return;
        setLoading(true);
        try {
            const suggestion = await api.suggestConfiguration(formData.requirements);
            if (suggestion) {
                setFormData(prev => ({
                    ...prev,
                    team: { ...prev.team, ...suggestion.team },
                    stack: { ...prev.stack, ...suggestion.stack }
                }));
                // Optional: auto-advance to next step or just notify?
                // Let's stay on step 1 so they can review, or move to step 2?
                // Moving to step 2 seems natural to see the results.
                setStep(2);
            }
        } catch (err) {
            console.error("Auto-fill failed", err);
            alert("Failed to auto-fill configuration.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await api.createProject(formData);
            if (res.error) {
                alert(res.error + ": " + (res.details ? res.details.join(', ') : ''));
            } else {
                navigate(`/projects/${res.projectId}`);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to generate documentation. See console.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                <h2>Generating Documentation...</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    AI is analyzing requirements, estimating costs, and planning modules.
                    <br />This may take up to 60 seconds.
                </p>
            </div>
        );
    }


    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="gradient-text">Create Professional Project Documentation</h1>

            {/* Visual Progress Stepper */}
            <div className="stepper-container">
                <div className="stepper-step">
                    <div className={`step-circle ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        {step > 1 ? '✓' : '1'}
                    </div>
                    <span style={{ fontSize: '0.875rem', color: step === 1 ? 'var(--primary-color)' : 'var(--text-muted)' }}>Requirements</span>
                </div>
                <div className={`step-line ${step > 1 ? 'completed' : ''}`}></div>
                <div className="stepper-step">
                    <div className={`step-circle ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        {step > 2 ? '✓' : '2'}
                    </div>
                    <span style={{ fontSize: '0.875rem', color: step === 2 ? 'var(--primary-color)' : 'var(--text-muted)' }}>Team</span>
                </div>
                <div className={`step-line ${step > 2 ? 'completed' : ''}`}></div>
                <div className="stepper-step">
                    <div className={`step-circle ${step >= 3 ? 'active' : ''}`}>
                        3
                    </div>
                    <span style={{ fontSize: '0.875rem', color: step === 3 ? 'var(--primary-color)' : 'var(--text-muted)' }}>Tech Stack</span>
                </div>
            </div>

            <div className="card animate-fade-in">
                {step === 1 && (
                    <div>
                        <h3>Step 1: Project Requirements</h3>
                        <div className="input-group">
                            <label className="input-label">Describe your project goal, features, and constraints.</label>
                            <textarea
                                className="input-field"
                                rows={8}
                                value={formData.requirements}
                                onChange={handleReqChange}
                                placeholder="e.g., A web-based inventory management system for a retail chain..."
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>

                            <button className="btn btn-primary" onClick={() => setStep(2)}>Next: Team Selection</button>
                            <button
                                className="btn-ai"
                                onClick={handleAutoFill}
                                disabled={loading || !formData.requirements}
                            >
                                {loading && step === 1 ? 'Analyzing...' : 'Auto-Fill with AI'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h3>Step 2: Team Selection</h3>
                        {Object.keys(formData.team).map(role => (
                            <div key={role} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: '8px' }}>
                                <h4 style={{ textTransform: 'capitalize' }}>{role.replace('_', ' ')}</h4>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="input-label">Count</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={formData.team[role].count}
                                            onChange={(e) => handleTeamChange(role, 'count', parseInt(e.target.value))}
                                            min="0"
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="input-label">Level</label>
                                        <select
                                            className="input-field"
                                            value={formData.team[role].level}
                                            onChange={(e) => handleTeamChange(role, 'level', e.target.value)}
                                        >
                                            <option value="junior">Junior</option>
                                            <option value="mid">Mid</option>
                                            <option value="senior">Senior</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button className="btn" style={{ backgroundColor: 'var(--bg-card)' }} onClick={() => setStep(1)}>Back</button>
                            <button className="btn btn-primary" onClick={() => setStep(3)}>Next: Tech Stack</button>
                        </div>
                    </div>
                )}


                {step === 3 && (
                    <div>
                        <h3>Step 3: Tech Stack</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {Object.keys(formData.stack).map(techKey => (
                                <div key={techKey} className="input-group">
                                    <label className="input-label" style={{ textTransform: 'capitalize' }}>{techKey}</label>
                                    <input
                                        className="input-field"
                                        value={formData.stack[techKey]}
                                        onChange={(e) => handleStackChange(techKey, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button className="btn" style={{ backgroundColor: 'var(--bg-card)' }} onClick={() => setStep(2)}>Back</button>
                            <button className="btn btn-primary" onClick={handleSubmit}>Generate Documentation</button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default CreateProject;
