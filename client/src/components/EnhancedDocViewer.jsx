import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Globe, Settings, Zap, Database, Plug, Package, Clock, Users, Code, DollarSign } from 'lucide-react';
import { marked } from 'marked';

// Icon mapping for different section types
const sectionIcons = {
    'project overview': Globe,
    'requirements': Zap,
    'timeline': Clock,
    'system architecture': Settings,
    'technology stack': Code,
    'cost estimation': DollarSign,
    'team': Users,
    'modules': Package,
};

// Architecture component visualization
const ArchitectureVisual = () => {
    return (
        <div className="architecture-visual">
            <div className="architecture-layer">
                <div className="arch-title">Client Layer</div>
                <div className="arch-component user-component">
                    <Globe size={24} />
                    <div className="component-label">User/Client</div>
                </div>
            </div>

            <div className="flow-arrow">↓</div>

            <div className="architecture-layer">
                <div className="arch-title">Core Orchestration</div>
                <div className="arch-component core-component">
                    <Settings size={24} />
                    <div className="component-label">Orchestrator Core</div>
                </div>
            </div>

            <div className="flow-arrow">↓</div>

            <div className="architecture-layer">
                <div className="arch-title">Agent Communication Layer</div>
                <div className="arch-component-group">
                    <div className="arch-component agent-component">
                        <Zap size={20} />
                        <div className="component-label-sm">Research Agent</div>
                    </div>
                    <div className="arch-component agent-component">
                        <Zap size={20} />
                        <div className="component-label-sm">Business Agent</div>
                    </div>
                    <div className="arch-component agent-component">
                        <Zap size={20} />
                        <div className="component-label-sm">Development Agent</div>
                    </div>
                    <div className="arch-component agent-component">
                        <Zap size={20} />
                        <div className="component-label-sm">Brand Agent</div>
                    </div>
                </div>
            </div>

            <div className="flow-arrow">↓</div>

            <div className="architecture-layer">
                <div className="arch-title">External Services</div>
                <div className="arch-component-group">
                    <div className="arch-component api-component">
                        <Plug size={20} />
                        <div className="component-label-sm">External LLM APIs</div>
                        <div className="component-detail">OpenAI, Anthropic</div>
                    </div>
                    <div className="arch-component api-component">
                        <Database size={20} />
                        <div className="component-label-sm">Vector Database</div>
                        <div className="component-detail">ChromaDB, Pinecone</div>
                    </div>
                    <div className="arch-component api-component">
                        <Database size={20} />
                        <div className="component-label-sm">Relational Database</div>
                        <div className="component-detail">PostgreSQL</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Collapsible section component
const CollapsibleSection = ({ title, children, defaultExpanded = false, icon: Icon }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className="collapsible-section">
            <button
                className="section-header"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                {Icon && <Icon size={20} className="section-icon" />}
                <h2>{title}</h2>
                <div className="expand-icon">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </button>
            {isExpanded && (
                <div className="section-content">
                    {children}
                </div>
            )}
        </div>
    );
};

// Enhanced markdown renderer with better styling
const MarkdownContent = ({ content }) => {
    return (
        <div
            className="enhanced-markdown"
            dangerouslySetInnerHTML={{ __html: marked.parse(content || '') }}
        />
    );
};

// Main enhanced documentation viewer
const EnhancedDocViewer = ({ content }) => {
    if (!content) {
        return <div className="doc-placeholder">No documentation available</div>;
    }

    // Split content into sections based on markdown headers
    const sections = [];
    const lines = content.split('\n');
    let currentSection = { title: '', content: '', level: 0 };

    lines.forEach((line) => {
        const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
        if (headerMatch && headerMatch[1].length <= 2) {
            if (currentSection.title) {
                sections.push(currentSection);
            }
            currentSection = {
                title: headerMatch[2],
                content: '',
                level: headerMatch[1].length,
            };
        } else {
            currentSection.content += line + '\n';
        }
    });

    if (currentSection.title) {
        sections.push(currentSection);
    }

    return (
        <div className="enhanced-doc-viewer">
            {sections.map((section, index) => {
                const normalizedTitle = section.title.toLowerCase();
                const IconComponent = Object.keys(sectionIcons).find(key =>
                    normalizedTitle.includes(key)
                ) ? sectionIcons[Object.keys(sectionIcons).find(key => normalizedTitle.includes(key))] : null;

                // Check if this is the architecture section
                const isArchitecture = normalizedTitle.includes('architecture') ||
                    normalizedTitle.includes('system design');

                // Determine if should be expanded by default
                const defaultExpanded = index === 0 || isArchitecture;

                return (
                    <CollapsibleSection
                        key={index}
                        title={section.title}
                        icon={IconComponent}
                        defaultExpanded={defaultExpanded}
                    >
                        {isArchitecture ? (
                            <>
                                <ArchitectureVisual />
                                <MarkdownContent content={section.content} />
                            </>
                        ) : (
                            <MarkdownContent content={section.content} />
                        )}
                    </CollapsibleSection>
                );
            })}
        </div>
    );
};

export default EnhancedDocViewer;
