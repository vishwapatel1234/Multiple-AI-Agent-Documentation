require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');

const db = require('./src/db/connection');
const aiService = require('./src/ai/aiService');
const { validateProjectInputs } = require('./src/rules/validation');
const testCases = require('./qa_dataset');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const reqAnalysisSchema = z.object({
    summary: z.array(z.string()),
    project_type: z.string(),
    explicit_requirements: z.array(z.string()),
    assumptions: z.array(z.string()),
    missing_information: z.array(z.string()),
});

const modulesSchema = z.object({
    modules: z.array(z.object({
        module_name: z.string(),
        description: z.string(),
        features: z.array(z.string()),
        dependencies: z.array(z.string()),
    })),
});

const suggestionSchema = z.object({
    team: z.record(z.string(), z.any()),
    stack: z.record(z.string(), z.any()),
});

function parseArgs(argv) {
    const envMode = process.env.QA_MODE || 'real';
    const options = {
        mode: envMode,
        iterations: envMode === 'mock' ? 10 : 3,
        consistencyRuns: envMode === 'mock' ? 20 : 5,
        categories: null,
        delayMs: Number(process.env.QA_DELAY_MS || 8000),
        iterationCooldownMs: Number(process.env.QA_ITERATION_COOLDOWN_MS || 15000),
        retries: Number(process.env.QA_RETRIES || 3),
    };

    argv.forEach((arg) => {
        if (arg.startsWith('--iterations=')) {
            options.iterations = Number(arg.split('=')[1]) || options.iterations;
        } else if (arg.startsWith('--consistency-runs=')) {
            options.consistencyRuns = Number(arg.split('=')[1]) || options.consistencyRuns;
        } else if (arg.startsWith('--categories=')) {
            options.categories = arg.split('=')[1].split(',').map((value) => value.trim()).filter(Boolean);
        } else if (arg.startsWith('--mode=')) {
            options.mode = arg.split('=')[1] || options.mode;
        } else if (arg.startsWith('--delay-ms=')) {
            options.delayMs = Number(arg.split('=')[1]) || options.delayMs;
        } else if (arg.startsWith('--iteration-cooldown-ms=')) {
            options.iterationCooldownMs = Number(arg.split('=')[1]) || options.iterationCooldownMs;
        } else if (arg.startsWith('--retries=')) {
            options.retries = Number(arg.split('=')[1]) || options.retries;
        }
    });

    return options;
}

function createTempProject(input, team, stack) {
    const projectId = `qa-${uuidv4()}`;
    db.prepare('INSERT INTO projects (id, requirements, team_selection, tech_stack) VALUES (?, ?, ?, ?)')
        .run(projectId, input, JSON.stringify(team || {}), JSON.stringify(stack || {}));
    return projectId;
}

function cleanupProject(projectId) {
    db.prepare('DELETE FROM usage_logs WHERE project_id = ?').run(projectId);
    db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
}

function formatError(error) {
    return error?.message || String(error);
}

function isRetryableError(error) {
    const message = formatError(error);
    return error?.status === 429 ||
        error?.status === 503 ||
        message.includes('429') ||
        message.includes('503') ||
        message.toLowerCase().includes('rate limit') ||
        message.toLowerCase().includes('fetch failed');
}

function isRateLimitError(error) {
    const message = formatError(error).toLowerCase();
    return error?.status === 429 ||
        error?.code === 'RATE_LIMIT' ||
        message.includes('quota exceeded') ||
        message.includes('rate limit') ||
        message.includes('429');
}

async function callWithRetry(fn, retries = 3, initialDelayMs = 2000) {
    let delayMs = initialDelayMs;

    for (let attempt = 0; attempt < retries; attempt += 1) {
        try {
            return await fn();
        } catch (error) {
            if (!isRetryableError(error) || attempt === retries - 1) {
                throw error;
            }

            await sleep(delayMs);
            delayMs *= 2;
        }
    }
}

function buildMockAnalysis(input) {
    const text = (input || '').toLowerCase();
    const projectType = text.includes('compliance')
        ? 'compliance platform'
        : text.includes('app')
            ? 'web application'
            : text.includes('platform')
                ? 'platform'
                : 'software system';

    const requirements = input
        .split(/[,.]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, 5);

    return {
        summary: requirements.slice(0, 3),
        project_type: projectType,
        explicit_requirements: requirements,
        assumptions: requirements.length ? ['Assumed standard authentication and admin workflows.'] : ['Input is unclear and may require clarification.'],
        missing_information: requirements.length ? ['Detailed non-functional requirements are not fully specified.'] : ['No usable project description provided.'],
    };
}

function buildMockModules(input) {
    const text = (input || '').toLowerCase();
    const modules = [
        {
            module_name: 'Authentication & Access Control',
            description: 'Handles login, identity, and role-based access.',
            features: ['User authentication', 'Role management', 'Session handling'],
            dependencies: ['Database'],
        },
        {
            module_name: text.includes('analytics') ? 'Analytics & Reporting' : 'Core Business Workflows',
            description: 'Supports the main user-facing workflows for the requested system.',
            features: ['Primary business flows', 'Dashboards', 'Operational reporting'],
            dependencies: ['Authentication & Access Control', 'Database'],
        },
        {
            module_name: 'Integration Layer',
            description: 'Manages third-party APIs and internal service communication.',
            features: ['API adapters', 'Data sync', 'Error handling'],
            dependencies: ['Core Business Workflows'],
        },
    ];

    return { modules };
}

function buildMockSuggestion() {
    return {
        team: {
            product_manager: { count: 1, level: 'senior' },
            frontend_dev: { count: 1, level: 'mid' },
            backend_dev: { count: 1, level: 'senior' },
        },
        stack: {
            frontend: 'React',
            backend: 'Node.js',
            database: 'PostgreSQL',
            cloud: 'AWS',
        },
    };
}

function determineMockRoute(input) {
    const text = (input || '').toLowerCase();
    if (text.includes('gdpr') || text.includes('compliance') || text.includes('consent')) {
        return 'compliance_core';
    }
    return 'architecture_core';
}

function getPreferredModels(options) {
    if (options.mode === 'real') {
        return process.env.QA_REAL_MODEL ? [process.env.QA_REAL_MODEL] : null;
    }

    return null;
}

async function maybeThrottle(options) {
    if (options.mode === 'real' && options.delayMs > 0) {
        const jitter = Math.random() * 2000;
        await sleep(options.delayMs + jitter);
    }
}

async function runRealAiCall(fn, options) {
    await maybeThrottle(options);
    return callWithRetry(fn, options.retries, options.delayMs);
}

function scoreOutput(output) {
    let score = 0;

    if (output && typeof output === 'object' && !Array.isArray(output)) score += 1;
    if (output?.components || output?.modules || output?.summary) score += 1;
    if (output?.data_flow || output?.dependencies || output?.missing_information || output?.modules) score += 1;

    return score;
}

function assertValidAnalysisOutput(output) {
    const parsed = reqAnalysisSchema.safeParse(output);
    if (!parsed.success) {
        throw new Error(parsed.error.message);
    }

    if (output.summary.length === 0) {
        throw new Error('Requirement Analysis returned an empty summary');
    }

    if (output.explicit_requirements.length === 0 && output.missing_information.length === 0) {
        throw new Error('Requirement Analysis returned too little usable structure');
    }
}

function assertValidModulesOutput(output) {
    const parsed = modulesSchema.safeParse(output);
    if (!parsed.success) {
        throw new Error(parsed.error.message);
    }

    if (output.modules.length < 2) {
        throw new Error('Module Breakdown returned too few components');
    }
}

function compareConsistency(outputs) {
    if (outputs.length <= 1) {
        return {
            totalRuns: outputs.length,
            similarityScore: 1,
            consistencyRate: 1,
        };
    }

    const reference = outputs[0];
    const scores = outputs.slice(1).map((output) => {
        let score = 0;

        if (Object.keys(reference).sort().join('|') === Object.keys(output).sort().join('|')) score += 1;
        if ((reference.project_type || '').toLowerCase() === (output.project_type || '').toLowerCase()) score += 1;
        if (Math.abs((reference.summary?.length || 0) - (output.summary?.length || 0)) <= 1) score += 1;
        if (Math.abs((reference.explicit_requirements?.length || 0) - (output.explicit_requirements?.length || 0)) <= 2) score += 1;
        if (Math.abs((reference.assumptions?.length || 0) - (output.assumptions?.length || 0)) <= 2) score += 1;

        return score / 5;
    });

    const similarityScore = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    return {
        totalRuns: outputs.length,
        similarityScore: Number(similarityScore.toFixed(2)),
        consistencyRate: Number(similarityScore.toFixed(2)),
    };
}

async function analyzeRequirements(projectId, input, options) {
    if (options.mode === 'mock') {
        return buildMockAnalysis(input);
    }

    return runRealAiCall(
        () => aiService.analyzeRequirements(projectId, input, { preferredModels: getPreferredModels(options) }),
        options
    );
}

async function breakdownModules(projectId, analysis, input, options) {
    if (options.mode === 'mock') {
        return buildMockModules(input);
    }

    return runRealAiCall(
        () => aiService.breakdownModules(projectId, analysis, { preferredModels: getPreferredModels(options) }),
        options
    );
}

async function suggestTeamAndStack(projectId, input, options) {
    if (options.mode === 'mock') {
        return buildMockSuggestion();
    }

    return runRealAiCall(
        () => aiService.suggestTeamAndStack(projectId, input, { preferredModels: getPreferredModels(options) }),
        options
    );
}

async function runValidationCase(testCase) {
    const validation = validateProjectInputs(testCase.input, testCase.team, testCase.stack);
    const success = testCase.expectedError ? !validation.valid : validation.valid;

    return {
        success,
        score: success ? 1 : 0,
        details: validation,
        error: success ? null : 'Validation outcome did not match expectation',
    };
}

async function runAnalysisCase(testCase, options) {
    const projectId = createTempProject(testCase.input, testCase.team, testCase.stack);

    try {
        const analysis = await analyzeRequirements(projectId, testCase.input, options);
        assertValidAnalysisOutput(analysis);
        const projectType = (analysis.project_type || '').toLowerCase();
        const typeMatch = testCase.expectedTypeIncludes
            ? testCase.expectedTypeIncludes.some((value) => projectType.includes(value.toLowerCase()))
            : true;
        const fallbackSignals = testCase.expectFallbackSignals
            ? analysis.missing_information.length > 0 || analysis.assumptions.length > 0
            : true;

        return {
            success: typeMatch && fallbackSignals,
            score: scoreOutput(analysis) + 1,
            details: analysis,
            error: !typeMatch ? 'Project type did not match expectation' : !fallbackSignals ? 'Fallback signals missing' : null,
        };
    } finally {
        cleanupProject(projectId);
    }
}

async function runPipelineCase(testCase, options) {
    const projectId = createTempProject(testCase.input, testCase.team, testCase.stack);

    try {
        const requirementAnalysis = await analyzeRequirements(projectId, testCase.input, options);
        const modules = await breakdownModules(projectId, requirementAnalysis, testCase.input, options);

        assertValidAnalysisOutput(requirementAnalysis);
        assertValidModulesOutput(modules);
        const typeMatch = testCase.expectedTypeIncludes
            ? testCase.expectedTypeIncludes.some((value) => requirementAnalysis.project_type.toLowerCase().includes(value.toLowerCase()))
            : true;

        return {
            success: typeMatch,
            score:
                1 +
                1 +
                (typeMatch ? 1 : 0) +
                1,
            details: {
                requirementAnalysis,
                modules,
                mode: options.mode,
                executedSteps: ['Requirement Analysis', 'Module Breakdown'],
            },
            error: !typeMatch ? 'Project type did not match expectation' : null,
        };
    } finally {
        cleanupProject(projectId);
    }
}

async function runSuggestionCase(testCase, options) {
    const projectId = createTempProject('QA suggestion placeholder', testCase.team || {}, testCase.stack || {});

    try {
        const suggestion = await suggestTeamAndStack(projectId, testCase.input, options);
        const parsed = suggestionSchema.safeParse(suggestion);
        if (!parsed.success) {
            throw new Error(parsed.error.message);
        }

        return {
            success: true,
            score: 2,
            details: suggestion,
            error: null,
        };
    } finally {
        cleanupProject(projectId);
    }
}

async function runConsistencyCase(testCase, options) {
    const outputs = [];

    for (let index = 0; index < options.consistencyRuns; index += 1) {
        const projectId = createTempProject(testCase.input, testCase.team, testCase.stack);
        try {
            const analysis = await analyzeRequirements(projectId, testCase.input, options);
            assertValidAnalysisOutput(analysis);
            outputs.push(analysis);
        } finally {
            cleanupProject(projectId);
        }
    }

    const summary = compareConsistency(outputs);
    const success = summary.consistencyRate >= 0.7;

    return {
        success,
        score: success ? 3 : 1,
        details: summary,
        error: success ? null : 'Consistency rate fell below threshold',
    };
}

async function runRoutingCase(testCase, options) {
    const detectedRoute = determineMockRoute(testCase.input);
    const isPlaceholder = options.mode === 'mock';

    return {
        success: detectedRoute === testCase.expectedRoute,
        skipped: false,
        score: detectedRoute === testCase.expectedRoute ? 2 : 0,
        details: {
            expectedRoute: testCase.expectedRoute,
            detectedRoute,
            evaluator: isPlaceholder ? 'qa-mock-router' : 'qa-contract-router',
        },
        error: detectedRoute === testCase.expectedRoute ? null : 'Routing expectation mismatch',
    };
}

async function executeTestCase(testCase, options) {
    const startedAt = performance.now();

    try {
        let outcome;

        switch (testCase.mode) {
            case 'validation':
                outcome = await runValidationCase(testCase, options);
                break;
            case 'analysis':
                outcome = await runAnalysisCase(testCase, options);
                break;
            case 'pipeline':
                outcome = await runPipelineCase(testCase, options);
                break;
            case 'suggestion':
                outcome = await runSuggestionCase(testCase, options);
                break;
            case 'consistency':
                outcome = await runConsistencyCase(testCase, options);
                break;
            case 'routing':
                outcome = await runRoutingCase(testCase, options);
                break;
            default:
                throw new Error(`Unsupported test mode: ${testCase.mode}`);
        }

        return {
            id: testCase.id,
            category: testCase.category,
            mode: testCase.mode,
            qaMode: options.mode,
            durationMs: Number((performance.now() - startedAt).toFixed(2)),
            status: outcome.skipped ? 'SKIPPED' : outcome.success ? 'PASS' : 'FAIL',
            ...outcome,
        };
    } catch (error) {
        if (isRateLimitError(error)) {
            return {
                id: testCase.id,
                category: testCase.category,
                mode: testCase.mode,
                qaMode: options.mode,
                durationMs: Number((performance.now() - startedAt).toFixed(2)),
                success: false,
                skipped: true,
                status: 'SKIPPED',
                score: 0,
                error: 'RATE_LIMIT',
                details: { retry: true, message: formatError(error) },
            };
        }

        return {
            id: testCase.id,
            category: testCase.category,
            mode: testCase.mode,
            qaMode: options.mode,
            durationMs: Number((performance.now() - startedAt).toFixed(2)),
            success: false,
            skipped: false,
            status: 'ERROR',
            score: 0,
            error: formatError(error),
            details: null,
        };
    }
}

function summarizeResults(results, options) {
    const executed = results.filter((result) => !result.skipped);
    const skipped = results.filter((result) => result.skipped);
    const successes = executed.filter((result) => result.success);
    const failures = executed.filter((result) => result.status === 'FAIL');
    const errors = executed.filter((result) => result.status === 'ERROR');
    const averageDuration = executed.length
        ? Number((executed.reduce((sum, result) => sum + result.durationMs, 0) / executed.length).toFixed(2))
        : 0;

    const errorCounts = [...failures, ...errors].reduce((acc, result) => {
        const key = result.error || 'Unknown error';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    return {
        generatedAt: new Date().toISOString(),
        config: options,
        totals: {
            totalResults: results.length,
            executed: executed.length,
            skipped: skipped.length,
            successCount: successes.length,
            failureCount: failures.length,
            errorCount: errors.length,
            successRate: executed.length ? Number(((successes.length / executed.length) * 100).toFixed(2)) : 0,
            averageDurationMs: averageDuration,
        },
        commonErrors: Object.entries(errorCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([message, count]) => ({ message, count })),
        results,
    };
}

function printSummary(report) {
    console.log('\nAI Agent QA Report');
    console.log('------------------');
    console.log(`Generated At: ${report.generatedAt}`);
    console.log(`Mode: ${report.config.mode}`);
    console.log(`Total Results: ${report.totals.totalResults}`);
    console.log(`Executed: ${report.totals.executed}`);
    console.log(`Skipped: ${report.totals.skipped}`);
    console.log(`Errors: ${report.totals.errorCount}`);
    console.log(`Success Rate: ${report.totals.successRate}%`);
    console.log(`Average Duration: ${report.totals.averageDurationMs} ms`);

    if (report.commonErrors.length > 0) {
        console.log('\nCommon Errors:');
        report.commonErrors.forEach((entry) => {
            console.log(`- ${entry.message} (${entry.count})`);
        });
    }

    console.log('\nCase Breakdown:');
    report.results.forEach((result) => {
        console.log(`- [${result.status}] ${result.id} (${result.category}/${result.mode}/${result.qaMode}) in ${result.durationMs} ms`);
    });
}

function writeReport(report) {
    const reportsDir = path.join(__dirname, 'data', 'qa-reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const filename = `qa-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const reportPath = path.join(reportsDir, filename);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    return reportPath;
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const filteredCases = options.categories
        ? testCases.filter((testCase) => options.categories.includes(testCase.category))
        : testCases;

    const results = [];

    for (let iteration = 0; iteration < options.iterations; iteration += 1) {
        console.log(`\nIteration ${iteration + 1}/${options.iterations}`);

        for (const testCase of filteredCases) {
            const result = await executeTestCase(testCase, options);
            results.push(result);
            console.log(`${result.skipped ? 'SKIPPED' : result.success ? 'PASS' : 'FAIL'} ${testCase.id}`);
        }

        if (iteration < options.iterations - 1 && options.iterationCooldownMs > 0) {
            await sleep(options.iterationCooldownMs);
        }
    }

    const report = summarizeResults(results, options);
    const reportPath = writeReport(report);

    printSummary(report);
    console.log(`\nReport saved to: ${reportPath}`);

    if (report.totals.failureCount > 0 || report.totals.errorCount > 0) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error('QA Runner failed:', error);
    process.exit(1);
});
