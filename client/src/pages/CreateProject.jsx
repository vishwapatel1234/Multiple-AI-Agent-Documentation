import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Wand2 } from 'lucide-react';
import { api } from '../api';

const stepContent = [
    {
        title: 'Requirements',
        text: 'Start with a clear brief so the agent chain has solid context.',
    },
    {
        title: 'Team',
        text: 'Adjust staffing to match the complexity and delivery scope.',
    },
    {
        title: 'Stack',
        text: 'Review the chosen platform setup before generating documentation.',
    },
];

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
            devops: { count: 1, level: 'senior' },
        },
        stack: {
            frontend: 'React',
            backend: 'Node.js',
            database: 'PostgreSQL',
            cloud: 'AWS',
        },
    });

    const handleReqChange = (event) => setFormData({ ...formData, requirements: event.target.value });

    const handleTeamChange = (role, field, value) => {
        setFormData((prev) => ({
            ...prev,
            team: {
                ...prev.team,
                [role]: {
                    ...prev.team[role],
                    [field]: value,
                },
            },
        }));
    };

    const handleStackChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            stack: {
                ...prev.stack,
                [field]: value,
            },
        }));
    };

    const handleAutoFill = async () => {
        if (!formData.requirements) {
            return;
        }

        setLoading(true);
        try {
            const suggestion = await api.suggestConfiguration(formData.requirements);
            if (suggestion) {
                setFormData((prev) => ({
                    ...prev,
                    team: { ...prev.team, ...suggestion.team },
                    stack: { ...prev.stack, ...suggestion.stack },
                }));
                setStep(2);
            }
        } catch (error) {
            console.error('Auto-fill failed', error);
            alert('Failed to auto-fill configuration.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await api.createProject(formData);
            if (response.error) {
                alert(`${response.error}: ${response.details ? response.details.join(', ') : ''}`);
                return;
            }
            navigate(`/projects/${response.projectId}`);
        } catch (error) {
            console.error(error);
            alert('Failed to generate documentation. See console.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="card loading-state">
                <div className="status-card">
                    <div className="spinner" />
                    <div>
                        <strong>Generating documentation</strong>
                        <p>The agents are analyzing requirements, researching the stack, and assembling your final document.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <div className="page-stack">
            <section className="page-hero">
                <div className="hero-copy">
                    <span className="hero-kicker">New Project</span>
                    <h1 className="hero-title">A tidier flow for turning rough briefs into polished documentation.</h1>
                    <p className="hero-description">
                        Move step by step, adjust the delivery team, and let the app shape the final project document for you.
                    </p>
                </div>
                <div className="hero-actions">
                    <button className="btn btn-secondary" onClick={handleAutoFill} disabled={!formData.requirements}>
                        <Wand2 size={18} />
                        Auto-Fill with AI
                    </button>
                    {step === 3 && (
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            <Sparkles size={18} />
                            Generate Documentation
                        </button>
                    )}
                </div>
            </section>

            <div className="form-shell">
                <section className="form-section">
                    {step === 1 && (
                        <div className="card panel">
                            <div className="panel-header">
                                <div>
                                    <h2 className="panel-title">Step 1. Project Requirements</h2>
                                    <p className="panel-description">Describe the product goal, critical workflows, users, and constraints.</p>
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Project brief</label>
                                <textarea
                                    className="input-field"
                                    value={formData.requirements}
                                    onChange={handleReqChange}
                                    placeholder="Example: Build a workflow platform for enterprise support teams with analytics, ticket triage, role-based access, PDF exports, and operational dashboards."
                                />
                                <span className="input-hint">The more specific the brief, the more useful the generated documentation will be.</span>
                            </div>

                            <div className="action-row">
                                <span className="muted">Need a head start? Use AI auto-fill once your brief is in place.</span>
                                <button className="btn btn-primary" onClick={() => setStep(2)}>
                                    Continue to Team
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="card panel">
                            <div className="panel-header">
                                <div>
                                    <h2 className="panel-title">Step 2. Team Selection</h2>
                                    <p className="panel-description">Tune the delivery team so timelines and cost estimates feel realistic.</p>
                                </div>
                            </div>

                            <div className="field-grid">
                                {Object.keys(formData.team).map((role) => (
                                    <div key={role} className="role-card">
                                        <div className="role-card-header">
                                            <h3 className="role-title">{role.replaceAll('_', ' ')}</h3>
                                            <p className="role-subtitle">Staffing input for estimation and planning.</p>
                                        </div>
                                        <div className="field-grid two-col">
                                            <div className="input-group">
                                                <label className="input-label">Count</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="input-field"
                                                    value={formData.team[role].count}
                                                    onChange={(event) => handleTeamChange(role, 'count', parseInt(event.target.value, 10))}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">Level</label>
                                                <select
                                                    className="input-field"
                                                    value={formData.team[role].level}
                                                    onChange={(event) => handleTeamChange(role, 'level', event.target.value)}
                                                >
                                                    <option value="junior">Junior</option>
                                                    <option value="mid">Mid</option>
                                                    <option value="senior">Senior</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="action-row">
                                <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                                <button className="btn btn-primary" onClick={() => setStep(3)}>Continue to Stack</button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="card panel">
                            <div className="panel-header">
                                <div>
                                    <h2 className="panel-title">Step 3. Tech Stack</h2>
                                    <p className="panel-description">Confirm the platform choices that will anchor the final recommendation.</p>
                                </div>
                            </div>

                            <div className="field-grid two-col">
                                {Object.keys(formData.stack).map((techKey) => (
                                    <div key={techKey} className="input-group">
                                        <label className="input-label" style={{ textTransform: 'capitalize' }}>{techKey}</label>
                                        <input
                                            className="input-field"
                                            value={formData.stack[techKey]}
                                            onChange={(event) => handleStackChange(techKey, event.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="action-row">
                                <button className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
                                <button className="btn btn-primary" onClick={handleSubmit}>
                                    <Sparkles size={18} />
                                    Generate Documentation
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                <aside className="sticky-side">
                    <div className="card helper-card">
                        <div className="panel-header">
                            <div>
                                <h2 className="panel-title">Build Flow</h2>
                                <p className="panel-description">A clearer step-by-step workspace for the agent-driven generation process.</p>
                            </div>
                        </div>

                        <div className="stepper">
                            {stepContent.map((item, index) => (
                                <div
                                    key={item.title}
                                    className={`step-item${step === index + 1 ? ' active' : ''}`}
                                >
                                    <div className="step-index">{index + 1}</div>
                                    <div>
                                        <div className="step-title">{item.title}</div>
                                        <div className="step-text">{item.text}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="helper-list">
                            <div className="helper-item">
                                <strong>Best results come from specific briefs</strong>
                                <span>Include workflows, user types, integrations, compliance needs, and scale expectations.</span>
                            </div>
                            <div className="helper-item">
                                <strong>AI auto-fill is optional</strong>
                                <span>Use it to speed up staffing and stack choices, then refine the inputs before generating.</span>
                            </div>
                            <div className="helper-item">
                                <strong>Nothing about the backend flow changed</strong>
                                <span>This refresh focuses on clarity, hierarchy, spacing, and a neater screen rhythm.</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CreateProject;
