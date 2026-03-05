import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Layers, PieChart, PlusCircle, Moon, Sun } from 'lucide-react';
import '../index.css';

const Layout = () => {
    // Initialize theme from localStorage or default to 'dark'
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });

    // Apply theme to document and save to localStorage
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="app-container">
            <nav className="navbar" style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1rem 2rem',
                backgroundColor: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--bg-card)'
            }}>
                <div className="logo" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-accent)' }}>
                    <Layers size={24} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    DocGen AI
                </div>
                <div className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <Layers size={18} /> Projects
                    </Link>
                    <Link to="/create" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <PlusCircle size={18} /> New Project
                    </Link>
                    <Link to="/stats" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <PieChart size={18} /> Cost Stats
                    </Link>
                    <button
                        onClick={toggleTheme}
                        style={{
                            background: 'var(--bg-accent)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--border-radius-sm)',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-primary)',
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'var(--primary-color)';
                            e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'var(--bg-accent)';
                            e.target.style.transform = 'scale(1)';
                        }}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </nav>
            <main className="container" style={{ marginTop: '2rem' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
