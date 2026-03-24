import React, { useEffect, useState } from 'react';
import { DollarSign, FileText, PieChart, TrendingUp } from 'lucide-react';
import { api } from '../api';

const metricCards = [
    {
        key: 'totalCost',
        label: 'Total Spend',
        note: 'Lifetime API cost across all runs',
        icon: DollarSign,
    },
    {
        key: 'projectCount',
        label: 'Projects',
        note: 'Documentation sets generated so far',
        icon: FileText,
    },
    {
        key: 'avgCost',
        label: 'Average Cost',
        note: 'Mean spend per documentation run',
        icon: TrendingUp,
    },
];

const Stats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getStats()
            .then((data) => setStats(data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <section className="card loading-state">
                <div className="status-card">
                    <div className="spinner" />
                    <div>
                        <strong>Loading analytics</strong>
                        <p>Summarizing spend and document activity.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <div className="page-stack">
            <section className="page-hero compact">
                <div className="hero-copy">
                    <span className="hero-kicker">Analytics</span>
                    <h1 className="hero-title">Clear usage tracking without the clutter.</h1>
                    <p className="hero-description">
                        Monitor spend, average run cost, and how much documentation the system has produced so far.
                    </p>
                </div>
                <div className="badge">
                    <PieChart size={16} />
                    Live usage snapshot
                </div>
            </section>

            <section className="stats-grid">
                {metricCards.map(({ key, label, note, icon: Icon }) => (
                    <article key={key} className="card stat-card">
                        <div className="stat-card-body">
                            <div className="metric-icon">
                                <Icon size={20} />
                            </div>
                            <div className="metric-label">{label}</div>
                            <div className="metric-value">
                                {key === 'projectCount' ? stats[key] : `₹${stats[key]}`}
                            </div>
                            <div className="metric-note">{note}</div>
                        </div>
                    </article>
                ))}
            </section>

            <section className="card panel">
                <div className="panel-header">
                    <div>
                        <h2 className="panel-title">Usage Breakdown</h2>
                        <p className="panel-description">
                            The backend already stores detailed usage logs. This panel is ready for a richer per-model chart in a later pass.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Stats;
