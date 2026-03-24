import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Layers3, PieChart, PlusCircle, Moon, Sun } from 'lucide-react';
import '../index.css';

const navItems = [
    { to: '/', label: 'Projects', icon: Layers3, end: true },
    { to: '/create', label: 'New Project', icon: PlusCircle },
    { to: '/stats', label: 'Cost Stats', icon: PieChart },
];

const Layout = () => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <div className="app-shell">
            <div className="app-frame">
                <header className="app-header">
                    <div className="brand">
                        <div className="brand-mark">
                            <Layers3 size={24} />
                        </div>
                        <div className="brand-copy">
                            <span className="brand-eyebrow">Documentation Studio</span>
                            <span className="brand-title">DocGen AI</span>
                            <span className="brand-subtitle">Sharper project documentation with a calmer workflow.</span>
                        </div>
                    </div>

                    <div className="nav-cluster">
                        <nav className="nav-links" aria-label="Primary">
                            {navItems.map(({ to, label, icon: Icon, end }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    end={end}
                                    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                                >
                                    <Icon size={18} />
                                    <span>{label}</span>
                                </NavLink>
                            ))}
                        </nav>

                        <button
                            type="button"
                            className="theme-toggle"
                            onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
                            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </header>

                <main className="app-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
