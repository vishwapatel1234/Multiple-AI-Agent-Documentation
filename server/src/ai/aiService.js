const { GoogleGenerativeAI } = require("@google/generative-ai");
const { logUsage } = require('../services/costService');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Default model priority chain
const DEFAULT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3-flash-preview'
];

function resolveModels(preferredModels) {
  if (Array.isArray(preferredModels) && preferredModels.length > 0) {
    return preferredModels;
  }

  return DEFAULT_MODELS;
}

function isRecoverableError(error) {
  return error?.status === 429 ||
    error?.status === 503 ||
    error?.message?.includes('429') ||
    error?.message?.includes('503') ||
    error?.message?.includes('FOREIGN KEY');
}

async function generateWithFallback(projectId, stepName, systemPrompt, userPrompt, jsonMode = true, preferredModels = null) {
  let lastError = null;
  const models = resolveModels(preferredModels);

  for (const modelName of models) {
    try {
      console.log(`[AI Service] Attempting step '${stepName}' with model: ${modelName}`);

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: jsonMode ? "application/json" : "text/plain"
        }
      });

      const fullPrompt = `${systemPrompt}\n\nUser Input:\n${userPrompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      const usage = response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };

      // Log Usage
      logUsage(projectId, stepName, modelName, usage.promptTokenCount, usage.candidatesTokenCount);

      return jsonMode ? JSON.parse(text) : text;

    } catch (error) {
      console.error(`[AI Service] Error with ${modelName}:`, error.message);

      if (isRecoverableError(error)) {
        console.warn(`[AI Service] Rate limit or temporary error for ${modelName}. Switching to next model...`);
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  const finalError = new Error(`All models failed. Last error: ${lastError ? lastError.message : 'Unknown'}`);
  finalError.status = lastError?.status || 500;
  finalError.code = lastError?.status === 429 || lastError?.message?.includes('429') ? 'RATE_LIMIT' : 'MODEL_FALLBACK_FAILED';
  finalError.retry = finalError.code === 'RATE_LIMIT';
  throw finalError;
}

// --- 1. Requirement Analyzer Agent ---
async function analyzeRequirements(projectId, rawRequirements, options = {}) {
  const systemPrompt = `You are a Senior Business Analyst. Turn messy client text into structured understanding.
    Handle multilingual input gracefully.
    Normalize and interpret intent even when the text mixes languages, contains typos, or is noisy.
    
    Output format (JSON only):
    {
      "summary": [],
      "project_type": "",
      "explicit_requirements": [],
      "assumptions": [],
      "missing_information": []
    }`;

  const userPrompt = `Client Requirement:\n${rawRequirements}`;
  return generateWithFallback(projectId, 'Requirement Analysis', systemPrompt, userPrompt, true, options.preferredModels);
}

// --- 2. Research Agent ---
async function researchTechStack(projectId, reqAnalysis, options = {}) {
  const systemPrompt = `You are a Research Agent. Research the best technical solution for the project.
    
    Output format (JSON only):
    {
      "tech_stack_options": [
        {
          "name": "",
          "frontend": [],
          "backend": [],
          "database": [],
          "ai_ml": [],
          "cloud": [],
          "pros": [],
          "cons": []
        }
      ],
      "recommended_stack": "",
      "scalability_notes": []
    }`;

  const userPrompt = `Project Data:\n${JSON.stringify(reqAnalysis)}`;
  return generateWithFallback(projectId, 'Research Tech Stack', systemPrompt, userPrompt, true, options.preferredModels);
}

// --- 3. Cost & Timeline Estimation Agent ---
async function estimateCostAndTimeline(projectId, reqAnalysis, researchData, options = {}) {
  const systemPrompt = `You are a Financial Planner & Project Manager. Estimate cost and timeline (India-based market).
    
    CRITICAL: Use the following specific developer salary rates for your cost calculation (Implied Annual Rates in INR):
    - Junior Level: ₹2,00,000 - ₹2,50,000
    - Medium Level: ₹4,00,000 - ₹5,00,000
    - Senior Level: ₹10,00,000 - ₹14,00,000
    
    Calculate the total project cost based on these rates pro-rated for the project duration and team size.
    
    Output format (JSON only):
    {
      "duration": "",
      "team": [ {"role": "", "count": 0} ],
      "cost_estimation_inr": { "minimum": "₹", "maximum": "₹" },
      "phase_breakdown": [],
      "cost_risk_factors": []
    }
    IMPORTANT: Provide costs strictly in Indian Rupees (INR) using Lakhs/Crores where appropriate. Do NOT use USD.`;

  const userPrompt = `Project Details:\n${JSON.stringify({ ...reqAnalysis, ...researchData })}`;
  return generateWithFallback(projectId, 'Cost & Timeline', systemPrompt, userPrompt, true, options.preferredModels);
}

// --- 4. Module Breakdown Agent ---
async function breakdownModules(projectId, reqAnalysis, options = {}) {
  const systemPrompt = `You are a System Architect. Break the project into clear functional modules.
    
    Output format (JSON only):
    {
      "modules": [
        {
          "module_name": "",
          "description": "",
          "features": [],
          "dependencies": []
        }
      ]
    }`;

  const userPrompt = `Project Context:\n${JSON.stringify(reqAnalysis)}`;
  return generateWithFallback(projectId, 'Module Breakdown', systemPrompt, userPrompt, true, options.preferredModels);
}

// --- 5. Final Documentation Generator ---
async function generateFinalDoc(projectId, allData, options = {}) {
  const systemPrompt = `You are a Technical Writer. Generate professional software project documentation.
    
    Documentation Sections:
    1. Project Overview
    2. Client Requirements Summary
    3. Assumptions
    4. Scope of Work
    5. System Architecture (High-Level)
       - Include DAG-based workflow model (agents as nodes, dependencies as edges)
       - ADD: AI Processing Layers table (where LLM/ML/Rules/Regex are used)
       - ADD: Performance Metrics & KPIs
       - Specify Web Intelligence Layer (for Research Agent: Tavily API, BeautifulSoup scraping, content extraction pipeline, Regex + Pandas cleaning)
       - Add JSON Validation Layer (Pydantic schemas, contract validation, auto-regeneration on failure)
       - Clarify Async Execution (parallel execution where possible, timeout & retry logic)
       - ADD: Data Flow Example (concrete execution flow)
    6. Technology Stack
    7. Security Architecture (NEW SECTION)
    8. Module Breakdown
    9. Estimated Timeline (provide both MVP and Full Production options if applicable)
    10. Cost Estimation (MUST use Indian Rupees ₹ and Lakhs/Crores format, provide ranges for MVP vs Production)
    11. Risks & Mitigation
    12. Success Criteria (NEW SECTION)
    13. Future Enhancements

    ENTERPRISE-GRADE ARCHITECTURE GUIDELINES:
    
    A. DAG IMPLEMENTATION SPECIFICITY:
    - Don't just say "DAG-based" - specify the executor framework:
      * Option 1: Custom DAG executor with dependency graph + topological sorting
      * Option 2: Prefect-based DAG orchestration (lightweight, Python-native)
      * Option 3: Airflow (enterprise scheduling)
      * Option 4: Temporal (durable execution)
      * Option 5: Dagster (data-aware orchestration)
    - Include: conditional branching, parallel execution, failure recovery
    
    B. AGENT COMMUNICATION PROTOCOL:
    - Beyond JSON validation, specify the message envelope structure:
      {
        "trace_id": "uuid-for-debugging",
        "agent_id": "research_agent",
        "task_id": "task_uuid",
        "schema_version": "v1.2.0",
        "timestamp": "ISO-8601",
        "payload": { ...actual data... }
      }
    - Include: Versioned schema contracts, trace IDs for debugging, agent message envelopes
    - Mention: Pydantic schemas for validation, automatic regeneration on failure
    
    C. SCOPE POSITIONING (MVP vs PRODUCTION):
    - Provide realistic estimates for enterprise-grade full production system
    - If timeline exceeds 6 months, also suggest an MVP approach with reduced scope
    - Example: "Full Production: 8-11 months, MVP: 5-6 months with core features"
    - Cost should reflect team size and duration realistically
    
    D. RISK SECTION ENHANCEMENTS:
    - Always include "Schema Drift Risk" as a technical risk:
      * Problem: When agent output evolves and breaks validation layer
      * Mitigation: Schema versioning, backward compatibility support, migration scripts
    - Include other standard risks: API rate limits, cost overruns, timeline delays
    
    E. AI RESPONSIBILITY MAPPING (CRITICAL):
    - Create "AI Processing Layers" table showing WHERE different AI tech is used:
      | Layer | Type | Purpose |
      |-------|------|---------|
      | NLP Engine | ML/LLM | Entity extraction, intent classification |
      | Rule Engine | Deterministic | Business logic, compliance checks |
      | Schema Validator | Pydantic | Data contract enforcement |
      | Web Intelligence | Hybrid | Tavily API + BeautifulSoup scraping |
    - Clearly distinguish: LLM usage vs ML models vs rule-based vs regex patterns
    - Avoid vague "AI-powered" - specify WHAT type of AI WHERE
    
    F. PERFORMANCE METRICS (MEASURABLE KPIS):
    - Add quantifiable performance targets:
      * Max report/output generation time: < 3 minutes
      * Concurrent job capacity: 50+ simultaneous requests
      * Validation error rate: < 2%
      * API failure recovery rate: 95%+
      * System uptime: 99.9%
    - Tailor metrics to the project type (e.g., report generation, data processing, API response)
    
    G. SECURITY ARCHITECTURE SECTION:
    - Always include comprehensive security posture:
      * Authentication: JWT-based, OAuth 2.0, SSO support
      * Authorization: Role-based access control (RBAC), permission matrix
      * Encryption: AES-256 at rest, TLS 1.3 in transit
      * Cloud Access: IAM roles, least privilege principle
      * Logging: Centralized audit logs, tamper-proof
      * Compliance: GDPR/SOC2/ISO27001 readiness
    - For compliance/enterprise systems, security section is MANDATORY
    
    H. DATA FLOW EXAMPLE (CONCRETE EXECUTION):
    - Provide ONE real end-to-end execution example with specific steps:
      Example for compliance system:
      1. User selects GDPR framework
      2. Airflow triggers DAG
      3. Acquisition Agent searches GDPR updates (Tavily API)
      4. Extraction Agent extracts Articles (NLP + Regex)
      5. Validation Agent checks compliance gaps (Rule Engine)
      6. Report Agent generates PDF (Template + LLM summary)
      7. Report stored in S3, metadata in PostgreSQL
      8. User notified via email (SendGrid)
    - Use concrete technology names, not placeholders
    
    I. SUCCESS CRITERIA (BUSINESS METRICS):
    - Define measurable business outcomes:
      * Reduce manual effort by X% (e.g., 60% reduction)
      * Reduce time from X to Y (e.g., 3 weeks → 3 hours)
      * Achieve X% automation coverage (e.g., 90%)
      * Cost savings: ₹X per month
      * User satisfaction: NPS > 40
    - Provide business-level ROI clarity
    
    TECHNICAL DEPTH:
    - Research Agent: Tavily integration, BeautifulSoup web scraping, content extraction, Regex/Pandas cleaning
    - Communication Layer: Pydantic validation, versioned contracts, trace IDs, message envelopes
    - Execution Model: Async execution (parallel research + preprocessing), timeout handling, retry logic
    - DAG Orchestrator: Specify concrete framework (Prefect/Airflow/Temporal/custom), topological sorting, failure handling
    - AI Clarity: Distinguish LLM (GPT-4/Claude) vs ML models (sklearn/PyTorch) vs rule-based systems
    
    Output Markdown. Ensure all cost figures are in INR (₹).`;

  const userPrompt = `Input Data:\n${JSON.stringify(allData)}`;
  return generateWithFallback(projectId, 'Final Doc Gen', systemPrompt, userPrompt, false, options.preferredModels);
}

// --- Auto-Fill Helper ---
async function suggestTeamAndStack(projectId, requirements, options = {}) {
  const systemPrompt = `You are a CTO. Analyze requirements and suggest Team & Stack. 
    Output JSON: { "team": {...}, "stack": {...} }`;
  const userPrompt = `Requirements: ${requirements}`;
  return generateWithFallback(projectId, 'Team & Stack Suggestion', systemPrompt, userPrompt, true, options.preferredModels);
}

module.exports = {
  analyzeRequirements,
  researchTechStack,
  estimateCostAndTimeline,
  breakdownModules,
  generateFinalDoc,
  suggestTeamAndStack
};
