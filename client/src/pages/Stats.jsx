import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { PieChart, TrendingUp, DollarSign, FileText } from 'lucide-react';

const Stats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getStats().then(data => {
            setStats(data);
            setLoading(false);
        });
    }, []);

    if (loading) return <div>Loading stats...</div>;

    return (
        <div>
            <h1>Cost & Usage Analytics</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.1)' }}>
                            <DollarSign color="var(--text-accent)" size={24} />
                        </div>
                        <h3 style={{ margin: 0 }}>Total Spend</h3>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>₹{stats.totalCost}</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Lifetime API costs</p>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                            <FileText color="var(--success-color)" size={24} />
                        </div>
                        <h3 style={{ margin: 0 }}>Projects</h3>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.projectCount}</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Generated Documents</p>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                            <TrendingUp color="var(--warning-color)" size={24} />
                        </div>
                        <h3 style={{ margin: 0 }}>Avg. Cost</h3>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>₹{stats.avgCost}</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Per Document</p>
                </div>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <h3>Usage Breakdown</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Detailed usage logs are stored in the backend database.
                    <br />
                    In a future update, this section will show a chart of token usage per model (GPT-4o vs GPT-4o-mini).
                </p>
            </div>
        </div>
    );
};

export default Stats;
