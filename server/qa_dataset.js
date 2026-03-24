const defaultTeam = {
    product_manager: { count: 1, level: 'senior' },
    frontend_dev: { count: 1, level: 'mid' },
    backend_dev: { count: 1, level: 'senior' },
    ai_engineer: { count: 1, level: 'senior' },
    qa_engineer: { count: 1, level: 'mid' },
    devops: { count: 1, level: 'senior' },
};

const defaultStack = {
    frontend: 'React',
    backend: 'Node.js',
    database: 'PostgreSQL',
    cloud: 'AWS',
};

module.exports = [
    {
        id: 'functional-food-delivery',
        category: 'functional',
        mode: 'pipeline',
        input: 'Build a food delivery app with user accounts, restaurant onboarding, live delivery tracking, payments, ratings, and an admin dashboard.',
        team: defaultTeam,
        stack: defaultStack,
        expectedTypeIncludes: ['app', 'platform', 'web', 'software', 'development'],
    },
    {
        id: 'functional-ecommerce',
        category: 'functional',
        mode: 'pipeline',
        input: 'Create an e-commerce web platform with catalog search, carts, checkout, order tracking, seller management, and analytics.',
        team: defaultTeam,
        stack: defaultStack,
        expectedTypeIncludes: ['web', 'e-commerce', 'platform', 'software', 'development'],
    },
    {
        id: 'edge-empty-input',
        category: 'edge',
        mode: 'validation',
        input: '',
        team: defaultTeam,
        stack: defaultStack,
        expectedError: true,
    },
    {
        id: 'edge-random-text',
        category: 'edge',
        mode: 'analysis',
        input: 'asdkjashdkajshd qweoiu zxcmn random idea maybe app maybe ai maybe nothing',
        team: defaultTeam,
        stack: defaultStack,
        expectFallbackSignals: true,
    },
    {
        id: 'edge-mixed-language',
        category: 'edge',
        mode: 'analysis',
        input: 'Banaye ek hospital management app with patient records, doctor scheduling, billing, and HIPAA style security.',
        team: defaultTeam,
        stack: defaultStack,
        expectedTypeIncludes: ['app', 'platform', 'system', 'software', 'management', 'hospital'],
    },
    {
        id: 'edge-typos',
        category: 'edge',
        mode: 'analysis',
        input: 'Bulid a crm platfrom for salez team with lead mangement, followups, dashbords, and role base acces.',
        team: defaultTeam,
        stack: defaultStack,
        expectedTypeIncludes: ['crm', 'platform', 'system', 'software', 'sales'],
    },
    {
        id: 'edge-very-long',
        category: 'edge',
        mode: 'analysis',
        input: `
        Build an enterprise operations platform for a logistics company.
        It should support shipment planning, route optimization, warehouse operations, vendor management,
        billing workflows, analytics dashboards, mobile field access, audit logs, document uploads,
        SSO, configurable permissions, API integrations, SLA monitoring, alerting, and region-wise reporting.
        The system must support high concurrency, disaster recovery, data retention policies, and phased rollout.
        `.trim(),
        team: defaultTeam,
        stack: defaultStack,
        expectedTypeIncludes: ['platform', 'system', 'enterprise', 'software', 'logistics'],
    },
    {
        id: 'routing-gdpr-placeholder',
        category: 'routing',
        mode: 'routing',
        input: 'Check GDPR compliance for user data handling and consent tracking.',
        expectedRoute: 'compliance_core',
    },
    {
        id: 'routing-architecture-placeholder',
        category: 'routing',
        mode: 'routing',
        input: 'Design a scalable architecture for an internal analytics platform.',
        expectedRoute: 'architecture_core',
    },
    {
        id: 'consistency-food-delivery',
        category: 'consistency',
        mode: 'consistency',
        input: 'Build a food delivery app with real-time order tracking, driver dispatch, payment integration, and ratings.',
        team: defaultTeam,
        stack: defaultStack,
    },
    {
        id: 'suggestion-basic',
        category: 'functional',
        mode: 'suggestion',
        input: 'Suggest a starter team and stack for a SaaS analytics dashboard with authentication and reporting.',
        team: defaultTeam,
        stack: defaultStack,
    },
];
