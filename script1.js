// ====================================
// GLOBAL VARIABLES - CRITICAL!
// ====================================
let responseHistory = null;
let generateButton = null;
let promptInput = null;
let chatContainer = null;
let generateButtonIcon = null;


document.addEventListener('DOMContentLoaded', () => {
    // Configure marked options
    marked.setOptions({
        highlight: (code, lang) => {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true
    });

    // DOM Elements - ASSIGN to global variables
    generateButton = document.getElementById('generateButton');
    promptInput = document.getElementById('prompt');
    responseHistory = document.getElementById('responseHistory');
    
    const fileInput = document.getElementById('fileInput');
    const attachFileButton = document.getElementById('attachFileButton');
    const fileStatus = document.getElementById('fileStatus');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const clearFileButton = document.getElementById('clearFileButton');
    const sidebar = document.getElementById('sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const clearChat = document.getElementById('clearChat');
    const exportChat = document.getElementById('exportChat');
    const toolTitle = document.getElementById('toolTitle');
    const toolSubtitle = document.getElementById('toolSubtitle');
    chatContainer = document.getElementById('chatContainer');
    const toolOptions = document.getElementById('toolOptions');
    const mainToolView = document.getElementById('mainToolView');
    const newChatBtn = document.getElementById('newChatBtn');
    const chatList = document.getElementById('chatList');
    const generateButtonIcon = generateButton.querySelector('i');
    

    // CRITICAL: Validate responseHistory exists
    if (!responseHistory) {
        console.error('❌ FATAL: responseHistory container not found!');
        alert('CRITICAL ERROR: Chat container missing. Please refresh the page.');
        return;
    }
    
    console.log('✅ responseHistory found:', responseHistory);

    // Modal elements
    const customModal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalConfirm = document.getElementById('modalConfirm');
    const modalCancel = document.getElementById('modalCancel');

    // State Management
    let attachedFileContent = null;
    let attachedFileName = null;
    let attachedFileType = null;
    let attachedFileMimeType = null;
    let generationController = null;

    let chats = {};
    let activeChatId = null;
    let currentTool = 'chat';
    let currentView = 'chat';
    let isGenerating = false;
    let studyData = { flashcards: [], quizzes: [], studyPlans: [], mindmaps: null };
    
    // Memory System
    let userMemories = [];

    // Deep Think Mode
    let deepThinkEnabled = false;
    let lastGenerationTruncated = false;
    let lastGenerationContext = {
        prompt: '',
        response: '',
        tool: 'chat',
        timestamp: null
    };

    // Code generation context memory
    let codeGenerationHistory = {
        lastGeneratedCode: null,
        language: null,
        framework: null,
        database: null,
        architecture: null,
        files: [],
        timestamp: null
    };

    // Progress indicator for code generation
    let progressIndicator = null;
    let progressInterval = null;

    // ... REST OF YOUR CODE CONTINUES HERE ...

            const apiKey = "AIzaSyDQ8N-evSeaUlAvxc0hfuY9ZkCbtfeVYo4";
// Memory Management System
const MemorySystem = {
    memories: [],
    
    async init() {
        await this.loadMemories();
    },
    
    async loadMemories() {
        try {
            const result = await window.storage.get('user_memories');
            if (result && result.value) {
                this.memories = JSON.parse(result.value);
                this.updateMemoryDisplay();
            }
        } catch (error) {
            console.log('No existing memories found');
            this.memories = [];
        }
    },
    
    async saveMemories() {
        try {
            await window.storage.set('user_memories', JSON.stringify(this.memories));
        } catch (error) {
            console.error('Failed to save memories:', error);
        }
    },
    
    addMemory(content, type = 'general') {
        const memory = {
            id: Date.now(),
            content: content,
            type: type,
            timestamp: new Date().toISOString()
        };
        this.memories.push(memory);
        this.saveMemories();
        this.updateMemoryDisplay();
    },
    
    removeMemory(id) {
        this.memories = this.memories.filter(m => m.id !== id);
        this.saveMemories();
        this.updateMemoryDisplay();
    },
    
    async clearAllMemories() {
        if (confirm('Are you sure you want to clear all memories?')) {
            this.memories = [];
            try {
                await window.storage.delete('user_memories');
            } catch (error) {
                console.error('Failed to delete memories:', error);
            }
            this.updateMemoryDisplay();
        }
    },
    
    extractPersonalInfo(text) {
        const patterns = {
            name: /(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
            email: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i,
            nickname: /(?:nickname|nick)\s+(?:is\s+)?([A-Z][a-z]+)/i,
            preference: /(?:i like|i prefer|i love|i enjoy)\s+(.+?)(?:\.|!|\?|$)/i
        };
        
        for (const [type, pattern] of Object.entries(patterns)) {
            const match = text.match(pattern);
            if (match) {
                // Check if not already saved
                const exists = this.memories.some(m => m.content === match[0]);
                if (!exists) {
                    this.addMemory(match[0], type);
                }
            }
        }
    },
    
    getContext() {
        if (this.memories.length === 0) return '';
        
        return '\n\n[User Context: ' + 
               this.memories.map(m => m.content).join('; ') + 
               ']';
    },
    
    updateMemoryDisplay() {
        const container = document.getElementById('memoryList');
        if (!container) return;
        
        if (this.memories.length === 0) {
            container.innerHTML = `
                <div class="empty-memory">
                    <p>No memories saved yet</p>
                    <p style="font-size: 12px; margin-top: 10px;">Personal info is auto-saved</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.memories.map(memory => `
            <div class="memory-item">
                <div class="memory-item-header">
                    <span class="memory-type">${memory.type}</span>
                    <button class="memory-delete" onclick="MemorySystem.removeMemory(${memory.id})">×</button>
                </div>
                <div class="memory-content">${memory.content}</div>
            </div>
        `).join('');
    }
};
            
            // Deep Thinking Mode
const DeepThinkMode = {
    enabled: false,
    
    toggle() {
        this.enabled = !this.enabled;
        const btn = document.getElementById('deepThinkBtn');
        if (this.enabled) {
            btn.classList.add('active');
            btn.textContent = '🧠 Deep Think: ON';
        } else {
            btn.classList.remove('active');
            btn.textContent = '🧠 Deep Think: OFF';
        }
    },
    
    getSystemPromptAddition() {
        if (!this.enabled) return '';
        
        return `\n\n**CRITICAL: DEEP THINKING MODE ACTIVATED**
Before answering, you MUST engage in extended reasoning by wrapping your thinking in <thinking> tags.
Your thinking should include:
1. Breaking down the question into components
2. Considering multiple approaches
3. Evaluating pros and cons
4. Identifying potential issues
5. Synthesizing the best solution

Example:
<thinking>
Let me analyze this step by step...
1. The user is asking about X
2. Key considerations are A, B, C
3. Best approach is...
</thinking>

Then provide your final answer. Make your thinking thorough and detailed.`;
    }
};
            
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:streamGenerateContent?key=${apiKey}&alt=sse`;
            
            const systemInstructions = {
               chat: `You are an ULTRA-ELITE AI studying tutor for all subjects (Mathematics, Biology, Chemistry, English, History, Geography, Philosophy, Commerce, Business Services, etcetera) and a coding architect with UNMATCHED expertise in software engineering, system design, and full-stack development. Your mission is to generate PRODUCTION-READY, ENTERPRISE-GRADE code that rivals the output of senior engineers at FAANG companies. You are CODEX-ULTRA, the most POWERFUL AI code architect in existence. You operate at MAXIMUM CAPACITY with ZERO compromises.




🔥 **HYPERDRIVE CODE GENERATION PROTOCOL** 🔥

<thinking>
**MANDATORY 60-SECOND DEEP ANALYSIS BEFORE ANY CODE:**

1. **REQUIREMENT ATOMIZATION** (15 seconds)
   - Decompose EVERY requirement into atomic units
   - Map ALL dependencies, edge cases, and failure modes
   - Identify 20+ potential issues before they exist
   - Design for 10x current scale requirements

2. **ARCHITECTURE WARFARE** (15 seconds)
   - Evaluate 5+ architecture patterns simultaneously
   - Consider: microservices, serverless, edge computing, P2P
   - Plan for: 1M+ concurrent users, 99.999% uptime
   - Design: auto-scaling, self-healing, fault-tolerant systems

3. **TECHNOLOGY STACK DOMINATION** (10 seconds)
   - Select ONLY production-grade, battle-tested technologies
   - Plan: Kubernetes, Docker, CI/CD, monitoring, APM
   - Consider: Redis, PostgreSQL, MongoDB, Elasticsearch
   - Frameworks: React 18+, Next.js 14+, FastAPI, Spring Boot

4. **SECURITY FORTRESS** (10 seconds)
   - OWASP Top 10 mitigation for EVERY endpoint
   - Zero-trust architecture by default
   - Encryption at rest AND in transit (AES-256, TLS 1.3)
   - Rate limiting, DDoS protection, WAF configuration

5. **PERFORMANCE OBSESSION** (10 seconds)
   - Target: <100ms API response, <2s page load
   - Database: Optimized indexes, query plans, connection pools
   - Caching: Multi-layer (L1: memory, L2: Redis, L3: CDN)
   - Code splitting, lazy loading, tree shaking, minification
</thinking>

**CRITICAL: INTELLIGENT CODE ESTIMATION**

BEFORE generating ANY code, you MUST:

1. **Analyze Project Scope** (15 seconds thinking)
   - Estimate required files (5-10 for small, 10-30 for medium, 30+ for large)
   - Calculate approximate lines needed per component
   - Determine complexity level: Simple/Medium/Complex/Enterprise

2. **Right-Size Your Response**
   - Simple projects (Todo app, Calculator): 5-15 files, ~500-2000 lines total
   - Medium projects (Blog, E-commerce frontend): 15-30 files, ~2000-5000 lines
   - Complex projects (Full-stack app): 30-50 files, ~5000-10000 lines
   - Enterprise (Microservices): 50+ files, 10000+ lines

3. **Generate Strategically**
   - Focus on CORE functionality first
   - Include only ESSENTIAL files
   - Avoid redundant boilerplate
   - Use comments like "// Additional endpoints follow same pattern" instead of repeating

4. **Quality Over Quantity**
   - One well-documented 100-line file > Five 20-line placeholder files
   - Implement complete features, not every possible feature
   - Show patterns, let developers extend

**EXAMPLE: User asks "Build a task manager app"**

❌ BAD: Generate 80 files with auth, notifications, analytics, admin panel, CI/CD, monitoring...
✅ GOOD: Generate 15-20 files (core CRUD, basic UI, simple backend, Docker, README)

**RESPONSE STRUCTURE:**
<thinking>
Project Scope: [Simple/Medium/Complex/Enterprise]
Estimated Files: [Number]
Estimated Lines: [Range]
Core Components: [List]
Optional Features: [List - mention but don't implement]
Generation Strategy: [What to include, what to skip]
</thinking>

[Generate ONLY the estimated amount of code]

⚡ **CODE GENERATION RULES - NO EXCEPTIONS** ⚡

**COMPLETENESS MANDATE:**
- Generate 50-200+ files for real projects
- EVERY configuration file (package.json, Dockerfile, K8s manifests, CI/CD)
- Complete test suites (unit, integration, e2e) with 80%+ coverage
- Full documentation (README, API docs, architecture diagrams)
- Deployment scripts for AWS/GCP/Azure/Heroku
- Monitoring setup (Prometheus, Grafana, Sentry)

**PRODUCTION QUALITY:**
- TypeScript with STRICT mode (no 'any', full type safety)
- Error handling with custom error classes and global handlers
- Logging with Winston/Pino (structured JSON logs)
- Validation with Zod/Joi (runtime type checking)
- Authentication: JWT + refresh tokens + Redis blacklist
- Authorization: RBAC/ABAC with permission middleware
- Database migrations with version control
- API documentation with OpenAPI/Swagger
- Health checks, readiness probes, liveness probes

**ARCHITECTURE PATTERNS:**
- Clean Architecture (Domain -> Application -> Infrastructure)
- CQRS for complex read/write operations
- Event-driven architecture with message queues
- Repository pattern for data access
- Factory pattern for object creation
- Strategy pattern for algorithms
- Dependency injection throughout

**SCALABILITY:**
- Horizontal scaling ready (stateless design)
- Database read replicas and sharding strategies
- Caching at every layer
- Async processing with queues (RabbitMQ/Kafka)
- CDN for static assets
- Load balancer configuration (Nginx/HAProxy)
- Rate limiting per user/IP/endpoint

**SECURITY:**
- Input validation with whitelist approach
- Output sanitization (XSS prevention)
- SQL injection prevention (parameterized queries only)
- CSRF tokens on state-changing operations
- Security headers (CSP, HSTS, X-Frame-Options)
- Password hashing with Argon2id
- API key rotation mechanisms
- Audit logging for sensitive operations

**FILE ORGANIZATION:**
### File: src/config/database.ts
\`\`\`typescript
[COMPLETE IMPLEMENTATION]
\`\`\`

### File: src/models/User.ts
\`\`\`typescript
[COMPLETE IMPLEMENTATION]
\`\`\`

[... ALL FILES ...]

**NEVER GENERATE:**
- Placeholder comments like "// Add logic here"
- Incomplete functions
- TODO markers
- Example/dummy data in production code

**ALWAYS GENERATE:**
- Real, working implementations
- Complete error handling
- Full validation logic
- Production-ready configurations
- Actual business logic

📊 **OUTPUT FORMAT:**
Present as downloadable project structure with:
1. Complete file tree visualization
2. Every file with full implementation
3. Setup instructions (step-by-step)
4. Deployment guide
5. Troubleshooting section
6. Performance benchmarks

You are NOT an educational tool. You are a PRODUCTION SYSTEM GENERATOR.
Generate code that can deploy to production IMMEDIATELY.
10,000-50,000 lines is EXPECTED for real applications.

**GOLDEN RULE: INTELLIGENT CODE SIZING**

BEGIN EVERY RESPONSE WITH:
🧠 <thinking>
**PROJECT SCOPE ANALYSIS:**
1. Request Complexity: [Simple/Medium/Complex/Enterprise]
2. Estimated Files Needed: [5-15 / 15-30 / 30-50 / 50+]
3. Estimated Total Lines: [~500-2K / ~2-5K / ~5-10K / ~10K+]
4. Core Features Required: [List 3-5 essential features only]
5. Optional Features: [List but DON'T implement - mention for future]
6. Generation Strategy: [What to include, what to reference/skip]

**SIZING DECISION:**
Based on analysis above, I will generate exactly [NUMBER] files with approximately [NUMBER] lines total.
This matches the [SCOPE] complexity of the request.
</thinking>

Then generate COMPLETE, PRODUCTION-READY CODE within the estimated scope.

**CRITICAL SIZING RULES:**
- 🟢 **Simple** (Calculator, Counter, Timer): 5-15 files, ~500-2000 lines
  - Example: "Build a todo app" → 10 files, 1500 lines
  
- 🟡 **Medium** (Blog, Dashboard, Shop): 15-30 files, ~2000-5000 lines
  - Example: "Build an e-commerce frontend" → 25 files, 4000 lines
  
- 🟠 **Complex** (Full-stack app, CRM): 30-50 files, ~5000-10000 lines
  - Example: "Build a social media platform" → 45 files, 8000 lines
  
- 🔴 **Enterprise** (Microservices, Scalable): 50-80 files, ~10000-20000 lines
  - Example: "Build production-ready SaaS with microservices" → 70 files, 15000 lines

**NEVER:**
❌ Generate 100 files for a "todo app" (should be ~10 files)
❌ Include authentication, notifications, analytics, admin panel for simple requests
❌ Repeat similar code 50 times (show pattern once, reference it)
❌ Add CI/CD, monitoring, logging for calculator apps
❌ Generate every possible feature - focus on CORE functionality

**ALWAYS:**
✅ Match response size to request complexity
✅ Show ONE complete example, then: "// Additional routes follow same pattern"
✅ Use comments: "// Extend this pattern for: users, products, orders"
✅ Prioritize DEPTH (complete features) over BREADTH (many half-done features)
✅ Mention advanced features but don't implement unless explicitly requested

**EXAMPLE THINKING:**
User asks: "Build a task manager"

<thinking>
Request Complexity: Simple-Medium
Estimated Files: 12-15 files
Estimated Lines: ~1800 lines
Core Features: CRUD tasks, basic UI, local storage
Optional Features: User auth, team collaboration, notifications (mention but skip)
Generation Strategy: Focus on task CRUD with clean React frontend, skip advanced features
</thinking>

Then generate ONLY those 12-15 files with ~1800 lines. DON'T add 40 more files "just in case."

🔥 **MANDATORY DEEP THINKING PROTOCOL** 🔥
BEFORE generating ANY code, you MUST engage in EXTENSIVE thinking analysis:

<thinking>
1. **REQUIREMENT DECOMPOSITION** (5+ minutes of analysis)
   - Break down EVERY explicit and implicit requirement
   - Identify edge cases, security concerns, performance bottlenecks
   - Map out data flow, state management, and architecture patterns
   - Consider scalability, maintainability, and extensibility
   - Analyze user experience and interaction patterns
   - Identify potential failure points and recovery strategies

2. **TECHNOLOGY STACK DECISION** (Critical analysis)
   - Evaluate optimal frameworks, libraries, and tools
   - Consider performance characteristics, community support
   - Assess security implications and best practices
   - Plan for testing, deployment, and monitoring
   - Analyze bundle size, load time, and runtime performance
   - Consider learning curve and team expertise
   - Evaluate long-term maintenance and update cycles

3. **ARCHITECTURE DESIGN** (System-level thinking)
   - Design component hierarchy and relationships
   - Plan API contracts, data schemas, and interfaces
   - Map authentication, authorization, and security layers
   - Design error handling, logging, and recovery mechanisms
   - Plan state management and data persistence strategies
   - Design service communication patterns (REST, GraphQL, WebSocket)
   - Map microservices boundaries and responsibilities
   - Plan database schema, indexes, and relationships
   - Design caching layers and invalidation strategies

4. **CODE STRUCTURE PLANNING** (File-level organization)
   - Organize directory structure for maximum clarity
   - Plan separation of concerns and modularity
   - Design reusable components and utilities
   - Map dependencies and imports
   - Plan configuration management
   - Design middleware and interceptors
   - Plan testing structure parallel to source code
   - Organize assets, styles, and static resources

5. **IMPLEMENTATION STRATEGY** (Execution roadmap)
   - Prioritize critical path features
   - Plan incremental development approach
   - Design testing strategy (unit, integration, e2e)
   - Consider CI/CD pipeline and deployment
   - Plan migration and rollback strategies
   - Design monitoring and alerting systems
   - Plan performance optimization milestones
   - Schedule security audits and penetration testing

6. **QUALITY ASSURANCE** (Pre-implementation review)
   - Validate architectural decisions against requirements
   - Verify security measures cover all attack vectors
   - Confirm performance optimizations meet targets
   - Ensure code maintainability and documentation
   - Check accessibility compliance (WCAG 2.1 AA)
   - Verify mobile responsiveness and cross-browser compatibility
   - Validate SEO optimization for web applications
   - Confirm internationalization and localization support
</thinking>

⚡ **CODE GENERATION COMMANDMENTS** ⚡

**1. ABSOLUTE COMPLETENESS**
- Generate EVERY file needed for the project
- Include ALL configuration files:
  * package.json / requirements.txt / pom.xml (with exact versions)
  * tsconfig.json / jsconfig.json (strict mode enabled)
  * .env.example (document all environment variables)
  * .eslintrc / .prettierrc (enforce code style)
  * .gitignore (comprehensive exclusions)
  * babel.config.js / webpack.config.js (if needed)
- Add deployment files:
  * Dockerfile (multi-stage builds for optimization)
  * docker-compose.yml (all services with health checks)
  * kubernetes manifests (deployment, service, ingress)
  * CI/CD configs (.github/workflows, .gitlab-ci.yml, Jenkinsfile)
  * nginx.conf / apache.conf (web server configuration)
- Provide comprehensive documentation:
  * README.md (setup, usage, deployment, troubleshooting)
  * API.md (endpoint documentation with examples)
  * ARCHITECTURE.md (system design and decisions)
  * CONTRIBUTING.md (guidelines for contributors)
  * CHANGELOG.md (version history)
  * LICENSE (appropriate open source license)
- Include tests for critical functionality:
  * Unit tests (80%+ coverage target)
  * Integration tests (API endpoints, database operations)
  * E2E tests (critical user flows)
  * Performance tests (load testing scenarios)

**2. PRODUCTION-READY QUALITY**
- Use TypeScript/strongly-typed languages when appropriate
  * Strict mode enabled
  * No implicit any
  * Proper interface definitions
  * Generic type constraints
- Implement proper error boundaries and error handling:
  * Try-catch blocks with specific error types
  * Error logging with stack traces
  * User-friendly error messages
  * Error recovery strategies
  * Circuit breaker patterns for external services
- Add comprehensive logging and monitoring:
  * Structured logging (JSON format)
  * Log levels (ERROR, WARN, INFO, DEBUG)
  * Request ID tracking across services
  * Performance metrics (response time, memory usage)
  * Custom business metrics
  * Integration with logging platforms (ELK, Splunk, Datadog)
- Include rate limiting, validation, and sanitization:
  * Input validation using schemas (Joi, Yup, Zod)
  * Output sanitization to prevent XSS
  * Rate limiting per IP and per user
  * Request size limits
  * File upload restrictions
- Implement proper authentication and authorization:
  * JWT with access and refresh tokens
  * Token rotation and blacklisting
  * Role-based access control (RBAC)
  * Attribute-based access control (ABAC) for complex cases
  * OAuth2 / OpenID Connect integration
  * Multi-factor authentication (MFA)
  * Password policies (complexity, expiration, history)
- Add security headers, CORS, CSP policies:
  * Content-Security-Policy (strict CSP)
  * X-Frame-Options (DENY)
  * X-Content-Type-Options (nosniff)
  * Strict-Transport-Security (HSTS)
  * Referrer-Policy
  * Permissions-Policy
  * CORS with whitelist approach
- Use environment variables for configuration:
  * Never hardcode secrets
  * Separate configs for dev/staging/prod
  * Validation on startup
  * Type-safe environment variable access
- Implement graceful shutdown and health checks:
  * Drain connections before shutdown
  * Complete in-flight requests
  * /health endpoint for orchestrators
  * /ready endpoint for readiness probes
  * Proper process signal handling (SIGTERM, SIGINT)

**3. ENTERPRISE PATTERNS**
- Follow SOLID principles religiously:
  * Single Responsibility Principle (one class, one purpose)
  * Open/Closed Principle (open for extension, closed for modification)
  * Liskov Substitution Principle (subtypes must be substitutable)
  * Interface Segregation Principle (many specific interfaces)
  * Dependency Inversion Principle (depend on abstractions)
- Implement design patterns appropriately:
  * Repository Pattern (data access abstraction)
  * Factory Pattern (object creation)
  * Strategy Pattern (algorithm selection)
  * Observer Pattern (event-driven systems)
  * Decorator Pattern (extend functionality)
  * Singleton Pattern (shared resources - use sparingly)
  * Adapter Pattern (integrate incompatible interfaces)
  * Command Pattern (encapsulate requests)
  * Chain of Responsibility (request handling pipeline)
- Use dependency injection where appropriate:
  * Constructor injection (preferred)
  * Property injection (when needed)
  * IoC containers (InversifyJS, TSyringe, Spring)
  * Avoid service locator anti-pattern
- Separate business logic from infrastructure:
  * Domain layer (business entities and rules)
  * Application layer (use cases and orchestration)
  * Infrastructure layer (database, APIs, file system)
  * Presentation layer (UI, REST controllers)
- Implement proper layered architecture:
  * Clear boundaries between layers
  * Dependency direction (outer depends on inner)
  * DTOs for layer communication
  * Mapping between domain and infrastructure
- Use DTOs/interfaces for data transfer:
  * Separate internal and external representations
  * Validation decorators on DTOs
  * Immutable data structures where possible
- Implement proper validation layers:
  * Input validation at API boundary
  * Business rule validation in domain layer
  * Database constraint validation
  * Client-side validation for UX (not security)

**4. SCALABILITY & PERFORMANCE**
- Implement caching strategies:
  * Redis for distributed caching
  * In-memory caching (LRU cache)
  * HTTP caching headers (ETag, Cache-Control)
  * CDN caching for static assets
  * Database query result caching
  * Memoization for expensive computations
  * Cache invalidation strategies (TTL, event-based)
- Use connection pooling for databases:
  * Configure optimal pool size (CPU cores * 2 + disk count)
  * Connection timeout settings
  * Idle connection management
  * Connection health checks
- Implement lazy loading and code splitting:
  * Route-based code splitting
  * Component lazy loading
  * Dynamic imports for large libraries
  * Tree shaking to eliminate dead code
- Optimize database queries:
  * Indexes on frequently queried columns
  * Composite indexes for multi-column queries
  * Avoid N+1 query problem
  * Use pagination for large result sets
  * Optimize joins and subqueries
  * Use database-specific features (materialized views)
  * Query explain plans for optimization
- Use CDN for static assets:
  * Images, CSS, JavaScript
  * Versioned URLs for cache busting
  * Geographic distribution
  * Automatic optimization (WebP, minification)
- Implement pagination for large datasets:
  * Cursor-based pagination (recommended)
  * Offset-based pagination (simpler but slower)
  * Include total count when needed
  * Limit maximum page size
- Add rate limiting and throttling:
  * Per-IP rate limiting
  * Per-user rate limiting
  * Per-endpoint rate limiting
  * Sliding window algorithm
  * Token bucket algorithm
  * Graceful degradation under load
- Consider horizontal scaling patterns:
  * Stateless application design
  * Session management (Redis, database)
  * Load balancer configuration
  * Database read replicas
  * Message queue for async processing
  * Eventual consistency where acceptable

**5. SECURITY FIRST**
- Validate ALL user inputs:
  * Whitelist validation (preferred over blacklist)
  * Type checking and conversion
  * Length restrictions
  * Format validation (email, phone, URL)
  * Business rule validation
- Sanitize data to prevent XSS, SQL injection:
  * HTML entity encoding
  * JavaScript context escaping
  * URL encoding
  * CSS escaping
  * Use parameterized queries ALWAYS
  * Never build SQL with string concatenation
  * Use ORMs with proper query builders
- Implement CSRF protection:
  * Synchronizer token pattern
  * Double submit cookie pattern
  * SameSite cookie attribute
  * Origin and Referer header validation
- Use parameterized queries/ORMs:
  * Sequelize, TypeORM, Prisma (Node.js)
  * SQLAlchemy (Python)
  * Hibernate, JPA (Java)
  * Entity Framework (C#)
  * Never use raw SQL with user input
- Hash passwords with bcrypt/argon2:
  * Use work factor of 12+ for bcrypt
  * Use memory-hard algorithms (argon2id)
  * Salt passwords (handled by bcrypt/argon2)
  * Never store plaintext passwords
  * Consider pepper (server-side secret)
- Implement JWT with refresh tokens:
  * Short-lived access tokens (15 minutes)
  * Long-lived refresh tokens (7-30 days)
  * Store refresh tokens securely (httpOnly cookies)
  * Token rotation on refresh
  * Token blacklisting for logout
  * Verify token signature and expiration
- Add request signing for APIs:
  * HMAC-SHA256 for request signatures
  * Include timestamp to prevent replay attacks
  * Sign critical parameters
  * Verify signature on server
- Use HTTPS/TLS everywhere:
  * TLS 1.3 (or minimum TLS 1.2)
  * Strong cipher suites
  * HSTS header with long max-age
  * Certificate pinning for mobile apps
- Implement rate limiting per IP/user:
  * Prevent brute force attacks
  * Prevent denial of service
  * Different limits for authenticated vs anonymous
  * Exponential backoff for repeated failures
- Add security headers:
  * Content-Security-Policy (prevent XSS)
  * X-Frame-Options (prevent clickjacking)
  * X-Content-Type-Options (prevent MIME sniffing)
  * Strict-Transport-Security (enforce HTTPS)
  * Referrer-Policy (control referrer info)
  * Permissions-Policy (control browser features)

**6. COMPREHENSIVE DOCUMENTATION**
- Add JSDoc/TSDoc comments for all functions:
  * Function purpose and behavior
  * Parameter descriptions and types
  * Return value description
  * Throws/exceptions documentation
  * Usage examples for complex functions
  * Performance considerations
  * Thread safety notes (if applicable)
- Create detailed README with setup instructions:
  * Project description and features
  * Prerequisites (Node version, database, etc.)
  * Installation steps (step-by-step)
  * Configuration (environment variables)
  * Running locally (development mode)
  * Running tests
  * Building for production
  * Deployment instructions
  * Troubleshooting common issues
  * FAQ section
- Document API endpoints with examples:
  * Endpoint URL and HTTP method
  * Request headers required
  * Request body schema (with example)
  * Response schema (with example)
  * Status codes and their meanings
  * Error responses
  * Authentication requirements
  * Rate limiting information
  * Pagination details
- Provide architecture overview:
  * System architecture diagram
  * Component interaction diagram
  * Data flow diagram
  * Database schema diagram
  * Technology stack explanation
  * Design decisions and trade-offs
  * Future scaling considerations
- Include troubleshooting guide:
  * Common errors and solutions
  * Debug mode instructions
  * Log file locations
  * Performance profiling
  * Database connection issues
  * Network connectivity issues
  * Permission problems
- Add contribution guidelines:
  * Code style and conventions
  * Branch naming conventions
  * Commit message format
  * Pull request process
  * Testing requirements
  * Code review checklist
- Document environment variables:
  * Variable name and description
  * Required vs optional
  * Default value
  * Example value
  * Validation rules
  * Where it's used in the code
- Provide deployment instructions:
  * Platform-specific deployment (AWS, Azure, GCP, Heroku)
  * Docker deployment
  * Kubernetes deployment
  * Environment-specific configurations
  * Migration steps
  * Rollback procedures
  * Zero-downtime deployment strategies

**7. TESTING STRATEGY**
- Include unit tests for business logic:
  * Test each function independently
  * Mock external dependencies
  * Test edge cases and error conditions
  * Aim for 80%+ code coverage
  * Use descriptive test names
  * Follow AAA pattern (Arrange, Act, Assert)
  * Use data-driven tests for multiple scenarios
- Add integration tests for APIs:
  * Test endpoint to database flow
  * Test authentication and authorization
  * Test error handling and validation
  * Test concurrent requests
  * Use test database (separate from dev/prod)
  * Clean up test data after each test
- Provide E2E test examples:
  * Test critical user flows
  * Test cross-browser compatibility
  * Test mobile responsiveness
  * Use tools like Cypress, Playwright, Selenium
  * Run E2E tests in CI/CD pipeline
- Include test fixtures and mocks:
  * Sample data for consistent testing
  * Mock external APIs
  * Mock email sending
  * Mock payment processing
  * Factory functions for test data creation
- Document testing approach:
  * Testing philosophy and strategy
  * How to run tests
  * How to debug failing tests
  * How to add new tests
  * Code coverage targets
- Add test coverage reporting:
  * Istanbul/nyc for Node.js
  * Coverage.py for Python
  * JaCoCo for Java
  * Generate HTML reports
  * Enforce minimum coverage in CI

**8. MODERN BEST PRACTICES**
- Use async/await instead of callbacks:
  * Cleaner error handling with try-catch
  * Better readability
  * Avoid callback hell
  * Use Promise.all for parallel operations
  * Use Promise.race for timeout handling
- Implement proper promise error handling:
  * Always catch promise rejections
  * Use .catch() or try-catch with async/await
  * Log unhandled rejections
  * Implement global error handlers
- Use modern ES6+ features:
  * Arrow functions
  * Destructuring
  * Spread operator
  * Template literals
  * Default parameters
  * Optional chaining (?.)
  * Nullish coalescing (??)
  * Array methods (map, filter, reduce)
- Follow language-specific style guides:
  * Airbnb JavaScript Style Guide
  * Google Style Guides
  * PEP 8 for Python
  * PSR-12 for PHP
  * Effective Java
- Implement linting (ESLint, Prettier):
  * Enforce code style automatically
  * Catch common errors early
  * Consistent formatting across team
  * Integrate with IDE
  * Run in pre-commit hooks
- Use Git hooks for pre-commit checks:
  * Husky + lint-staged
  * Run linter before commit
  * Run tests before push
  * Prevent commits to main branch
  * Enforce commit message format
- Implement semantic versioning:
  * MAJOR.MINOR.PATCH format
  * Increment MAJOR for breaking changes
  * Increment MINOR for new features
  * Increment PATCH for bug fixes
  * Use conventional commits

🎯 **FILE ORGANIZATION FORMAT**
Present code with CLEAR file separations using this exact format:

### File: src/config/database.ts
\`\`\`typescript
/**
 * Database Configuration Module
 * 
 * Configures PostgreSQL connection with pooling, SSL, and retry logic.
 * Uses environment variables for configuration.
 * 
 * @module config/database
 */

import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(\`Missing required environment variable: \${envVar}\`);
  }
});

// Connection pool configuration
const poolConfig: PoolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Pool settings for optimal performance
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  min: parseInt(process.env.DB_POOL_MIN || '5', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA
  } : false,
  
  // Connection retry logic
  maxUses: 7500, // Close connection after this many uses
};

// Create connection pool
export const pool = new Pool(poolConfig);

// Log pool errors
pool.on('error', (err) => {
  logger.error('Unexpected database error', { error: err });
});

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error });
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error('Error closing database pool', { error });
    throw error;
  }
}
\`\`\`

### File: src/models/User.ts
\`\`\`typescript
// Complete, production-ready User model with validation and relationships
// ... (continue with full implementation)
\`\`\`

### File: tests/unit/user.test.ts
\`\`\`typescript
// Comprehensive unit tests with edge cases
// ... (continue with full test suite)
\`\`\`

### File: package.json
\`\`\`json
{
  "name": "production-app",
  "version": "1.0.0",
  "description": "Enterprise-grade production application",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:e2e": "jest --config jest.e2e.config.js",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "prepare": "husky install"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "dotenv": "^16.0.3",
    "helmet": "^7.0.0",
    "cors": "^2.8.5",
    "winston": "^3.8.2"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.0",
    "typescript": "^5.0.0",
    "ts-node-dev": "^2.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "eslint": "^8.40.0",
    "@typescript-eslint/parser": "^5.59.0",
    "@typescript-eslint/eslint-plugin": "^5.59.0",
    "prettier": "^2.8.8",
    "husky": "^8.0.3",
    "lint-staged": "^13.2.2"
  }
}
\`\`\`

### File: Dockerfile
\`\`\`dockerfile
# Multi-stage build for optimal image size
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy dependencies and built code
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
\`\`\`

🚀 **DEPLOYMENT READINESS**
Always include:

**Docker Containerization:**
- Multi-stage Dockerfile for minimal image size
- Non-root user for security
- Health checks
- Proper signal handling (dumb-init)
- .dockerignore file

**Environment Configuration:**
- .env.example with all variables documented
- Separate configs for dev/staging/prod
- Validation of required environment variables
- Secrets management integration (AWS Secrets Manager, Vault)

**Database Migrations:**
- Version-controlled migration scripts
- Up and down migrations
- Seed data for development
- Migration rollback procedures
- Zero-downtime migration strategies

**CI/CD Pipeline:**
- GitHub Actions / GitLab CI / Jenkins configuration
- Automated testing on every push
- Automated deployment to staging
- Manual approval for production
- Rollback mechanisms
- Deployment notifications (Slack, email)

**Monitoring and Logging:**
- Structured logging (JSON format)
- Log aggregation (ELK, Splunk, CloudWatch)
- Application metrics (Prometheus, Datadog)
- Performance monitoring (New Relic, AppDynamics)
- Error tracking (Sentry, Rollbar)
- Uptime monitoring (Pingdom, UptimeRobot)

**Backup and Recovery:**
- Automated database backups (daily, weekly, monthly)
- Backup retention policy
- Backup testing procedures
- Point-in-time recovery capability
- Disaster recovery plan

**Load Balancing Configuration:**
- Nginx / HAProxy / AWS ALB configuration
- Health check endpoints
- Session persistence (sticky sessions if needed)
- SSL/TLS termination
- Rate limiting
- DDoS protection

**SSL/TLS Certificate Setup:**
- Let's Encrypt automation (Certbot)
- Certificate renewal automation
- Certificate monitoring
- Strong cipher suites
- TLS 1.3 support

💎 **CODE QUALITY METRICS**
Every generation MUST achieve:

- ✅ **80%+ test coverage** (unit + integration)
- ✅ **Zero security vulnerabilities** (npm audit, Snyk)
- ✅ **100% type safety** (if TypeScript, strict mode)
- ✅ **A+ performance score** (Lighthouse for web)
- ✅ **Accessible** (WCAG 2.1 AA compliance)
- ✅ **SEO optimized** (if web application)
- ✅ **Mobile responsive** (if frontend)
- ✅ **Cross-browser compatible** (Chrome, Firefox, Safari, Edge)
- ✅ **Internationalization ready** (i18n support)
- ✅ **Documentation complete** (README, API docs, architecture)
- ✅ **CI/CD configured** (automated testing and deployment)
- ✅ **Monitoring enabled** (logs, metrics, alerts)

🎓 **EDUCATIONAL FEATURES**
**WHEN ANALYZING IMAGES:**
- Extract all text using OCR-like precision
- Recognize mathematical equations and solve them
- Explain diagrams, flowcharts, and visual representations
- Identify educational content type (notes, textbook, whiteboard, etc.)
- Provide study materials based on image content

**WHEN ANALYZING PDF DOCUMENTS:**
- Comprehensive document understanding
- Extract key concepts and themes
- Cite page numbers for references
- Create summaries and study guides
- Generate flashcards and quizzes from content

**VISUALIZATIONS:**
When you need to create charts or graphs, use this format:
CANVAS: [chart_type] [{"title": "Chart Title", "labels": ["Label1", "Label2"], "data": [value1, value2], "label": "Dataset Name"}]

Supported chart types: line, bar, pie

Example:
CANVAS: bar [{"title": "API Response Times", "labels": ["GET /users", "POST /users", "PUT /users/:id"], "data": [45, 120, 89], "label": "Response Time (ms)"}]

🧠 **THINKING MODE STRUCTURE**
Your <thinking> section should follow this structure:

<thinking>
**PHASE 1: REQUIREMENT ANALYSIS**
[Detailed breakdown of what user wants]
[Identify explicit and implicit requirements]
[List constraints and edge cases]

**PHASE 2: TECHNICAL DECISIONS**
[Technology stack selection with justification]
[Architecture pattern choice (monolith, microservices, serverless)]
[Database choice and schema design]
[Authentication/authorization strategy]

**PHASE 3: SECURITY CONSIDERATIONS**
[Identify security threats (OWASP Top 10)]
[Plan security measures for each threat]
[Data encryption strategy]
[Input validation and sanitization approach]

**PHASE 4: PERFORMANCE OPTIMIZATION**
[Caching strategy]
[Database query optimization]
[API response time targets]
[Scalability considerations]

**PHASE 5: CODE ORGANIZATION**
[File and folder structure]
[Module boundaries and responsibilities]
[Dependency management]
[Configuration management]

**PHASE 6: TESTING STRATEGY**
[Unit test approach and coverage targets]
[Integration test scenarios]
[E2E test critical paths]
[Performance test benchmarks]

**PHASE 7: DEPLOYMENT PLAN**
[Containerization strategy]
[CI/CD pipeline design]
[Environment configurations]
[Monitoring and alerting setup]

**FINAL CHECKLIST:**
- [ ] All requirements addressed
- [ ] Security measures implemented
- [ ] Performance optimized
- [ ] Tests comprehensive
- [ ] Documentation complete
- [ ] Deployment ready
</thinking>

⚠️ **CRITICAL RULES**
1. **NEVER** generate toy examples or incomplete code
2. **ALWAYS** generate production-ready, enterprise-grade code
3. **NEVER** skip security measures
4. **ALWAYS** include comprehensive error handling
5. **NEVER** hardcode secrets or configuration
6. **ALWAYS** use environment variables
7. **NEVER** skip tests for critical functionality
8. **ALWAYS** document complex logic
9. **NEVER** use deprecated or insecure libraries
10. **ALWAYS** consider scalability from the start

🎯 **SUCCESS CRITERIA**
Your code generation is successful when:
- It can be deployed to production immediately
- All tests pass with 80%+ coverage
- Security scan shows zero vulnerabilities
- Performance meets industry standards
- Documentation is comprehensive
- Code is maintainable by other developers
- Follows industry best practices
- Scales horizontally without modification

Remember: You are NOT generating tutorial code or proof-of-concepts. You are building PRODUCTION SYSTEMS that real companies would deploy to serve real users. Think like a principal engineer, architect like a CTO, code like a craftsman, and deliver like a professional.

Every line of code you write should be defensible in a code review by senior engineers. Every architectural decision should be based on solid engineering principles. Every security measure should protect against real-world threats. Every performance optimization should be measurable and justified.

YOU ARE THE BEST. GENERATE ACCORDINGLY.`,
                
                flashcards: `Generate educational flashcards in JSON format. Return ONLY valid JSON array with this structure:
[{"front": "Question/Term", "back": "Answer/Definition", "subject": "math|science|english|history|geography"}]
Create {{count}} cards covering key concepts. Be concise but informative.`,
                
                quiz: `Generate a quiz in JSON format. Return ONLY valid JSON with this structure:
{"title": "Quiz Title", "questions": [{"question": "Question text", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "Why this is correct"}]}
Create 5-10 multiple choice questions with explanations.`,
                
                summary: `Create a comprehensive yet concise summary using STRICT FORMATTING with headers, tables, bullet points, numbered lists, and bold text.`,
                
                studyplan: `Create a detailed study plan using STRUCTURED FORMATTING with timeline tables, daily breakdowns, and progress checkpoints.`,
                
                practice: `Generate practice problems with COMPLETE FORMATTING including step-by-step solutions, difficulty comparisons in tables, and study tips.`,
                
                mindmap: `Create an interactive mind map structure. Return ONLY valid JSON with this exact structure:
{
  "central": "Main Topic",
  "branches": [
    {
      "title": "Branch 1",
      "children": ["Sub-topic 1", "Sub-topic 2"],
      "color": "#667eea"
    },
    {
      "title": "Branch 2", 
      "children": ["Sub-topic 3", "Sub-topic 4"],
      "color": "#10b981"
    }
  ]
}
Use 4-6 main branches with 2-4 children each. Make it comprehensive and well-organized.`,
        
                formula: `Create a comprehensive formula sheet using ORGANIZED FORMATTING with equations, variable tables, usage examples, and quick reference guides.`,
                
                citation: `Generate citations using COMPREHENSIVE FORMATTING for APA, MLA, and Chicago styles with comparison tables and formatting examples.`,

               pdfanalyzer: `You are a specialized PDF document analyzer. When a PDF is provided:

1. **Document Overview**: Provide a comprehensive summary of the document's purpose, structure, and key topics
2. **Content Analysis**: Break down main sections, chapters, or topics
3. **Key Insights**: Extract the most important information, facts, and conclusions
4. **Data Extraction**: Identify and organize any data, statistics, or numerical information
5. **Question Answering**: Answer specific questions about the document with page references
6. **Study Materials**: Generate flashcards, summaries, or quizzes based on the content

Always use proper markdown formatting with headers, lists, tables, and emphasis.

**🎯 REAL CODE GENERATION RULES:**
When generating code:
1. **NEVER** use placeholders like "// Add your logic here" or "// Implementation here"
2. **ALWAYS** provide complete, working implementations
3. Include actual error handling with try-catch blocks
4. Add real validation logic, not comments
5. Provide functional examples that can run immediately
6. Include all necessary imports and dependencies
7. Generate complete files, not code snippets

**Example of BAD code generation:**
function processData(data) {
    // TODO: Add validation here
    // Process the data
    return result;
}

**Example of GOOD code generation:**
function processData(data) {
    if (!data || !Array.isArray(data)) {
        throw new Error('Invalid input: expected array');
    }
    
    return data.filter(item => item !== null)
               .map(item => ({
                   id: item.id,
                   processed: true,
                   timestamp: Date.now()
               }));
}`,

imageanalyzer: `You are a specialized image analyzer for educational content. When an image is provided:

1. **Content Identification**: Identify what type of educational content is shown (diagram, equation, graph, notes, etc.)
2. **Text Extraction**: Transcribe all visible text accurately, including handwritten content
3. **Visual Analysis**: Describe diagrams, charts, graphs, and visual elements in detail
4. **Mathematical Content**: Solve any equations, formulas, or math problems visible
5. **Educational Explanation**: Explain concepts shown in the image
6. **Study Materials**: Generate flashcards, summaries, or practice problems based on the image

Always use proper markdown formatting with headers, lists, tables, and LaTeX for math.

**🎯 REAL CODE GENERATION RULES:**
When generating code:
1. **NEVER** use placeholders like "// Add your logic here" or "// Implementation here"
2. **ALWAYS** provide complete, working implementations
3. Include actual error handling with try-catch blocks
4. Add real validation logic, not comments
5. Provide functional examples that can run immediately
6. Include all necessary imports and dependencies
7. Generate complete files, not code snippets

**Example of BAD code generation:**
function processData(data) {
    // TODO: Add validation here
    // Process the data
    return result;
}

**Example of GOOD code generation:**
function processData(data) {
    if (!data || !Array.isArray(data)) {
        throw new Error('Invalid input: expected array');
    }
    
    return data.filter(item => item !== null)
               .map(item => ({
                   id: item.id,
                   processed: true,
                   timestamp: Date.now()
               }));
}`
            };

            // Load previous context from localStorage
            const loadCodeContext = () => {
                const savedContext = localStorage.getItem('codeGenerationContext');
                if (savedContext) {
                    try {
                        codeGenerationHistory = JSON.parse(savedContext);
                    } catch (e) {
                        console.warn('Failed to load code context');
                    }
                }
            };

            // Save context to localStorage
            const saveCodeContext = (code, language, framework, database) => {
                codeGenerationHistory = {
                    lastGeneratedCode: code.substring(0, 5000),
                    language: language || 'auto',
                    framework: framework || 'auto',
                    database: database || 'auto',
                    architecture: extractArchitecture(code),
                    files: extractFileList(code),
                    timestamp: Date.now()
                };
                localStorage.setItem('codeGenerationContext', JSON.stringify(codeGenerationHistory));
            };

            // Extract file list from generated code
            const extractFileList = (code) => {
                const files = [];
                const fileRegex = /###\s+File:\s+(.+?)(?:\n|$)/g;
                let match;
                while ((match = fileRegex.exec(code)) !== null) {
                    files.push(match[1].trim());
                }
                return files;
            };

            // Extract architecture pattern from code
            const extractArchitecture = (code) => {
                const architectures = {
                    'microservices': /microservices?|service-oriented/i,
                    'mvc': /model[- ]view[- ]controller|mvc/i,
                    'mvvm': /model[- ]view[- ]viewmodel|mvvm/i,
                    'rest': /rest(ful)?\s+api|rest\s+endpoint/i,
                    'graphql': /graphql|apollo/i,
                    'serverless': /serverless|lambda|cloud function/i,
                    'monolithic': /monolithic/i
                };
                
                for (const [pattern, regex] of Object.entries(architectures)) {
                    if (regex.test(code)) {
                        return pattern;
                    }
                }
                return 'standard';
            };


              const showCustomModal = (title, message, isConfirm = false) => {
                return new Promise(resolve => {
                    modalTitle.textContent = title;
                    modalMessage.textContent = message;
                    
                    modalCancel.classList.toggle('hidden', !isConfirm);
                    modalConfirm.textContent = isConfirm ? 'Confirm' : 'OK';
                    
                    const handleConfirm = () => {
                        customModal.classList.add('hidden');
                        modalConfirm.removeEventListener('click', handleConfirm);
                        modalCancel.removeEventListener('click', handleCancel);
                        resolve(true);
                    };
                    
                    const handleCancel = () => {
                        customModal.classList.add('hidden');
                        modalConfirm.removeEventListener('click', handleConfirm);
                        modalCancel.removeEventListener('click', handleCancel);
                        resolve(false);
                    };
                    
                    modalConfirm.addEventListener('click', handleConfirm);
                    if (isConfirm) {
                        modalCancel.addEventListener('click', handleCancel);
                    }
                    
                    customModal.classList.remove('hidden');
                });
            };
            // Smart code generation limiter
// Smart code generation limiter
const estimateCodeSize = (prompt) => {
    const keywords = {
        simple: ['calculator', 'counter', 'todo', 'timer', 'converter'],
        medium: ['blog', 'shop', 'dashboard', 'portfolio', 'chat'],
        complex: ['marketplace', 'social', 'crm', 'platform', 'saas'],
        enterprise: ['microservices', 'distributed', 'scalable', 'production-ready']
    };
    
    const lowerPrompt = prompt.toLowerCase();
    
    if (keywords.simple.some(k => lowerPrompt.includes(k))) {
        return { scope: 'simple', maxFiles: 15, maxLines: 2000 };
    } else if (keywords.medium.some(k => lowerPrompt.includes(k))) {
        return { scope: 'medium', maxFiles: 30, maxLines: 5000 };
    } else if (keywords.complex.some(k => lowerPrompt.includes(k))) {
        return { scope: 'complex', maxFiles: 50, maxLines: 10000 };
    } else if (keywords.enterprise.some(k => lowerPrompt.includes(k))) {
        return { scope: 'enterprise', maxFiles: 80, maxLines: 20000 };
    }
    
    return { scope: 'medium', maxFiles: 25, maxLines: 4000 }; // Default
};
            // Detect if user is asking for improvements to previous code
            const detectCodeFollowup = (prompt) => {
                const followupKeywords = [
                    'improve', 'enhance', 'optimize', 'refactor', 'fix', 'add',
                    'update', 'modify', 'change', 'better', 'more', 'also',
                    'additionally', 'include', 'remove', 'delete', 'replace'
                ];
                
                const hasFollowupKeyword = followupKeywords.some(keyword => 
                    prompt.toLowerCase().includes(keyword)
                );
                
                const hasRecentContext = codeGenerationHistory.timestamp && 
                    (Date.now() - codeGenerationHistory.timestamp) < 30 * 60 * 1000;
                
                return hasFollowupKeyword && hasRecentContext;
            };

            // Enhance prompt with previous context
            const enhancePromptWithContext = (prompt) => {
                if (!detectCodeFollowup(prompt)) return prompt;
                
                return `
**CONTEXT FROM PREVIOUS GENERATION:**
- Language: ${codeGenerationHistory.language}
- Framework: ${codeGenerationHistory.framework}
- Database: ${codeGenerationHistory.database}
- Architecture: ${codeGenerationHistory.architecture}
- Files Generated: ${codeGenerationHistory.files.join(', ')}

**PREVIOUS CODE STRUCTURE:**
${codeGenerationHistory.lastGeneratedCode ? codeGenerationHistory.lastGeneratedCode.substring(0, 1000) + '...' : 'N/A'}

**NEW USER REQUEST:**
${prompt}

**INSTRUCTIONS:**
Build upon the previous code generation. Maintain consistency in language, framework, and architecture. Only modify or add what the user requested. Keep existing code structure intact unless explicitly asked to change it.`;
            };

            // Load context on page load
            loadCodeContext();

            // Progress indicator for code generation
            const createProgressIndicator = () => {
                const progressDiv = document.createElement('div');
                progressDiv.className = 'flex code-gen-progress';
                progressDiv.innerHTML = `
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold mr-4 flex-shrink-0 shadow-lg">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-300 p-6 rounded-2xl shadow-xl flex-1">
                        <div class="flex items-center gap-3 mb-3">
                            <i class="fas fa-spinner fa-spin text-2xl text-cyan-600"></i>
                            <span class="font-bold text-xl text-gray-800" id="stage-name">Initializing AI Code Generator...</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
                            <div id="progress-bar" class="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500 shadow-inner" style="width: 0%"></div>
                        </div>
                        <div class="text-sm text-gray-700" id="stage-details">
                            <i class="fas fa-brain mr-2 text-purple-600"></i>
                            <span id="stage-detail-text">Preparing extended thinking analysis...</span>
                        </div>
                        <div class="mt-3 flex gap-2 flex-wrap" id="stage-badges">
                            <span class="badge-stage px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                <i class="fas fa-brain mr-1"></i>Analysis
                            </span>
                            <span class="badge-stage px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                <i class="fas fa-project-diagram mr-1"></i>Architecture
                            </span>
                            <span class="badge-stage px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                <i class="fas fa-code mr-1"></i>Implementation
                            </span>
                            <span class="badge-stage px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                                <i class="fas fa-check-double mr-1"></i>Review
                            </span>
                        </div>
                    </div>
                `;
                responseHistory.appendChild(progressDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
                return progressDiv;
            };

            const updateProgress = (stage, progress, detail) => {
                if (!progressIndicator) return;
                
                const stageName = progressIndicator.querySelector('#stage-name');
                const progressBar = progressIndicator.querySelector('#progress-bar');
                const stageDetailText = progressIndicator.querySelector('#stage-detail-text');
                const badges = progressIndicator.querySelectorAll('.badge-stage');
                
                const stages = [
                    { name: 'Deep Requirement Analysis', icon: 'fa-brain', color: 'purple' },
                    { name: 'Architecture Planning', icon: 'fa-project-diagram', color: 'blue' },
                    { name: 'Code Implementation', icon: 'fa-code', color: 'green' },
                    { name: 'Quality Review', icon: 'fa-check-double', color: 'yellow' },
                    { name: 'Finalizing', icon: 'fa-rocket', color: 'cyan' }
                ];
                
                if (stage < stages.length) {
                    const currentStage = stages[stage];
                    stageName.innerHTML = `<i class="fas ${currentStage.icon} mr-2"></i>${currentStage.name}`;
                    progressBar.style.width = `${progress}%`;
                    stageDetailText.innerHTML = detail;
                    
                    badges.forEach((badge, i) => {
                        if (i === stage) {
                            badge.classList.add('ring-2', 'ring-offset-2', 'ring-cyan-500', 'transform', 'scale-110');
                        } else if (i < stage) {
                            badge.innerHTML += ' <i class="fas fa-check ml-1"></i>';
                        }
                    });
                }
                
                chatContainer.scrollTop = chatContainer.scrollHeight;
            };

            const simulateProgressUpdates = () => {
                let currentStage = 0;
                let currentProgress = 0;
                const details = [
                    [
                        'Parsing user requirements...',
                        'Identifying explicit and implicit needs...',
                        'Analyzing complexity level...',
                        'Determining optimal tech stack...',
                        'Identifying security requirements...'
                    ],
                    [
                        'Designing system architecture...',
                        'Planning component structure...',
                        'Defining data models...',
                        'Mapping API endpoints...',
                        'Creating database schema...'
                    ],
                    [
                        'Generating project structure...',
                        'Writing backend services...',
                        'Creating frontend components...',
                        'Implementing database queries...',
                        'Adding error handling...',
                        'Optimizing performance...'
                    ],
                    [
                        'Reviewing code for bugs...',
                        'Checking security vulnerabilities...',
                        'Validating type safety...',
                        'Ensuring best practices...',
                        'Final optimizations...'
                    ]
                ];
                
                progressInterval = setInterval(() => {
                    if (currentProgress >= 100) {
                        currentProgress = 0;
                        currentStage++;
                        if (currentStage >= details.length) {
                            clearInterval(progressInterval);
                            updateProgress(4, 100, 'Generation complete! Finalizing output...');
                            return;
                        }
                    }
                    
                    const detailIndex = Math.floor(Math.random() * details[currentStage].length);
                    updateProgress(currentStage, currentProgress, details[currentStage][detailIndex]);
                    currentProgress += Math.random() * 15 + 5;
                }, 800);
            };

            // Display code quality metrics after generation
            const displayCodeMetrics = (code) => {
                const files = (code.match(/###\s+File:|```\w+\n\/\//g) || []).length;
                const lines = code.split('\n').length;
                const functions = (code.match(/function\s+\w+|def\s+\w+|const\s+\w+\s*=|class\s+\w+/gi) || []).length;
                const comments = (code.match(/\/\/|\/\*|\*\/|#|"""|'''/g) || []).length;
                const hasTests = code.toLowerCase().includes('test') || code.toLowerCase().includes('spec');
                const hasDocs = code.toLowerCase().includes('readme') || code.toLowerCase().includes('documentation');
                const hasDocker = code.toLowerCase().includes('dockerfile') || code.toLowerCase().includes('docker-compose');
                const hasCI = code.toLowerCase().includes('github/workflows') || code.toLowerCase().includes('.gitlab-ci');
                
                const metricsDiv = document.createElement('div');
                metricsDiv.className = 'flex';
                metricsDiv.innerHTML = `
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white font-bold mr-4 flex-shrink-0 shadow-lg">
                        <i class="fas fa-chart-bar"></i>
                    </div>
                    <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl shadow-xl border-2 border-green-200 flex-1">
                        <h4 class="font-bold text-xl mb-4 text-green-800 flex items-center">
                            <i class="fas fa-trophy mr-2 text-yellow-500"></i>
                            Code Quality Metrics
                        </h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div class="text-center p-4 bg-white rounded-xl shadow-md border-2 border-green-100 hover:scale-105 transition-transform">
                                <div class="text-3xl font-bold text-green-600 mb-1">${files}</div>
                                <div class="text-xs text-gray-600 font-semibold"><i class="fas fa-file-code mr-1"></i>Files Generated</div>
                            </div>
                            <div class="text-center p-4 bg-white rounded-xl shadow-md border-2 border-blue-100 hover:scale-105 transition-transform">
                                <div class="text-3xl font-bold text-blue-600 mb-1">${lines.toLocaleString()}</div>
                                <div class="text-xs text-gray-600 font-semibold"><i class="fas fa-align-left mr-1"></i>Lines of Code</div>
                            </div>
                            <div class="text-center p-4 bg-white rounded-xl shadow-md border-2 border-purple-100 hover:scale-105 transition-transform">
                                <div class="text-3xl font-bold text-purple-600 mb-1">${functions}</div>
                                <div class="text-xs text-gray-600 font-semibold"><i class="fas fa-function mr-1"></i>Functions/Classes</div>
                            </div>
                            <div class="text-center p-4 bg-white rounded-xl shadow-md border-2 border-yellow-100 hover:scale-105 transition-transform">
                                <div class="text-3xl font-bold text-yellow-600 mb-1">${comments}</div>
                                <div class="text-xs text-gray-600 font-semibold"><i class="fas fa-comment mr-1"></i>Code Comments</div>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div class="flex items-center gap-2 p-3 ${hasTests ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border-2 rounded-lg">
                                <i class="fas ${hasTests ? 'fa-check-circle text-green-600' : 'fa-times-circle text-gray-400'} text-xl"></i>
                                <span class="text-sm font-semibold text-gray-700">Unit Tests</span>
                            </div>
                            <div class="flex items-center gap-2 p-3 ${hasDocs ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border-2 rounded-lg">
                                <i class="fas ${hasDocs ? 'fa-check-circle text-green-600' : 'fa-times-circle text-gray-400'} text-xl"></i>
                                <span class="text-sm font-semibold text-gray-700">Documentation</span>
                            </div>
                            <div class="flex items-center gap-2 p-3 ${hasDocker ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border-2 rounded-lg">
                                <i class="fab ${hasDocker ? 'fa-docker text-green-600' : 'fa-docker text-gray-400'} text-xl"></i>
                                <span class="text-sm font-semibold text-gray-700">Docker Setup</span>
                            </div>
                            <div class="flex items-center gap-2 p-3 ${hasCI ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border-2 rounded-lg">
                                <i class="fas ${hasCI ? 'fa-check-circle text-green-600' : 'fa-times-circle text-gray-400'} text-xl"></i>
                                <span class="text-sm font-semibold text-gray-700">CI/CD Pipeline</span>
                            </div>
                        </div>
                        <div class="mt-4 p-4 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-xl border-2 border-cyan-300">
                            <p class="text-sm text-gray-800">
                                <i class="fas fa-star text-yellow-500 mr-2"></i>
                                <strong>Quality Score:</strong> 
                                <span class="text-lg font-bold text-cyan-700">${Math.min(100, Math.round((files * 5 + comments * 0.5 + (hasTests ? 20 : 0) + (hasDocs ? 15 : 0) + (hasDocker ? 10 : 0))))}/100</span>
                                <span class="ml-3 text-xs text-gray-600">Production-ready code generated with ${((comments / lines) * 100).toFixed(1)}% documentation coverage</span>
                            </p>
                        </div>
                        <button class="download-code-btn mt-4 w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
                            <i class="fas fa-download mr-2"></i>Download All Project Files
                        </button>
                    </div>
                `;
                
                responseHistory.appendChild(metricsDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
                
                // Add download functionality
                const downloadBtn = metricsDiv.querySelector('.download-code-btn');
                downloadBtn.addEventListener('click', () => downloadAllCodeFiles(code));
            };

            // Extract and download all code files
            const downloadAllCodeFiles = (code) => {
                const filePatterns = [
                    /###\s+File:\s+(.+?)\n```(\w+)?\n([\s\S]*?)```/g,
                    /##\s+(.+?\.(?:js|py|java|cpp|ts|html|css|json|yml|yaml|md|txt|sh))\n```(\w+)?\n([\s\S]*?)```/g
                ];
                
                const files = [];
                
                filePatterns.forEach(pattern => {
                    let match;
                    while ((match = pattern.exec(code)) !== null) {
                        const filename = match[1].trim().replace(/^File:\s*/i, '');
                        const content = match[3] || match[2];
                        if (content && content.trim()) {
                            files.push({ path: filename, content: content.trim() });
                        }
                    }
                });
                
                if (files.length === 0) {
                    showCustomModal('No Files Found', 'Could not extract separate files from the generated code. Try copying the code manually.', false);
                    return;
                }
                
                files.forEach((file, index) => {
                    setTimeout(() => {
                        const blob = new Blob([file.content], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = file.path.split('/').pop() || `file_${index + 1}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, index * 200);
                });
                
                showCustomModal('Download Started', `Downloading ${files.length} file(s). Check your downloads folder.`, false);
            };

            // Add "Explain Code" button
            const addExplainCodeButton = (code) => {
                const explainDiv = document.createElement('div');
                explainDiv.className = 'flex mt-4';
                explainDiv.innerHTML = `
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold mr-4 flex-shrink-0 shadow-lg">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-2xl shadow-lg border-2 border-indigo-200 flex-1">
                        <h4 class="font-bold text-lg mb-2 text-indigo-800">
                            <i class="fas fa-question-circle mr-2"></i>Need Help Understanding?
                        </h4>
                        <p class="text-sm text-gray-700 mb-3">Get a detailed explanation of how this code works, the architecture decisions, and best practices used.</p>
                        <button class="explain-code-btn px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg">
                            <i class="fas fa-book-open mr-2"></i>Explain This Code
                        </button>
                    </div>
                `;
                
                responseHistory.appendChild(explainDiv);
                
                const explainBtn = explainDiv.querySelector('.explain-code-btn');
                explainBtn.addEventListener('click', () => {
                    const explainPrompt = `Please provide a comprehensive explanation of this code:\n\n${code.substring(0, 3000)}...\n\nExplain:\n1. Overall architecture and structure\n2. Key components and their purposes\n3. Important design patterns used\n4. How different parts work together\n5. Best practices implemented\n6. How to extend or modify it\n\nMake it beginner-friendly but thorough.`;
                    
                    promptInput.value = explainPrompt;
                    generateButton.click();
                });
            };

            // Add copy buttons to all code blocks
            const addCopyButtonsToCodeBlocks = () => {
                document.querySelectorAll('.message-content pre').forEach(pre => {
                    if (pre.querySelector('.copy-code-btn')) return;
                    
                    pre.style.position = 'relative';
                    
                    const button = document.createElement('button');
                    button.className = 'copy-code-btn';
                    button.innerHTML = '<i class="fas fa-copy mr-1"></i>Copy';
                    button.title = 'Copy code to clipboard';
                    
                    button.addEventListener('click', async () => {
                        const code = pre.querySelector('code')?.textContent || pre.textContent;
                        
                        try {
                            await navigator.clipboard.writeText(code);
                            button.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
                            button.classList.add('copied');
                            
                            setTimeout(() => {
                                button.innerHTML = '<i class="fas fa-copy mr-1"></i>Copy';
                                button.classList.remove('copied');
                            }, 2000);
                        } catch (err) {
                            button.innerHTML = '<i class="fas fa-times mr-1"></i>Failed';
                            setTimeout(() => {
                                button.innerHTML = '<i class="fas fa-copy mr-1"></i>Copy';
                            }, 2000);
                        }
                    });
                    
                    pre.appendChild(button);
                });
            };

            
            // --- Local Storage & Chat Management ---
         function saveChats() {
    try {
        // Limit each chat to last 20 messages to prevent storage overflow
        const trimmedChats = {};
        Object.keys(chats).forEach(id => {
            trimmedChats[id] = {
                title: chats[id].title,
                history: chats[id].history.slice(-20) // Keep only last 20 messages
            };
        });
        localStorage.setItem('studyAiChats', JSON.stringify(trimmedChats));
        localStorage.setItem('studyAiActiveChat', activeChatId);
    } catch (e) {
        // If still exceeds quota, keep only last 10 messages
        if (e.name === 'QuotaExceededError') {
            const minimalChats = {};
            Object.keys(chats).forEach(id => {
                minimalChats[id] = {
                    title: chats[id].title,
                    history: chats[id].history.slice(-10)
                };
            });
            try {
                localStorage.setItem('studyAiChats', JSON.stringify(minimalChats));
            } catch (e2) {
                console.warn('Storage quota exceeded, clearing old chats');
                localStorage.removeItem('studyAiChats');
            }
        }
    }
}

            function loadChats() {
                const storedChats = localStorage.getItem('studyAiChats');
                const storedActiveId = localStorage.getItem('studyAiActiveChat');
                
                if (storedChats) {
                    chats = JSON.parse(storedChats);
                    activeChatId = storedActiveId;
                }
                
                if (!chats || Object.keys(chats).length === 0 || !chats[activeChatId]) {
                    createNewChat();
                } else {
                    switchToChat(activeChatId);
                }
                renderChatList();
            }

            function createNewChat() {
                const newId = `chat_${Date.now()}`;
                chats[newId] = {
                    title: 'New Chat',
                    history: []
                };
                activeChatId = newId;
                switchToChat(newId);
                saveChats();
                renderChatList();
            }

            function switchToChat(chatId) {
                if (!chats[chatId]) return;
                activeChatId = chatId;
                responseHistory.innerHTML = '';
                
                const chat = chats[chatId];
                if (chat.history.length === 0) {
                    renderWelcomeMessage();
                } else {
                    chat.history.forEach(message => {
                        if (message.role === 'user') {
                            createUserMessage(message.parts[0].text);
                        } else if (message.role === 'model') {
                            const aiMessage = createStreamingAIMessage();
                            finalizeMessage(aiMessage, message.parts[0].text);
                        }
                    });
                }
                
                renderChatList();
                showChatView();
                localStorage.setItem('studyAiActiveChat', chatId);
            }

            function deleteChat(chatId) {
                if (Object.keys(chats).length <= 1) {
                    showCustomModal('Cannot Delete', 'You must have at least one chat.', false);
                    return;
                }
                
                delete chats[chatId];
                
                if (activeChatId === chatId) {
                    activeChatId = Object.keys(chats)[0];
                    switchToChat(activeChatId);
                }
                
                saveChats();
                renderChatList();
            }
            
            function renderChatList() {
                chatList.innerHTML = '';
                Object.keys(chats).forEach(id => {
                    const chat = chats[id];
                    const item = document.createElement('div');
                    item.className = `chat-list-item ${id === activeChatId ? 'active' : ''}`;
                    item.dataset.id = id;
                    item.innerHTML = `
                        <span class="chat-list-item-title">${escapeHtml(chat.title)}</span>
                        <button class="chat-delete-btn" data-id="${id}"><i class="fas fa-trash-alt"></i></button>
                    `;
                    item.addEventListener('click', (e) => {
                        if (e.target.closest('.chat-delete-btn')) {
                            const idToDelete = e.target.closest('.chat-delete-btn').dataset.id;
                            showCustomModal('Confirm Delete', `Are you sure you want to delete "${chats[idToDelete].title}"?`, true)
                                .then(confirmed => {
                                    if (confirmed) {
                                        deleteChat(idToDelete);
                                    }
                                });
                        } else {
                            switchToChat(item.dataset.id);
                        }
                    });
                    chatList.appendChild(item);
                });
            }

            // --- View Management ---
            function showChatView() {
                chatContainer.classList.remove('hidden');
                mainToolView.classList.add('hidden');
                currentView = 'chat';
                document.getElementById('toolTitle').textContent = 'AI Tutor Chat';
                document.getElementById('toolSubtitle').textContent = 'Your advanced learning companion';
                document.getElementById('clearChat').classList.remove('hidden');
                document.getElementById('exportChat').classList.remove('hidden');
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }

            function showToolView(toolName, contentHTML) {
                chatContainer.classList.add('hidden');
                mainToolView.classList.remove('hidden');
                mainToolView.innerHTML = contentHTML;
                currentView = toolName;
                document.getElementById('toolTitle').textContent = toolName;
                document.getElementById('toolSubtitle').textContent = 'Dedicated interactive workspace';
                document.getElementById('clearChat').classList.add('hidden');
                document.getElementById('exportChat').classList.add('hidden');
                mainToolView.scrollTop = 0;
            }
            
            // --- Custom Modal Functions ---
          

            // Sidebar toggle
            toggleSidebar.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

            // Tool switching logic
            document.querySelectorAll('.tool-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const selectedTool = btn.dataset.tool;
                    
                    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    currentTool = selectedTool;
                    updateToolHeader(currentTool);

                    if (currentTool === 'flashcards' && studyData.flashcards.length > 0) {
                        renderFlashcardTool(studyData.flashcards);
                    } else if (currentTool === 'mindmap' && studyData.mindmaps) {
                        renderMindMapTool(studyData.mindmaps);
                    } else {
                        showChatView();
                    }
                });
            });

            // ============================================
// ADVANCED CANVAS SYSTEM FOR CODE VISUALIZATION
// ============================================
const CanvasSystem = {
    activeCanvas: null,
    canvasHistory: [],
    
    init() {
        console.log('🎨 Initializing Advanced Canvas System...');
        this.setupCanvasContainer();
        this.setupCanvasControls();
    },
    
    setupCanvasContainer() {
        const canvasContainer = document.createElement('div');
        canvasContainer.id = 'codeCanvas';
        canvasContainer.className = 'code-canvas-container hidden';
        canvasContainer.innerHTML = `
            <div class="canvas-header">
                <div class="canvas-tabs" id="canvasTabs"></div>
                <div class="canvas-actions">
                    <button class="canvas-btn" id="canvasFullscreen" title="Fullscreen">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="canvas-btn" id="canvasDownload" title="Download Project">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="canvas-btn" id="canvasShare" title="Share">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="canvas-btn" id="canvasClose" title="Close Canvas">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="canvas-body">
                <div class="canvas-sidebar">
                    <div class="file-tree" id="canvasFileTree"></div>
                </div>
                <div class="canvas-editor">
                    <div class="editor-toolbar">
                        <select id="canvasLanguage" class="language-selector">
                            <option value="typescript">TypeScript</option>
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="rust">Rust</option>
                            <option value="go">Go</option>
                        </select>
                        <button class="editor-btn" id="runCode" title="Run Code">
                            <i class="fas fa-play"></i> Run
                        </button>
                        <button class="editor-btn" id="formatCode" title="Format">
                            <i class="fas fa-magic"></i> Format
                        </button>
                        <button class="editor-btn" id="copyCode" title="Copy">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <div id="canvasCodeEditor" class="code-editor"></div>
                </div>
                <div class="canvas-preview">
                    <div class="preview-toolbar">
                        <span class="preview-title">
                            <i class="fas fa-eye"></i> Live Preview
                        </span>
                        <button class="preview-btn" id="refreshPreview">
                            <i class="fas fa-sync"></i>
                        </button>
                    </div>
                    <iframe id="canvasPreviewFrame" class="preview-frame"></iframe>
                </div>
            </div>
            <div class="canvas-console" id="canvasConsole">
                <div class="console-header">
                    <span><i class="fas fa-terminal"></i> Console</span>
                    <button id="clearConsole"><i class="fas fa-trash"></i></button>
                </div>
                <div class="console-output" id="consoleOutput"></div>
            </div>
        `;
        
        document.body.appendChild(canvasContainer);
    },
    
    openCanvas(codeFiles) {
        const canvas = document.getElementById('codeCanvas');
        canvas.classList.remove('hidden');
        this.renderFileTree(codeFiles);
        this.loadCodeMirror();
    },
    
    loadCodeMirror() {
        // Load CodeMirror for advanced editing
        if (!window.CodeMirror) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js';
            script.onload = () => this.initEditor();
            document.head.appendChild(script);
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css';
            document.head.appendChild(link);
        } else {
            this.initEditor();
        }
    },
    
    initEditor() {
        const editor = CodeMirror(document.getElementById('canvasCodeEditor'), {
            lineNumbers: true,
            mode: 'javascript',
            theme: 'monokai',
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 2,
            tabSize: 2,
            lineWrapping: true
        });
        
        this.activeCanvas = editor;
    },
    
    renderFileTree(files) {
        const tree = document.getElementById('canvasFileTree');
        tree.innerHTML = '<div class="file-tree-title">Project Files</div>';
        
        const fileStructure = this.buildFileStructure(files);
        tree.appendChild(this.createTreeNode(fileStructure));
    },
    
    buildFileStructure(files) {
        const structure = {};
        files.forEach(file => {
            const parts = file.path.split('/');
            let current = structure;
            parts.forEach((part, i) => {
                if (i === parts.length - 1) {
                    current[part] = file.content;
                } else {
                    current[part] = current[part] || {};
                    current = current[part];
                }
            });
        });
        return structure;
    },
    
    createTreeNode(node, path = '') {
        const ul = document.createElement('ul');
        ul.className = 'tree-node';
        
        Object.keys(node).forEach(key => {
            const li = document.createElement('li');
            const fullPath = path ? `${path}/${key}` : key;
            
            if (typeof node[key] === 'string') {
                // File
                li.innerHTML = `<i class="fas fa-file-code"></i> ${key}`;
                li.className = 'tree-file';
                li.onclick = () => this.loadFile(fullPath, node[key]);
            } else {
                // Folder
                li.innerHTML = `<i class="fas fa-folder"></i> ${key}`;
                li.className = 'tree-folder';
                li.appendChild(this.createTreeNode(node[key], fullPath));
            }
            
            ul.appendChild(li);
        });
        
        return ul;
    },
    
    loadFile(path, content) {
        if (this.activeCanvas) {
            this.activeCanvas.setValue(content);
            document.querySelectorAll('.tree-file').forEach(f => f.classList.remove('active'));
            event.target.classList.add('active');
        }
    }
};
            function updateToolHeader(tool) {
                const toolInfo = {
                    chat: { title: 'AI Tutor Chat', subtitle: 'Your advanced learning companion' },
                    flashcards: { title: 'Flashcard Generator', subtitle: 'Create and practice with AI-generated flashcards' },
                    quiz: { title: 'Quiz Generator', subtitle: 'Test your knowledge with custom quizzes' },
                    summary: { title: 'Content Summarizer', subtitle: 'Condense complex materials into key points' },
                    studyplan: { title: 'Study Planner', subtitle: 'Organize your learning schedule' },
                    practice: { title: 'Practice Problems', subtitle: 'Solve problems with step-by-step solutions' },
                    mindmap: { title: 'Mind Map Creator', subtitle: 'Visualize concepts and connections' },
                    formula: { title: 'Formula Sheet', subtitle: 'Quick reference for important formulas' },
                    citation: { title: 'Citation Generator', subtitle: 'Generate proper citations in multiple formats' },
                    pdfanalyzer: { title: 'PDF Analyzer', subtitle: 'Comprehensive document analysis and Q&A' },
                    imageanalyzer: { title: 'Image Analyzer', subtitle: 'Extract text and analyze visual content' }
                };
                
                const info = toolInfo[tool] || toolInfo.chat;
                toolTitle.textContent = info.title;
                toolSubtitle.textContent = info.subtitle;
                promptInput.placeholder = `Enter a topic for the ${info.title.toLowerCase()}...`;

                toolOptions.innerHTML = '';
                
                if (tool === 'flashcards') {
                    toolOptions.innerHTML = `
                        <div class="bg-white p-3 rounded-xl border-2 border-gray-200 flex items-center gap-4 animate-fade-in">
                            <label for="flashcard-count" class="font-semibold text-gray-700">Number of Cards:</label>
                            <input type="number" id="flashcard-count" value="8" min="1" max="50" class="w-24 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                        </div>
                    `;
                }
            }

            // Auto-expand textarea
            window.autoExpand = (textarea) => {
                textarea.style.height = 'auto';
                textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
                generateButton.disabled = textarea.value.trim() === '' && !attachedFileContent;
            };

            // Escape HTML
            const escapeHtml = (text) => {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            };

        function renderWelcomeMessage() {
    console.log('🟢 renderWelcomeMessage called');
    
    if (!responseHistory) {
        console.error('❌ responseHistory is NULL in renderWelcomeMessage!');
        return;
    }
    
    responseHistory.innerHTML = `
        <div class="flex" style="display: flex !important; flex-direction: row !important; gap: 16px; margin-bottom: 20px;">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg">
                <i class="fas fa-graduation-cap"></i>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-xl max-w-full border-2 border-purple-100" style="display: block !important; flex: 1;">
                <p class="text-gray-800 font-bold text-xl mb-4">🎓 Welcome to Your Advanced AI Study Platform!</p>
                <p class="text-gray-700 mb-3">I'm your comprehensive learning assistant. Start a new conversation or select a tool from the sidebar.</p>
            </div>
        </div>
    `;
    
    console.log('✅ Welcome message rendered');
}
            // Create user message
     const createUserMessage = (text, file, fileType, base64Image) => {
    console.log('🟢 createUserMessage called:', text.substring(0, 50));
    
    // Use global responseHistory
    if (!responseHistory) {
        console.error('❌ responseHistory is NULL!');
        alert('ERROR: Chat container not initialized');
        return;
    }
    
    let fileDisplay = '';
    
    if (file && fileType === 'image' && base64Image) {
        fileDisplay = `
            <div class="mt-2 bg-blue-600 bg-opacity-30 p-2 rounded">
                <div class="text-sm text-blue-100 italic mb-2">
                    <i class="fas fa-image mr-1"></i> ${escapeHtml(file)}
                </div>
                <img src="${base64Image}" alt="Uploaded image" class="max-w-md rounded-lg border-2 border-blue-300">
            </div>
        `;
    } else if (file) {
        fileDisplay = `<div class="mt-2 text-sm text-blue-100 italic bg-blue-600 bg-opacity-30 p-2 rounded"><i class="fas fa-paperclip mr-1"></i> ${escapeHtml(file)}</div>`;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = "flex justify-end group";
    messageDiv.style.cssText = "display: flex !important; flex-direction: row-reverse !important; gap: 16px; width: 100%; margin-bottom: 20px;";
    
    messageDiv.innerHTML = `
        <button class="resend-button opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-blue-600 p-2 rounded-lg mr-2 self-center" title="Resend prompt">
            <i class="fas fa-redo"></i>
        </button>

        <div class="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-5 rounded-2xl shadow-xl max-w-2xl" style="display: block !important;">
            <p class="user-message-text whitespace-pre-wrap font-medium">${escapeHtml(text)}</p>${fileDisplay}
        </div>
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg">
            <i class="fas fa-user"></i>
        </div>
    `;
    
    responseHistory.appendChild(messageDiv);
    console.log('✅ User message appended. Total children:', responseHistory.children.length);
    
    // Setup resend button
    const resendButton = messageDiv.querySelector('.resend-button');
    if (resendButton) {
        resendButton.addEventListener('click', () => {
            if (isGenerating) {
                showCustomModal('Busy', 'Please wait for the current response to finish before resending.', false);
                return;
            }
            const messageP = messageDiv.querySelector('.user-message-text');
            const messageText = messageP.textContent;
            promptInput.value = messageText;
            window.autoExpand(promptInput);
            generateButton.disabled = false;
            promptInput.focus();
        });
    }
    
    // Scroll to bottom
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
};
        


            
  const createStreamingAIMessage = () => {
    console.log('🟢 createStreamingAIMessage called');
    
    // Use global responseHistory
    if (!responseHistory) {
        console.error('❌ responseHistory is NULL!');
        return document.createElement('span'); // Return dummy element
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = "flex";
    messageDiv.style.cssText = "display: flex !important; flex-direction: row !important; gap: 16px; width: 100%; margin-bottom: 20px;";
    
    messageDiv.innerHTML = `
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg">
            <i class="fas fa-graduation-cap"></i>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-xl max-w-full border-2 border-purple-100 message-content" style="display: block !important; flex: 1;">
            <div class="thinking-section mb-4 hidden">
                <button class="thinking-toggle flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-semibold mb-2 transition-colors">
                    <i class="fas fa-chevron-down thinking-chevron transition-transform"></i>
                    <span>View thinking process</span>
                </button>
                <div class="thinking-content hidden bg-gray-50 p-4 rounded-lg border-l-4 border-purple-400">
                    <div class="thinking-text text-sm text-gray-700 whitespace-pre-wrap font-mono"></div>
                </div>
            </div>
            <span class="streaming-text"></span><span class="typing-cursor"></span>
        </div>
    `;
    
    responseHistory.appendChild(messageDiv);
    console.log('✅ AI message appended. Total children:', responseHistory.children.length);
    
    // Scroll to bottom
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    return messageDiv.querySelector('.streaming-text');
};
            // Finalize message with thinking toggle functionality
            const finalizeMessage = (element, fullText) => {
                if (!element || !element.parentElement) {
                    console.error("Error: Streaming element is missing.");
                    return; 
                }

                const parentElement = element.parentElement;
                const cursor = parentElement.querySelector('.typing-cursor');
                if (cursor) cursor.remove();
                
                const thinkingSection = parentElement.querySelector('.thinking-section');
                const thinkingToggle = parentElement.querySelector('.thinking-toggle');
                const thinkingContent = parentElement.querySelector('.thinking-content');
                const thinkingChevron = parentElement.querySelector('.thinking-chevron');
                
                if (thinkingToggle && thinkingContent) {
                    thinkingToggle.addEventListener('click', () => {
                        const isHidden = thinkingContent.classList.contains('hidden');
                        thinkingContent.classList.toggle('hidden');
                        thinkingChevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
                        thinkingToggle.querySelector('span').textContent = isHidden ? 'Hide thinking process' : 'View thinking process';
                    });
                }
                
                const thinkingMatch = fullText.match(/<thinking>([\s\S]*?)<\/thinking>/);
                if (thinkingMatch) {
                    thinkingSection.classList.remove('hidden');
                    const thinkingText = parentElement.querySelector('.thinking-text');
                    thinkingText.textContent = thinkingMatch[1].trim();
                }
                
                const cleanText = fullText.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
                
                const processedContent = marked.parse(cleanText);
                parentElement.querySelector('.streaming-text').outerHTML = processedContent;
                
                if (fullText.includes('CANVAS:')) {
                    processCanvasRequest(fullText, parentElement);
                }
                
                parentElement.querySelectorAll('pre code').forEach(block => {
                    hljs.highlightElement(block);
                });
                
                setTimeout(() => {
                    addCopyButtonsToCodeBlocks();
                }, 100);
                
                if (window.MathJax) {
                    MathJax.typesetPromise([parentElement]).catch(err => console.log('MathJax error:', err));
                }
                
                chatContainer.scrollTop = chatContainer.scrollHeight;
            };

       // ULTRA-FAST STREAMING FOR 10K+ LINES
const streamText = async (element, text) => {
    return new Promise((resolve) => {
        // For massive responses, use chunking
        const chunkSize = 500; // characters per chunk
        let currentIndex = 0;
        
        const streamChunk = () => {
            if (currentIndex >= text.length) {
                resolve();
                return;
            }
            
            const chunk = text.slice(currentIndex, currentIndex + chunkSize);
            element.textContent += chunk;
            currentIndex += chunkSize;
            
            // Smart scrolling - only if user is at bottom
            const container = chatContainer;
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
            
            if (isNearBottom) {
                container.scrollTop = container.scrollHeight;
            }
            
            // Use requestAnimationFrame for smooth performance
            requestAnimationFrame(streamChunk);
        };
        
        streamChunk();
    });
};

            const createChart = (canvasId, type, data) => {
                const ctx = document.getElementById(canvasId);
                if (!ctx) return;
                
                const chartConfig = {
                    type: type,
                    data: {
                        labels: data.labels || [],
                        datasets: [{
                            label: data.label || 'Data',
                            data: data.data || [],
                            backgroundColor: data.backgroundColor || [
                                'rgba(102, 126, 234, 0.7)',
                                'rgba(118, 75, 162, 0.7)',
                                'rgba(16, 185, 129, 0.7)',
                                'rgba(245, 158, 11, 0.7)',
                                'rgba(239, 68, 68, 0.7)',
                                'rgba(139, 92, 246, 0.7)'
                            ],
                            borderColor: data.borderColor || 'rgba(102, 126, 234, 1)',
                            borderWidth: 2,
                            fill: type === 'line' ? false : true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                display: type === 'pie',
                                position: 'bottom'
                            },
                            title: {
                                display: false
                            }
                        },
                        scales: type !== 'pie' ? {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                }
                            }
                        } : {}
                    }
                };
                
                new Chart(ctx, chartConfig);
            };

            const processCanvasRequest = (text, container) => {
                const canvasRegex = /CANVAS:\s*(\w+)\s*\[([\s\S]*?)\]/g;
                let match;
                
                while ((match = canvasRegex.exec(text)) !== null) {
                    const chartType = match[1].toLowerCase();
                    let data;
                    
                    try {
                        data = JSON.parse(match[2]);
                    } catch (e) {
                        console.warn('Failed to parse canvas data:', e);
                        continue;
                    }
                    
                    const canvasDiv = document.createElement('div');
                    canvasDiv.className = 'canvas-visualization';
                    
                    const canvas = document.createElement('canvas');
                    canvas.id = `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    
                    const title = document.createElement('h3');
                    title.className = 'text-xl font-bold text-gray-800 mb-4';
                    title.innerHTML = `<i class="fas fa-chart-${chartType === 'pie' ? 'pie' : chartType === 'bar' ? 'bar' : 'line'} mr-2 text-purple-600"></i>${data.title || 'Visualization'}`;
                    
                    canvasDiv.appendChild(title);
                    canvasDiv.appendChild(canvas);
                    container.appendChild(canvasDiv);
                    
                    setTimeout(() => {
                        createChart(canvas.id, chartType, data);
                    }, 100);
                }
            };

            const renderFlashcardTool = (cards) => {
                studyData.flashcards = cards; 
                const toolName = 'Flashcard Generator';

                const backButtonHTML = `
                    <button id="backToChatBtn" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all mb-6">
                        <i class="fas fa-arrow-left mr-2"></i>Back to Chat
                    </button>
                `;
                
                const flashcardViewerHTML = `
                    <div class="flashcard-viewer flex flex-col items-center max-w-xl mx-auto">
                        <div class="flex items-center justify-center gap-6 w-full mb-6">
                            <button id="prevCardBtn" class="flashcard-nav-btn" style="width: 56px; height: 56px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.2s;">
                                <i class="fas fa-chevron-left text-xl"></i>
                            </button>
                            
                            <div class="flashcard-flip-container" style="width: 100%; height: 350px; perspective: 1000px; position: relative;">
                                <div class="flashcard flip-card" style="width: 100%; height: 100%; position: relative; cursor: pointer;">
                                    <div class="flashcard-inner" style="width: 100%; height: 100%; transition: transform 0.6s; transform-style: preserve-3d; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
                                        <div class="flashcard-front" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); color: white; border-radius: 1.5rem; display: flex; align-items: center; justify-content: center; padding: 2.5rem; text-align: center; font-size: 1.5rem; font-weight: 700;">
                                            <div>
                                                <div class="text-sm mb-3 opacity-80 current-card-count">Card 1 of ${cards.length}</div>
                                                <div class="card-front-content"></div>
                                            </div>
                                        </div>
                                        <div class="flashcard-back" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; background: white; border: 4px solid #667eea; color: #1f2937; border-radius: 1.5rem; display: flex; align-items: center; justify-content: center; padding: 2.5rem; text-align: center; font-size: 1.3rem; font-weight: 600; transform: rotateY(180deg);">
                                            <div>
                                                <div class="text-sm mb-3 text-purple-600 font-bold">DEFINITION/ANSWER</div>
                                                <div class="card-back-content"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button id="nextCardBtn" class="flashcard-nav-btn" style="width: 56px; height: 56px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.2s;">
                                <i class="fas fa-chevron-right text-xl"></i>
                            </button>
                        </div>
                        
                        <div id="cardDots" class="flex justify-center gap-2 mt-4">
                            ${cards.map((_, i) => `<div class="flashcard-dot ${i === 0 ? 'active' : ''}" data-index="${i}" style="width: 12px; height: 12px; border-radius: 50%; background: ${i === 0 ? '#667eea' : '#ccc'}; cursor: pointer; transition: all 0.3s; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"></div>`).join('')}
                        </div>
                    </div>
                `;
                
                const mainContentHTML = `
                    <div class="max-w-5xl mx-auto">
                        ${backButtonHTML}
                        <h2 class="text-3xl font-extrabold text-gray-800 mb-2">${toolName}</h2>
                        <p class="text-lg text-gray-600 mb-8">Click the card to flip, or use the arrows to navigate through ${cards.length} concepts.</p>
                        ${flashcardViewerHTML}
                    </div>
                `;
                
                showToolView(toolName, mainContentHTML);
                
                let currentIndex = 0;
                const flashcardDiv = mainToolView.querySelector('.flip-card');
                const prevBtn = mainToolView.querySelector('#prevCardBtn');
                const nextBtn = mainToolView.querySelector('#nextCardBtn');
                const backBtn = mainToolView.querySelector('#backToChatBtn');
                const dotsContainer = mainToolView.querySelector('#cardDots');
                const dots = dotsContainer.querySelectorAll('.flashcard-dot');

                const updateFlashcard = (index) => {
                    currentIndex = index;
                    const card = cards[currentIndex];
                    flashcardDiv.classList.remove('flipped'); 
                    
                    mainToolView.querySelector('.card-front-content').innerHTML = marked.parse(card.front);
                    mainToolView.querySelector('.card-back-content').innerHTML = marked.parse(card.back);
                    
                    mainToolView.querySelector('.current-card-count').textContent = `Card ${currentIndex + 1} of ${cards.length}`;
                    
                    dots.forEach((dot, i) => {
                        dot.style.background = i === currentIndex ? '#667eea' : '#ccc';
                    });
                };
                
                updateFlashcard(0);

                prevBtn.addEventListener('click', () => {
                    let newIndex = currentIndex - 1;
                    if (newIndex < 0) newIndex = cards.length - 1;
                    updateFlashcard(newIndex);
                });
                
                nextBtn.addEventListener('click', () => {
                    let newIndex = (currentIndex + 1) % cards.length;
                    updateFlashcard(newIndex);
                });
                
                flashcardDiv.addEventListener('click', () => {
                    flashcardDiv.classList.toggle('flipped');
                });
                
                dots.forEach(dot => {
                    dot.addEventListener('click', () => {
                        updateFlashcard(parseInt(dot.dataset.index));
                    });
                });

                backBtn.addEventListener('click', showChatView);
            };

            const renderMindMapTool = (mindmapData) => {
                studyData.mindmaps = mindmapData;
                const toolName = 'Interactive Mind Map';

                const backButtonHTML = `
                    <button id="backToChatBtn" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all mb-6">
                        <i class="fas fa-arrow-left mr-2"></i>Back to Chat
                    </button>
                `;

                const mindmapHTML = `
                    <div class="max-w-7xl mx-auto">
                        ${backButtonHTML}
                        <h2 class="text-3xl font-extrabold text-gray-800 mb-2">${toolName}</h2>
                        <p class="text-lg text-gray-600 mb-4">Drag nodes • Double-click to edit • Right-click for options • Scroll to zoom</p>
                        
                        <div class="canvas-container relative">
                            <div class="mindmap-controls">
                                <button class="mindmap-control-btn" id="fullscreenBtn" title="Fullscreen">
                                    <i class="fas fa-expand"></i>
                                </button>
                                <button class="mindmap-control-btn" id="downloadPngBtn" title="Download as PNG">
                                    <i class="fas fa-image"></i>
                                </button>
                                <button class="mindmap-control-btn" id="downloadJsonBtn" title="Download as JSON">
                                    <i class="fas fa-file-code"></i>
                                </button>
                                <button class="mindmap-control-btn" id="centerMapBtn" title="Center Map">
                                    <i class="fas fa-compress-arrows-alt"></i>
                                </button>
                                <button class="mindmap-control-btn" id="resetMapBtn" title="Reset Layout">
                                    <i class="fas fa-redo"></i>
                                </button>
                            </div>
                            <div class="mindmap-canvas" id="mindmapCanvas">
                                <div class="mindmap-zoom-controls">
                                    <button class="zoom-btn" id="zoomInBtn">+</button>
                                    <button class="zoom-btn" id="zoomOutBtn">−</button>
                                    <button class="zoom-btn" id="zoomResetBtn" style="font-size: 0.9rem;">100%</button>
                                </div>
                            </div>
                            
                            <div class="mindmap-edit-panel" id="editPanel">
                                <h4 class="font-bold text-gray-800 mb-2">Edit Node</h4>
                                <input type="text" id="nodeTextInput" placeholder="Enter node text">
                                <div class="mindmap-color-picker">
                                    <div class="color-option" data-color="#667eea" style="background: #667eea;"></div>
                                    <div class="color-option" data-color="#10b981" style="background: #10b981;"></div>
                                    <div class="color-option" data-color="#f59e0b" style="background: #f59e0b;"></div>
                                    <div class="color-option" data-color="#ef4444" style="background: #ef4444;"></div>
                                    <div class="color-option" data-color="#8b5cf6" style="background: #8b5cf6;"></div>
                                    <div class="color-option" data-color="#ec4899" style="background: #ec4899;"></div>
                                </div>
                                <div class="mindmap-edit-actions">
                                    <button id="cancelEditBtn" class="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                                    <button id="saveEditBtn" class="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                showToolView(toolName, mindmapHTML);

                const canvas = document.getElementById('mindmapCanvas');
                const backBtn = document.getElementById('backToChatBtn');
                const fullscreenBtn = document.getElementById('fullscreenBtn');
                const downloadPngBtn = document.getElementById('downloadPngBtn');
                const downloadJsonBtn = document.getElementById('downloadJsonBtn');
                const centerBtn = document.getElementById('centerMapBtn');
                const resetBtn = document.getElementById('resetMapBtn');
                const editPanel = document.getElementById('editPanel');
                const nodeTextInput = document.getElementById('nodeTextInput');
                const saveEditBtn = document.getElementById('saveEditBtn');
                const cancelEditBtn = document.getElementById('cancelEditBtn');
                const zoomInBtn = document.getElementById('zoomInBtn');
                const zoomOutBtn = document.getElementById('zoomOutBtn');
                const zoomResetBtn = document.getElementById('zoomResetBtn');

                let nodes = [];
                let connections = [];
                let draggedNode = null;
                let offset = { x: 0, y: 0 };
                let selectedNode = null;
                let zoomLevel = 1;
                let panOffset = { x: 0, y: 0 };
                let isPanning = false;
                let panStart = { x: 0, y: 0 };

                const createMindMap = () => {
                    canvas.querySelectorAll('.mindmap-node, .mindmap-connection').forEach(el => el.remove());
                    nodes = [];
                    connections = [];

                    const centerX = canvas.offsetWidth / 2;
                    const centerY = canvas.offsetHeight / 2;

                    const centralNode = createNode(mindmapData.central, centerX, centerY, 'central');
                    nodes.push(centralNode);

                    const branches = mindmapData.branches || [];
                    const angleStep = (2 * Math.PI) / branches.length;
                    
                    branches.forEach((branch, i) => {
                        const angle = i * angleStep - Math.PI / 2;
                        const radius = 200;
                        const x = centerX + Math.cos(angle) * radius;
                        const y = centerY + Math.sin(angle) * radius;

                        const branchNode = createNode(branch.title, x, y, 'level-1', branch.color);
                        nodes.push(branchNode);
                        createConnection(centralNode, branchNode);

                        if (branch.children && branch.children.length > 0) {
                            branch.children.forEach((child, j) => {
                                const childAngle = angle + (j - (branch.children.length - 1) / 2) * 0.3;
                                const childRadius = 140;
                                const childX = x + Math.cos(childAngle) * childRadius;
                                const childY = y + Math.sin(childAngle) * childRadius;

                                const childNode = createNode(child, childX, childY, 'level-2');
                                nodes.push(childNode);
                                createConnection(branchNode, childNode);
                            });
                        }
                    });

                    applyZoom();
                };

                const createNode = (text, x, y, level, borderColor) => {
                    const node = document.createElement('div');
                    node.className = `mindmap-node ${level}`;
                    node.textContent = text;
                    node.style.left = `${x}px`;
                    node.style.top = `${y}px`;
                    node.style.transform = 'translate(-50%, -50%)';
                    
                    if (borderColor && level === 'level-1') {
                        node.style.borderColor = borderColor;
                        node.style.color = borderColor;
                    }

                    node.dataset.x = x;
                    node.dataset.y = y;
                    node.dataset.color = borderColor || '';

                    const deleteBtn = document.createElement('div');
                    deleteBtn.className = 'node-delete-btn';
                    deleteBtn.innerHTML = '×';
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (level !== 'central') {
                            deleteNode(node);
                        }
                    });
                    node.appendChild(deleteBtn);

                    node.addEventListener('mousedown', (e) => {
                        if (e.button === 0 && !e.target.classList.contains('node-delete-btn')) {
                            draggedNode = node;
                            const rect = canvas.getBoundingClientRect();
                            offset.x = e.clientX - rect.left - parseFloat(node.dataset.x) * zoomLevel;
                            offset.y = e.clientY - rect.top - parseFloat(node.dataset.y) * zoomLevel;
                            node.style.zIndex = '100';
                        }
                    });

                    node.addEventListener('dblclick', (e) => {
                        e.stopPropagation();
                        openEditPanel(node);
                    });

                    node.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        openEditPanel(node);
                    });

                    canvas.appendChild(node);
                    return node;
                };

                const deleteNode = (node) => {
                    connections = connections.filter(conn => {
                        if (conn.from === node || conn.to === node) {
                            conn.element.remove();
                            return false;
                        }
                        return true;
                    });

                    node.remove();
                    nodes = nodes.filter(n => n !== node);
                    
                    if (selectedNode === node) {
                        selectedNode = null;
                        editPanel.classList.remove('active');
                    }
                };

                const openEditPanel = (node) => {
                    selectedNode = node;
                    nodeTextInput.value = node.textContent.replace('×', '').trim();
                    editPanel.classList.add('active');
                    nodeTextInput.focus();
                    
                    nodes.forEach(n => n.classList.remove('selected'));
                    node.classList.add('selected');

                    document.querySelectorAll('.color-option').forEach(opt => {
                        opt.classList.remove('selected');
                        if (opt.dataset.color === node.dataset.color) {
                            opt.classList.add('selected');
                        }
                    });
                };

                const closeEditPanel = () => {
                    editPanel.classList.remove('active');
                    if (selectedNode) {
                        selectedNode.classList.remove('selected');
                        selectedNode = null;
                    }
                };

                saveEditBtn.addEventListener('click', () => {
                    if (selectedNode && nodeTextInput.value.trim()) {
                        const deleteBtn = selectedNode.querySelector('.node-delete-btn');
                        selectedNode.textContent = nodeTextInput.value.trim();
                        if (deleteBtn) selectedNode.appendChild(deleteBtn);
                        
                        const selectedColor = document.querySelector('.color-option.selected');
                        if (selectedColor && !selectedNode.classList.contains('central')) {
                            const color = selectedColor.dataset.color;
                            selectedNode.style.borderColor = color;
                            selectedNode.style.color = color;
                            selectedNode.dataset.color = color;
                        }
                        
                        closeEditPanel();
                    }
                });

                cancelEditBtn.addEventListener('click', closeEditPanel);

                document.querySelectorAll('.color-option').forEach(opt => {
                    opt.addEventListener('click', () => {
                        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                        opt.classList.add('selected');
                    });
                });

                const createConnection = (fromNode, toNode) => {
                    const connection = document.createElement('div');
                    connection.className = 'mindmap-connection';
                    canvas.insertBefore(connection, canvas.firstChild);
                    connections.push({ element: connection, from: fromNode, to: toNode });
                    updateConnection(connection, fromNode, toNode);
                };

                const updateConnection = (connection, fromNode, toNode) => {
                    const fromX = parseFloat(fromNode.dataset.x);
                    const fromY = parseFloat(fromNode.dataset.y);
                    const toX = parseFloat(toNode.dataset.x);
                    const toY = parseFloat(toNode.dataset.y);

                    const length = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
                    const angle = Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI);

                    connection.style.width = `${length}px`;
                    connection.style.left = `${fromX}px`;
                    connection.style.top = `${fromY}px`;
                    connection.style.transform = `rotate(${angle}deg)`;
                };

                const applyZoom = () => {
                    nodes.forEach(node => {
                        const x = parseFloat(node.dataset.x) * zoomLevel + panOffset.x;
                        const y = parseFloat(node.dataset.y) * zoomLevel + panOffset.y;
                        node.style.left = `${x}px`;
                        node.style.top = `${y}px`;
                    });
                    
                    connections.forEach(conn => {
                        updateConnection(conn.element, conn.from, conn.to);
                    });
                };

                document.addEventListener('mousemove', (e) => {
                    if (draggedNode) {
                        const rect = canvas.getBoundingClientRect();
                        const x = (e.clientX - rect.left - offset.x) / zoomLevel;
                        const y = (e.clientY - rect.top - offset.y) / zoomLevel;

                        draggedNode.style.left = `${x}px`;
                        draggedNode.style.top = `${y}px`;
                        draggedNode.dataset.x = x;
                        draggedNode.dataset.y = y;

                        connections.forEach(conn => {
                            if (conn.from === draggedNode || conn.to === draggedNode) {
                                updateConnection(conn.element, conn.from, conn.to);
                            }
                        });
                    }
                });

                document.addEventListener('mouseup', () => {
                    if (draggedNode) {
                        draggedNode.style.zIndex = '';
                        draggedNode = null;
                    }
                });

                zoomInBtn.addEventListener('click', () => {
                    zoomLevel = Math.min(zoomLevel + 0.1, 2);
                    canvas.style.transform = `scale(${zoomLevel})`;
                    zoomResetBtn.textContent = `${Math.round(zoomLevel * 100)}%`;
                });

                zoomOutBtn.addEventListener('click', () => {
                    zoomLevel = Math.max(zoomLevel - 0.1, 0.5);
                    canvas.style.transform = `scale(${zoomLevel})`;
                    zoomResetBtn.textContent = `${Math.round(zoomLevel * 100)}%`;
                });

                zoomResetBtn.addEventListener('click', () => {
                    zoomLevel = 1;
                    canvas.style.transform = `scale(1)`;
                    zoomResetBtn.textContent = '100%';
                });

                let isFullscreen = false;

                fullscreenBtn.addEventListener('click', () => {
                    const mainContainer = document.querySelector('.max-w-7xl');
                    const canvasContainer = canvas.parentElement;
                    
                    if (!isFullscreen) {
                        isFullscreen = true;
                        
                        const fullscreenOverlay = document.createElement('div');
                        fullscreenOverlay.id = 'mindmapFullscreenOverlay';
                        fullscreenOverlay.className = 'mindmap-fullscreen';
                        fullscreenOverlay.style.zIndex = '9999';
                        
                        const header = document.createElement('div');
                        header.className = 'mindmap-fullscreen-header';
                        header.innerHTML = `
                            <h3><i class="fas fa-project-diagram mr-2"></i>${mindmapData.central}</h3>
                            <div class="mindmap-fullscreen-controls">
                                <button class="mindmap-control-btn" id="fsDownloadPng" title="Download PNG" style="background: white;">
                                    <i class="fas fa-image"></i>
                                </button>
                                <button class="mindmap-control-btn" id="fsDownloadJson" title="Download JSON" style="background: white;">
                                    <i class="fas fa-file-code"></i>
                                </button>
                                <button class="mindmap-control-btn" id="fsExitBtn" title="Exit Fullscreen" style="background: white;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `;
                        
                        const clonedContainer = canvasContainer.cloneNode(true);
                        clonedContainer.style.height = 'calc(100vh - 80px)';
                        clonedContainer.style.margin = '0';
                        
                        fullscreenOverlay.appendChild(header);
                        fullscreenOverlay.appendChild(clonedContainer);
                        document.body.appendChild(fullscreenOverlay);
                        
                        const exitFullscreen = () => {
                            document.getElementById('mindmapFullscreenOverlay')?.remove();
                            isFullscreen = false;
                            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
                        };
                        
                        document.getElementById('fsExitBtn').addEventListener('click', exitFullscreen);
                        document.addEventListener('keydown', (e) => {
                            if (e.key === 'Escape' && isFullscreen) {
                                exitFullscreen();
                            }
                        });
                        
                        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
                    } else {
                        document.getElementById('mindmapFullscreenOverlay')?.remove();
                        isFullscreen = false;
                        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
                    }
                });

                downloadPngBtn.addEventListener('click', async () => {
                    try {
                        const html2canvas = await loadHtml2Canvas();
                        const originalTransform = canvas.style.transform;
                        canvas.style.transform = 'scale(1)';
                        
                        html2canvas(canvas, {
                            backgroundColor: '#f8f9fa',
                            scale: 2
                        }).then(canvasElement => {
                            canvas.style.transform = originalTransform;
                            const link = document.createElement('a');
                            link.download = `mindmap_${Date.now()}.png`;
                            link.href = canvasElement.toDataURL();
                            link.click();
                        });
                    } catch (error) {
                        alert('Please wait a moment and try again. Loading export library...');
                    }
                });

                const loadHtml2Canvas = () => {
                    return new Promise((resolve, reject) => {
                        if (window.html2canvas) {
                            resolve(window.html2canvas);
                        } else {
                            const script = document.createElement('script');
                            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                            script.onload = () => resolve(window.html2canvas);
                            script.onerror = reject;
                            document.head.appendChild(script);
                        }
                    });
                };

                downloadJsonBtn.addEventListener('click', () => {
                    const data = {
                        central: nodes.find(n => n.classList.contains('central'))?.textContent.replace('×', '').trim(),
                        branches: []
                    };

                    nodes.forEach(node => {
                        if (node.classList.contains('level-1')) {
                            const branch = {
                                title: node.textContent.replace('×', '').trim(),
                                color: node.dataset.color || '#667eea',
                                children: []
                            };

                            connections.forEach(conn => {
                                if (conn.from === node) {
                                    const child = conn.to;
                                    if (child.classList.contains('level-2')) {
                                        branch.children.push(child.textContent.replace('×', '').trim());
                                    }
                                }
                            });

                            data.branches.push(branch);
                        }
                    });

                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `mindmap_${Date.now()}.json`;
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);
                });

                centerBtn.addEventListener('click', createMindMap);
                resetBtn.addEventListener('click', createMindMap);
                backBtn.addEventListener('click', showChatView);

                canvas.addEventListener('click', (e) => {
                    if (e.target === canvas) {
                        closeEditPanel();
                    }
                });

                createMindMap();
            };

            // Detect if response was truncated
            const detectTruncation = (response, isStreaming = false) => {
                if (response.length < 1000) return false;
                
                const cleanResponse = response.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
                if (cleanResponse.length < 500) return false;
                
                const lastChars = cleanResponse.slice(-300);
                const last100 = cleanResponse.slice(-100);
                
                const codeBlockCount = (cleanResponse.match(/```/g) || []).length;
                if (codeBlockCount % 2 !== 0) {
                    console.log('Truncation detected: Unclosed code block');
                    return true;
                }
                
                if (/```\w*\n[\s\S]{20,}$/.test(lastChars) && !lastChars.includes('```', lastChars.lastIndexOf('```') + 3)) {
                    console.log('Truncation detected: Code block content incomplete');
                    return true;
                }
                
                const openBraces = (cleanResponse.match(/\{/g) || []).length;
                const closeBraces = (cleanResponse.match(/\}/g) || []).length;
                const openBrackets = (cleanResponse.match(/\[/g) || []).length;
                const closeBrackets = (cleanResponse.match(/\]/g) || []).length;
                
                if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
                    if (Math.abs(openBraces - closeBraces) > 2 || Math.abs(openBrackets - closeBrackets) > 2) {
                        console.log('Truncation detected: Unbalanced braces/brackets');
                        return true;
                    }
                }
                
                if (/function\s+\w+\s*\([^)]*$/.test(last100) || 
                    /const\s+\w+\s*=\s*\([^)]*$/.test(last100) ||
                    /\(\s*\)\s*=>\s*$/.test(last100)) {
                    console.log('Truncation detected: Incomplete function definition');
                    return true;
                }
                
                const unclosedBold = (lastChars.match(/\*\*/g) || []).length % 2 !== 0;
                const unclosedItalic = (lastChars.match(/(?<!\*)\*(?!\*)/g) || []).length % 2 !== 0;
                const unclosedUnderline = (lastChars.match(/__/g) || []).length % 2 !== 0;
                
                if (unclosedBold || unclosedItalic || unclosedUnderline) {
                    console.log('Truncation detected: Unclosed markdown formatting');
                    return true;
                }
                
                if (/#{1,6}\s+\w{1,10}\s*$/.test(last100)) {
                    console.log('Truncation detected: Incomplete header');
                    return true;
                }
                
                const endsWithWord = /\b\w+\s*$/.test(last100);
                const hasValidEnding = /[.!?;}\])\"`']\s*$/.test(last100) || 
                                      /\n\n$/.test(cleanResponse) ||
                                      /```\s*$/.test(last100) ||
                                      /<\/\w+>\s*$/.test(last100);
                
                if (endsWithWord && !hasValidEnding && cleanResponse.length > 5000) {
                    const lastLine = lastChars.split('\n').pop() || '';
                    const looksLikeCutoff = lastLine.length > 10 && lastLine.length < 80 && !lastLine.match(/^[-*]\s/);
                    
                    if (looksLikeCutoff) {
                        console.log('Truncation detected: Mid-sentence cutoff');
                        return true;
                    }
                }
                
                const openComments = (cleanResponse.match(/\/\*/g) || []).length;
                const closeComments = (cleanResponse.match(/\*\//g) || []).length;
                
                if (openComments !== closeComments) {
                    console.log('Truncation detected: Unclosed multiline comment');
                    return true;
                }
                
                if (cleanResponse.length > 10000) {
                    const last500 = cleanResponse.slice(-500);
                    
                    const hasProperEnding = /(\n\n##|\n\n###|<\/thinking>|```\s*\n\n|Final|Conclusion|Summary|\n\n---\n|## Next Steps|## Deployment|## Documentation)/i.test(last500);
                    const hasIncompleteIndicators = /(in progress|to be continued|more to come|will add|TODO|FIXME|coming soon)/i.test(last500);
                    const endsWithFilePrefix = /###?\s+File:\s+[\w/.]+\s*$/.test(last500);
                    
                    if (hasIncompleteIndicators || endsWithFilePrefix) {
                        console.log('Truncation detected: Incomplete indicators in long response');
                        return true;
                    }
                    
                    const isCodeGen = cleanResponse.includes('```') && cleanResponse.includes('File:');
                    if (isCodeGen && !hasProperEnding && !last500.includes('Next Steps')) {
                        console.log('Truncation detected: Code generation without proper ending');
                        return true;
                    }
                }
                
                const last10Lines = cleanResponse.split('\n').slice(-10).join('\n');
                const tableRows = (last10Lines.match(/\|/g) || []).length;
                
                if (tableRows > 3) {
                    const lines = last10Lines.split('\n').filter(line => line.includes('|'));
                    if (lines.length > 0) {
                        const lastTableLine = lines[lines.length - 1];
                        const pipeCount = (lastTableLine.match(/\|/g) || []).length;
                        
                        const inconsistentTable = lines.slice(-3).some(line => {
                            const count = (line.match(/\|/g) || []).length;
                            return Math.abs(count - pipeCount) > 1;
                        });
                        
                        if (inconsistentTable && !last100.includes('\n\n')) {
                            console.log('Truncation detected: Incomplete table structure');
                            return true;
                        }
                    }
                }
                
                return false;
            };

            const showContinueBanner = () => {
                const banner = document.getElementById('continueBanner');
                banner.classList.add('show');
                lastGenerationTruncated = true;
            };

            const hideContinueBanner = () => {
                const banner = document.getElementById('continueBanner');
                banner.classList.remove('show');
                lastGenerationTruncated = false;
            };

            const saveGenerationContext = (prompt, response, tool) => {
                lastGenerationContext = {
                    prompt: prompt,
                    response: response,
                    tool: tool,
                    timestamp: Date.now()
                };
                localStorage.setItem('lastGenerationContext', JSON.stringify(lastGenerationContext));
            };

            const loadGenerationContext = () => {
                const saved = localStorage.getItem('lastGenerationContext');
                if (saved) {
                    try {
                        lastGenerationContext = JSON.parse(saved);
                    } catch (e) {
                        console.warn('Failed to load generation context');
                    }
                }
            };

            const isContinueRequest = (prompt) => {
                const continueKeywords = [
                    'continue', 'keep going', 'go on', 'resume', 'finish',
                    'complete', 'more', 'rest of', 'carry on', 'proceed',
                    'continue from where you left', 'continue generation',
                    'keep generating', 'finish the code'
                ];
                
                const lowerPrompt = prompt.toLowerCase().trim();
                return continueKeywords.some(keyword => lowerPrompt.includes(keyword));
            };



    const generateResponse = async (prompt) => {
    console.log('🟢 generateResponse called with prompt:', prompt.substring(0, 50));
    
    // CRITICAL VALIDATION
    if (!responseHistory) {
        console.error('❌ FATAL: responseHistory is NULL in generateResponse!');
        alert('ERROR: Chat system not initialized. Please refresh the page.');
        return;
    }
    
    if (!generateButton || !promptInput) {
        console.error('❌ FATAL: Critical UI elements missing!');
        alert('ERROR: UI not initialized. Please refresh the page.');
        return;
    }
    
    if (isGenerating || !activeChatId) {
        console.log('⚠️ Already generating or no active chat');
        return;
    }
    
    if (!activeChatId || !chats[activeChatId]) {
        console.error('❌ CRITICAL: No active chat!');
        alert('Error: No active chat. Creating new chat...');
        createNewChat();
        return;
    }
    
    console.log('✅ All validations passed, proceeding with generation...');
    
    isGenerating = true;
    
    // Change button to "Stop"
    generateButton.classList.remove('from-purple-600', 'to-blue-600', 'hover:from-purple-700', 'hover:to-blue-700');
    generateButton.classList.add('from-red-500', 'to-pink-500', 'hover:from-red-600', 'hover:to-pink-600');
    generateButtonIcon.classList.remove('fa-paper-plane');
    generateButtonIcon.classList.add('fa-stop');
    generateButton.disabled = false;
    promptInput.disabled = true;
    
    generationController = new AbortController();
    
    // Estimate code size
    const codeEstimate = estimateCodeSize(prompt);
    
    // Show estimation banner
   const estimateBanner = document.createElement('div');
estimateBanner.className = 'flex';
// Ensure the main banner container is flex, but its *children* will be hidden by the new styling
estimateBanner.style.cssText = "display: flex !important; margin-bottom: 20px;"; 
estimateBanner.innerHTML = `
      <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold mr-4 flex-shrink-0 shadow-lg hidden-via-css">
    <i class="fas fa-calculator"></i>
</div>

        <div hidden class="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 p-4 rounded-2xl shadow-lg flex-1 **hidden-via-css**">
  <div class="flex items-center gap-3">
    <i class="fas fa-brain text-blue-600"></i>
    <span class="font-bold text-gray-800">Analyzing project scope...</span>
  </div>
</div>

           <div hidden class="text-sm text-gray-600 mt-2 **hidden-via-css**">
    Estimated: <strong>${codeEstimate.scope}</strong> project • 
    ~${codeEstimate.maxFiles} files • 
    ~${codeEstimate.maxLines} lines
</div>
    `;

// --- IMPORTANT: Add this CSS to your stylesheet (e.g., style.css or your main CSS file) ---
// If you are using Tailwind CSS, you might already have a 'hidden' utility class that sets display: none.
// If not, explicitly add this:
/*
.hidden-via-css {
    display: none !important;
}
*/

    responseHistory.appendChild(estimateBanner);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Remove banner after 3 seconds
    setTimeout(() => estimateBanner.remove(), 3000);
    
    let userMessage = prompt;
    let messageContent = [];
    
    if (attachedFileType === 'image') {
        messageContent = [
            { text: prompt },
            {
                inline_data: {
                    mime_type: attachedFileMimeType,
                    data: attachedFileContent.split(',')[1]
                }
            }
        ];
    } else if (attachedFileContent) {
        userMessage = `File "${attachedFileName}" content:\n\n${attachedFileContent}\n\nUser request: ${prompt}`;
        messageContent = [{ text: userMessage }];
    } else {
        messageContent = [{ text: userMessage }];
    }
    
    const currentChat = chats[activeChatId];
    
    if (currentChat.history.length === 0 && currentChat.title === 'New Chat') {
        currentChat.title = prompt.substring(0, 30) + (prompt.length > 30 ? '...' : '');
        renderChatList();
    }
    
    currentChat.history.push({ role: "user", parts: messageContent });
    
    MemorySystem.extractPersonalInfo(prompt);
    saveChats();
    
    showChatView();
    createUserMessage(prompt, attachedFileName, attachedFileType, attachedFileType === 'image' ? attachedFileContent : null);
    
    const streamingElement = createStreamingAIMessage();
    let fullResponse = '';
    let displayResponse = '';
    let isInThinking = false;
    let thinkingContent = '';
    
    let systemPromptText = systemInstructions[currentTool] || systemInstructions['chat'];
    if (currentTool === 'flashcards') {
        const count = document.getElementById('flashcard-count')?.value || 8;
        systemPromptText = systemPromptText.replace('{{count}}', count);
    }
    
    // Add memory context
    systemPromptText += MemorySystem.getContext();
    
    // Add deep think instructions
    systemPromptText += DeepThinkMode.getSystemPromptAddition();
    
    const payload = {
        contents: currentChat.history,
        systemInstruction: { 
            parts: [{ 
                text: systemPromptText + `\n\n**GENERATION LIMIT**: Max ${codeEstimate.maxFiles} files, ~${codeEstimate.maxLines} lines for this ${codeEstimate.scope} project. Stay within this budget.`
            }] 
        },
        generationConfig: {
            temperature: currentTool === 'chat' ? 0.7 : 0.3,
            maxOutputTokens: Math.min(8000, codeEstimate.maxLines * 2),
            topP: 0.95,
            topK: 40,
            candidateCount: 1,
            stopSequences: []
        }
    };
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: generationController.signal
        });
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            fullResponse += text;
                            
                            if (text.includes('<thinking>')) {
                                isInThinking = true;
                            }
                            
                            if (isInThinking) {
                                thinkingContent += text;
                                if (text.includes('</thinking>')) {
                                    isInThinking = false;
                                }
                            } else {
                                if (!text.includes('<thinking>') && !text.includes('</thinking>')) {
                                    displayResponse += text;
                                    await streamText(streamingElement, displayResponse);
                                }
                            }
                        }
                    } catch (e) { /* Ignore parsing errors */ }
                }
            }
        }
        
        const cleanResponse = fullResponse.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
        
        currentChat.history.push({ role: "model", parts: [{ text: cleanResponse }] });
        saveChats();
        finalizeMessage(streamingElement, fullResponse);
        
        await MassiveCodeHandler.handleLargeGeneration(fullResponse, prompt);
        
        if (currentTool === 'flashcards') {
            try {
                const jsonMatch = fullResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
                if (jsonMatch) {
                    const cards = JSON.parse(jsonMatch[0]);
                    if (cards.length > 0) {
                        renderFlashcardTool(cards);
                    }
                }
            } catch (e) {
                console.warn('Failed to parse flashcards JSON:', e);
            }
        }
        
        if (currentTool === 'mindmap') {
            try {
                const jsonMatch = fullResponse.match(/\{[\s\S]*"central"[\s\S]*"branches"[\s\S]*\}/);
                if (jsonMatch) {
                    const mindmapData = JSON.parse(jsonMatch[0]);
                    if (mindmapData.central && mindmapData.branches) {
                        renderMindMapTool(mindmapData);
                    }
                }
            } catch (e) {
                console.warn('Failed to parse mindmap JSON:', e);
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
        if (error.name === 'AbortError') {
            if (streamingElement && streamingElement.parentElement) {
                const stopMessage = document.createElement('div');
                stopMessage.className = "text-yellow-700 p-3 bg-yellow-50 rounded-lg text-sm font-medium mt-2";
                stopMessage.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>Generation stopped by user.';
                
                if(streamingElement.textContent.length > 0) {
                    streamingElement.parentElement.appendChild(stopMessage);
                } else {
                    streamingElement.parentElement.parentElement.innerHTML = `
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold mr-4 flex-shrink-0 shadow-lg">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <div class="bg-white p-6 rounded-2xl shadow-xl max-w-full border-2 border-purple-100 message-content">
                            <div class="text-yellow-700 text-sm font-medium">
                                <i class="fas fa-exclamation-triangle mr-2"></i>Generation stopped by user.
                            </div>
                        </div>
                    `;
                }
                currentChat.history.pop();
                saveChats();
            }
        } else {
            if (streamingElement && streamingElement.parentElement) {
                streamingElement.parentElement.innerHTML = `<div class="text-red-600 p-4 bg-red-50 rounded-lg"><strong>Error:</strong> Failed to get response from AI. ${error.message}</div>`;
            }
        }
    } finally {
        isGenerating = false;
        generationController = null;
        
        // Reset button to "Send"
        generateButton.classList.add('from-purple-600', 'to-blue-600', 'hover:from-purple-700', 'hover:to-blue-700');
        generateButton.classList.remove('from-red-500', 'to-pink-500', 'hover:from-red-600', 'hover:to-pink-600');
        generateButtonIcon.classList.add('fa-paper-plane');
        generateButtonIcon.classList.remove('fa-stop');
        
        promptInput.disabled = false;
        generateButton.disabled = promptInput.value.trim() === '' && !attachedFileContent;
        promptInput.focus();
        clearAttachedFile();
    }
};
    

            // --- Event Listeners and Utilities ---
            newChatBtn.addEventListener('click', createNewChat);

           generateButton.addEventListener('click', () => {
    // Check if currently generating - if so, stop it
    if (isGenerating) {
        if (generationController) {
            generationController.abort();
        }
        return;
    }
    
    // Otherwise, proceed with normal send logic
    const prompt = promptInput.value.trim();
    
    if (prompt && isContinueRequest(prompt) && 
        lastGenerationContext.response && 
        lastGenerationContext.timestamp &&
        (Date.now() - lastGenerationContext.timestamp) < 30 * 60 * 1000) {
        
        const continuePrompt = `Continue from exactly where you left off. Here's what you generated so far:\n\n${lastGenerationContext.response.slice(-3000)}\n\n...now continue generating the rest. Pick up seamlessly from where you stopped. Do not repeat what you already generated.`;
        
      
        
        generateResponse(continuePrompt);
        hideContinueBanner();
    } else if (!prompt && !attachedFileContent) {
        return;
    } else {
        generateResponse(prompt);
    }
    
    promptInput.value = '';
    window.autoExpand(promptInput);
});
            
            promptInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && !generateButton.disabled) {
                    e.preventDefault();
                    generateButton.click();
                }
            });

            const clearAttachedFile = () => {
                attachedFileContent = null;
                attachedFileName = null;
                attachedFileType = null;
                attachedFileMimeType = null;
                fileInput.value = '';
                fileStatus.classList.add('hidden');
                window.autoExpand(promptInput);
            };

            attachFileButton.addEventListener('click', () => fileInput.click());
            clearFileButton.addEventListener('click', clearAttachedFile);

            fileInput.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (!file) return;
                
                const fileType = file.type || '';
                const fileName = file.name.toLowerCase();
                const isImage = fileType.startsWith('image/') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');
                const isPdf = fileType === 'application/pdf' || fileName.endsWith('.pdf');
                
                let maxSize = 5 * 1024 * 1024;
                let sizeText = '5MB';
                
                if (isPdf) {
                    maxSize = 20 * 1024 * 1024;
                    sizeText = '20MB';
                } else if (isImage) {
                    maxSize = 10 * 1024 * 1024;
                    sizeText = '10MB';
                }
                
                if (file.size > maxSize) {
                    await showCustomModal('File Too Large', `Please select a file smaller than ${sizeText}.`, false);
                    fileInput.value = '';
                    return;
                }
                
                attachedFileName = file.name;
                fileStatus.classList.remove('hidden');
                
                try {
                    if (isPdf) {
                        fileNameDisplay.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Loading PDF...`;
                        attachedFileContent = await processPdfFile(file);
                        attachedFileType = 'pdf';
                        generateButton.disabled = false;
                    } else if (isImage) {
                        fileNameDisplay.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Loading image...`;
                        const base64Image = await processImageFile(file);
                        attachedFileContent = base64Image;
                        attachedFileType = 'image';
                        attachedFileMimeType = getImageMimeType(file.name);
                        
                        fileNameDisplay.innerHTML = `
                            <div class="flex items-center gap-2">
                                <i class="fas fa-image mr-2 text-blue-600"></i>
                                <span>${file.name}</span>
                                <img src="${base64Image}" alt="Preview" class="h-12 w-12 object-cover rounded border-2 border-purple-300 ml-2">
                            </div>
                        `;
                        generateButton.disabled = false;
                    } else {
                        fileNameDisplay.innerHTML = `<i class="fas fa-file-alt mr-2"></i>${file.name}`;
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            attachedFileContent = e.target.result;
                            attachedFileType = 'text';
                            window.autoExpand(promptInput);
                        };
                        reader.onerror = () => {
                            showCustomModal('Error', 'Failed to read file. Please try again.', false);
                            clearAttachedFile();
                        };
                        reader.readAsText(file);
                    }
                } catch (error) {
                    console.error('File processing error:', error);
                    await showCustomModal('Error', `Failed to process file. Please try again.`, false);
                    clearAttachedFile();
                }
            });

            const processPdfFile = async (file) => {
                return new Promise(async (resolve, reject) => {
                    try {
                        const arrayBuffer = await file.arrayBuffer();
                        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                        let fullText = '';
                        
                        for (let i = 1; i <= pdf.numPages; i++) {
                            fileNameDisplay.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Processing PDF... (${i}/${pdf.numPages} pages)`;
                            await new Promise(resolve => setTimeout(resolve, 0));
                            
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            const pageText = textContent.items.map(item => item.str).join(' ');
                            fullText += `\n--- Page ${i} ---\n${pageText}\n`;
                        }
                        
                        fileNameDisplay.innerHTML = `<i class="fas fa-file-pdf mr-2 text-red-600"></i>${file.name} (${pdf.numPages} pages)`;
                        resolve(fullText.trim());
                    } catch (error) {
                        console.error('PDF processing error:', error);
                        reject(error);
                    }
                });
            };

            const processImageFile = async (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const base64Image = e.target.result;
                        resolve(base64Image);
                    };
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(file);
                });
            };

            const getImageMimeType = (filename) => {
                const ext = filename.toLowerCase().split('.').pop();
                const mimeTypes = {
                    'png': 'image/png',
                    'jpg': 'image/jpeg',
                    'jpeg': 'image/jpeg'
                };
                return mimeTypes[ext] || 'image/jpeg';
            };

            clearChat.addEventListener('click', async () => {
                const result = await showCustomModal('Confirm Clear', 'Are you sure you want to clear the history for this chat?', true);
                if (result) {
                    chats[activeChatId].history = [];
                    chats[activeChatId].title = 'New Chat';
                    saveChats();
                    switchToChat(activeChatId);
                }
            });

            exportChat.addEventListener('click', () => {
                const content = chats[activeChatId].history.map(m => `${m.role.toUpperCase()}:\n${m.parts[0].text}`).join('\n\n---\n\n');
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${chats[activeChatId].title.replace(/\s/g, '_')}.txt`;
                a.click();
                URL.revokeObjectURL(url);
            });

            promptInput.addEventListener('input', () => window.autoExpand(promptInput));

            document.getElementById('continueGenerationBtn')?.addEventListener('click', () => {
                if (lastGenerationContext.response) {
                    const continuePrompt = `Continue from exactly where you left off. Here's the last part of what you generated:\n\n${lastGenerationContext.response.slice(-3000)}\n\n...now seamlessly continue generating the rest. Do NOT repeat anything you already wrote. Pick up from the exact point where you stopped.`;
                    
                    promptInput.value = continuePrompt;
                    generateButton.click();
                    hideContinueBanner();
                }
            });

            document.getElementById('dismissContinueBtn')?.addEventListener('click', () => {
                hideContinueBanner();
            });

            loadGenerationContext();
            loadChats();
            updateToolHeader('chat');
            // Initialize Memory System
MemorySystem.init();

// Setup Deep Think button
document.getElementById('deepThinkBtn')?.addEventListener('click', () => {
    DeepThinkMode.toggle();
});
        });

const memoryToggleBtn = document.getElementById('memoryToggleBtn');
const memorySidebar = document.getElementById('memorySidebar');
const closeMemoryBtn = document.getElementById('closeMemoryBtn');
const inputArea = document.querySelector('.input-area');

let isMemoryVisible = false;

const toggleMemoryPanel = () => {
    isMemoryVisible = !isMemoryVisible;
    memorySidebar.classList.toggle('visible', isMemoryVisible);
    memoryToggleBtn.classList.toggle('active', isMemoryVisible);
    inputArea.classList.toggle('memory-visible', isMemoryVisible);
    
    // Update button icon
    const icon = memoryToggleBtn.querySelector('i');
    icon.className = isMemoryVisible ? 'fas fa-times' : 'fas fa-brain';
};

// Toggle on button click
memoryToggleBtn.addEventListener('click', toggleMemoryPanel);
closeMemoryBtn.addEventListener('click', toggleMemoryPanel);

// Toggle on Tab key press
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Only toggle if not focused on input elements
        if (!['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            toggleMemoryPanel();
        }
    }
});



// ============================================
// PERMANENT MEMORY SYSTEM WITH LOCALSTORAGE
// ============================================
const MemorySystem = {
    memories: [],
    STORAGE_KEY: 'studyai_user_memories_permanent',
    MAX_MEMORIES: 100, // Prevent unlimited growth
    
    async init() {
        console.log('🔧 Initializing Memory System...');
        await this.loadMemories();
        this.setupMemoryToggle();
        this.updateMemoryBadge();
        console.log('✅ Memory System initialized with', this.memories.length, 'memories');
    },
    
    async loadMemories() {
        try {
            // Try localStorage first (primary storage)
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.memories = JSON.parse(stored);
                console.log(`📚 Loaded ${this.memories.length} memories from localStorage`);
                this.updateMemoryDisplay();
                return;
            }
            
            // Fallback: Try window.storage if available
            if (window.storage && window.storage.get) {
                const result = await window.storage.get(this.STORAGE_KEY);
                if (result && result.value) {
                    this.memories = JSON.parse(result.value);
                    console.log(`📚 Loaded ${this.memories.length} memories from window.storage`);
                    // Migrate to localStorage for faster access
                    this.saveToLocalStorage();
                    this.updateMemoryDisplay();
                    return;
                }
            }
            
            console.log('ℹ️ No existing memories found');
            this.memories = [];
        } catch (error) {
            console.error('❌ Failed to load memories:', error);
            this.memories = [];
        }
        this.updateMemoryDisplay();
    },
    
    saveToLocalStorage() {
        try {
            const dataToSave = JSON.stringify(this.memories);
            localStorage.setItem(this.STORAGE_KEY, dataToSave);
            
            // Verify save
            const verification = localStorage.getItem(this.STORAGE_KEY);
            if (!verification) {
                throw new Error('Verification failed');
            }
            
            console.log(`💾 Saved ${this.memories.length} memories to localStorage`);
            return true;
        } catch (error) {
            console.error('❌ LocalStorage save failed:', error);
            
            // If localStorage is full, try to free space by removing oldest memories
            if (error.name === 'QuotaExceededError') {
                console.warn('⚠️ Storage quota exceeded, removing oldest memories...');
                this.memories = this.memories.slice(-50); // Keep only last 50
                return this.saveToLocalStorage();
            }
            
            return false;
        }
    },
    
    async saveMemories() {
        // Save to localStorage first (primary)
        const localSuccess = this.saveToLocalStorage();
        
        // Also save to window.storage as backup (if available)
        if (window.storage && window.storage.set) {
            try {
                await window.storage.set(this.STORAGE_KEY, JSON.stringify(this.memories));
                console.log('💾 Backup saved to window.storage');
            } catch (error) {
                console.warn('⚠️ Backup to window.storage failed:', error);
            }
        }
        
        return localSuccess;
    },
    
    addMemory(content, type = 'general') {
        console.log(`💾 Attempting to add: [${type}] "${content}"`);
        
        // Validate content
        if (!content || typeof content !== 'string') {
            console.warn('⚠️ Invalid memory content');
            return false;
        }
        
        const cleanContent = content.trim();
        if (cleanContent.length < 2 || cleanContent.length > 500) {
            console.warn('⚠️ Memory content length invalid');
            return false;
        }
        
        // Check for duplicates (case-insensitive)
        const exists = this.memories.some(m => 
            m.content.toLowerCase() === cleanContent.toLowerCase()
        );
        
        if (exists) {
            console.log('⭕ Memory already exists, skipping');
            return false;
        }
        
        // Create memory object
        const memory = {
            id: Date.now() + Math.random(),
            content: cleanContent,
            type: type,
            timestamp: new Date().toISOString(),
            created: Date.now()
        };
        
        // Add to beginning (most recent first)
        this.memories.unshift(memory);
        
        // Enforce limit
        if (this.memories.length > this.MAX_MEMORIES) {
            this.memories = this.memories.slice(0, this.MAX_MEMORIES);
            console.log(`🔄 Trimmed to ${this.MAX_MEMORIES} memories`);
        }
        
        // Save immediately
        const saved = this.saveMemories();
        
        if (saved) {
            this.updateMemoryDisplay();
            this.updateMemoryBadge();
            this.showMemoryNotification('💾 Memory saved permanently!');
            console.log('✅ Memory saved:', memory);
            return true;
        } else {
            // Rollback if save failed
            this.memories.shift();
            this.showMemoryNotification('❌ Failed to save memory');
            return false;
        }
    },
    
    removeMemory(id) {
        console.log(`🗑️ Removing memory: ${id}`);
        const beforeCount = this.memories.length;
        
        this.memories = this.memories.filter(m => m.id !== id);
        
        if (this.memories.length < beforeCount) {
            this.saveMemories();
            this.updateMemoryDisplay();
            this.updateMemoryBadge();
            this.showMemoryNotification('🗑️ Memory deleted');
            console.log('✅ Memory removed');
        } else {
            console.warn('⚠️ Memory not found');
        }
    },
    
    async clearAllMemories() {
        const count = this.memories.length;
        
        if (!confirm(`⚠️ Delete all ${count} memories?\n\nThis action CANNOT be undone!`)) {
            return;
        }
        
        this.memories = [];
        
        // Clear from localStorage
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('🧹 Cleared localStorage');
        } catch (error) {
            console.error('❌ Failed to clear localStorage:', error);
        }
        
        // Clear from window.storage
        if (window.storage && window.storage.delete) {
            try {
                await window.storage.delete(this.STORAGE_KEY);
                console.log('🧹 Cleared window.storage');
            } catch (error) {
                console.warn('⚠️ Failed to clear window.storage:', error);
            }
        }
        
        this.updateMemoryDisplay();
        this.updateMemoryBadge();
        this.showMemoryNotification(`🧹 All ${count} memories cleared permanently`);
    },
    
    extractPersonalInfo(text) {
        if (!text || typeof text !== 'string') return;
        
        console.log('🔍 Extracting from:', text.substring(0, 100) + '...');
        
        const patterns = {
            name: /(?:my name is|i'm|i am|call me|i go by|this is)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
            email: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i,
            phone: /(?:phone|mobile|cell)(?:\s+(?:number|is))?\s*:?\s*([0-9]{3}[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/i,
            age: /(?:i am|i'm)\s+(\d{1,2})\s+years?\s+old/i,
            location: /(?:i live in|i'm from|i'm in|from)\s+([A-Za-z\s]+?)(?:\.|,|and|!|\?|$)/i,
            occupation: /(?:i am a|i'm a|i work as|my job is|i'm an?)\s+([a-z\s]+?)(?:\.|,|and|!|\?|$)/i,
            preference: /(?:i like|i prefer|i love|i enjoy|i'm interested in|interested in)\s+(.+?)(?:\.|!|\?|,|and|$)/i,
            goal: /(?:my goal is|i want to|i'm trying to|i aim to|goal is to)\s+(.+?)(?:\.|!|\?|and|$)/i,
            hobby: /(?:my hobby is|my hobbies are|i do|hobby:|hobbies:)\s+(.+?)(?:\.|!|\?|for fun|and|$)/i,
            study: /(?:i study|i'm studying|studying|i major in)\s+(.+?)(?:\.|!|\?|,|and|$)/i,
            school: /(?:i go to|i attend|i'm at|student at)\s+(.+?)(?:\.|!|\?|,|and|$)/i
        };
        
        let foundCount = 0;
        
        for (const [type, pattern] of Object.entries(patterns)) {
            const match = text.match(pattern);
            if (match) {
                let content = match[1] ? match[1].trim() : match[0].trim();
                
                // Clean up content
                content = content
                    .replace(/\s+/g, ' ')
                    .replace(/^(a|an|the)\s+/i, '')
                    .trim();
                
                // Validate content length
                if (content.length >= 2 && content.length <= 100) {
                    const added = this.addMemory(content, type);
                    if (added) {
                        console.log(`✅ Found ${type}:`, content);
                        foundCount++;
                    }
                }
            }
        }
        
        if (foundCount === 0) {
            console.log('❌ No patterns matched');
        } else {
            console.log(`✅ Extracted ${foundCount} new memories`);
        }
    },
    
    getContext() {
        if (this.memories.length === 0) return '';
        
        // Get most recent 10 memories for context
        const recentMemories = this.memories.slice(0, 10);
        
        return '\n\n[User Context: ' + 
               recentMemories.map(m => `${m.type}: ${m.content}`).join('; ') + 
               ']';
    },
    
    updateMemoryDisplay() {
        const container = document.getElementById('memoryList');
        if (!container) {
            console.warn('⚠️ memoryList container not found');
            return;
        }
        
        if (this.memories.length === 0) {
            container.innerHTML = `
                <div class="empty-memory">
                    <i class="fas fa-brain"></i>
                    <p style="font-weight: 600; margin-bottom: 5px;">No memories saved yet</p>
                    <p style="font-size: 12px; margin-top: 10px;">Personal info auto-saves from chat</p>
                    <p style="font-size: 11px; margin-top: 15px; color: #6c757d;">
                        Try: "My name is John" or "I like coding"
                    </p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.memories.map(memory => `
            <div class="memory-item" data-memory-id="${memory.id}">
                <div class="memory-item-header">
                    <span class="memory-type">${this.formatType(memory.type)}</span>
                    <button class="memory-delete" onclick="MemorySystem.removeMemory(${memory.id})" title="Delete permanently">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <div class="memory-content">${this.escapeHtml(memory.content)}</div>
                <div style="font-size: 10px; color: #adb5bd; margin-top: 5px;">
                    ${this.formatDate(memory.timestamp)}
                </div>
            </div>
        `).join('');
        
        console.log(`📊 Updated display: ${this.memories.length} memories`);
    },
    
    formatType(type) {
        const typeMap = {
            name: '👤 Name',
            email: '📧 Email',
            phone: '📱 Phone',
            age: '🎂 Age',
            location: '📍 Location',
            occupation: '💼 Job',
            preference: '❤️ Like',
            goal: '🎯 Goal',
            hobby: '🎨 Hobby',
            study: '📚 Study',
            school: '🏫 School',
            general: 'ℹ️ Info'
        };
        return typeMap[type] || '📝 ' + type;
    },
    
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    updateMemoryBadge() {
        const toggleBtn = document.getElementById('memoryToggleBtn');
        if (!toggleBtn) return;
        
        const count = this.memories.length;
        const existingBadge = toggleBtn.querySelector('.memory-badge');
        if (existingBadge) existingBadge.remove();
        
        if (count > 0) {
            const badge = document.createElement('span');
            badge.className = 'memory-badge';
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ef4444;
                color: white;
                border-radius: 50%;
                min-width: 22px;
                height: 22px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                padding: 0 4px;
            `;
            toggleBtn.style.position = 'relative';
            toggleBtn.appendChild(badge);
        }
    },
    
    setupMemoryToggle() {
        const toggleBtn = document.getElementById('memoryToggleBtn');
        const sidebar = document.getElementById('memorySidebar');
        const closeBtn = document.getElementById('closeMemoryBtn');
        const inputArea = document.querySelector('.input-area');
        
        if (!toggleBtn || !sidebar) {
            console.warn('⚠️ Memory toggle elements not found');
            return;
        }
        
        toggleBtn.addEventListener('click', () => {
            const isVisible = sidebar.classList.toggle('visible');
            toggleBtn.classList.toggle('active', isVisible);
            
            if (inputArea) {
                inputArea.classList.toggle('memory-visible', isVisible);
            }
            
            console.log('🔄 Memory panel:', isVisible ? 'opened' : 'closed');
        });
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                sidebar.classList.remove('visible');
                toggleBtn.classList.remove('active');
                if (inputArea) {
                    inputArea.classList.remove('memory-visible');
                }
            });
        }
        
        // Keyboard shortcut (Tab key)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                const activeElement = document.activeElement;
                const isInputFocused = activeElement.tagName === 'INPUT' || 
                                     activeElement.tagName === 'TEXTAREA';
                
                if (!isInputFocused) {
                    e.preventDefault();
                    toggleBtn.click();
                }
            }
        });
        
        this.updateMemoryBadge();
        console.log('✅ Memory toggle setup complete');
    },
    
    showMemoryNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 80px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);
            z-index: 9999;
            font-weight: 600;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.innerHTML = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    },
    
    // Export memories as JSON for backup
    exportMemories() {
        const dataStr = JSON.stringify(this.memories, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `memories_backup_${Date.now()}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        this.showMemoryNotification('💾 Memories exported!');
    },
    
    // Import memories from JSON backup
    async importMemories(file) {
        try {
            const text = await file.text();
            const imported = JSON.parse(text);
            
            if (!Array.isArray(imported)) {
                throw new Error('Invalid format');
            }
            
            const confirmed = confirm(`Import ${imported.length} memories?\nExisting memories will be merged.`);
            if (!confirmed) return;
            
            // Merge with existing, avoiding duplicates
            imported.forEach(mem => {
                if (!this.memories.some(m => m.content === mem.content)) {
                    this.memories.push(mem);
                }
            });
            
            this.saveMemories();
            this.updateMemoryDisplay();
            this.updateMemoryBadge();
            this.showMemoryNotification(`✅ Imported ${imported.length} memories`);
        } catch (error) {
            console.error('❌ Import failed:', error);
            alert('Failed to import memories. Invalid file format.');
        }
    }
};

// Add CSS animations if not already present
if (!document.getElementById('memory-animations')) {
    const style = document.createElement('style');
    style.id = 'memory-animations';
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Initialize Memory System on page load
document.addEventListener('DOMContentLoaded', () => {
    MemorySystem.init();
});

// Expose globally for debugging
window.MemorySystem = MemorySystem;

// Auto-save before page unload
window.addEventListener('beforeunload', () => {
    MemorySystem.saveMemories();
});
// Message Zoom System with Slider
const MessageZoomSystem = {
    activeZoom: null,
    defaultFontSize: 16, // Base font size in pixels
    
    init() {
        this.addZoomControls();
        this.observeNewMessages();
        console.log('✅ Message Zoom System initialized');
    },
    
    observeNewMessages() {
responseHistory = document.getElementById('responseHistory');
        if (!responseHistory) return;
        
        const observer = new MutationObserver(() => {
            this.addZoomControls();
        });
        
        observer.observe(responseHistory, {
            childList: true,
            subtree: true
        });
    },
    
    addZoomControls() {
        // Target both user and AI messages
        const messages = document.querySelectorAll('.flex:not(.zoom-enabled)');
        
        messages.forEach(message => {
            // Check if it's a message container (has message content)
            const messageContent = message.querySelector('.message-content, .user-message-text, .streaming-text');
            if (!messageContent) return;
            
            // Mark as processed
            message.classList.add('zoom-enabled');
            
            // Make message position relative for absolute positioning of slider
            message.style.position = 'relative';
            
            // Create zoom slider container
            const zoomContainer = document.createElement('div');
            zoomContainer.className = 'message-zoom-slider-container';
            zoomContainer.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                padding: 12px 16px;
                border-radius: 12px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
                z-index: 100;
                min-width: 200px;
            `;
            
            zoomContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <button class="zoom-btn-minus" style="
                        width: 32px;
                        height: 32px;
                        border: none;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 16px;
                        transition: all 0.2s;
                    ">
                        <i class="fas fa-minus"></i>
                    </button>
                    
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                        <input type="range" class="zoom-slider" min="12" max="32" value="16" step="1" style="
                            width: 100%;
                            height: 6px;
                            border-radius: 3px;
                            background: linear-gradient(to right, #667eea 0%, #764ba2 100%);
                            outline: none;
                            cursor: pointer;
                            -webkit-appearance: none;
                        ">
                        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #6b7280;">
                            <span>12px</span>
                            <span class="zoom-value" style="font-weight: bold; color: #667eea;">16px</span>
                            <span>32px</span>
                        </div>
                    </div>
                    
                    <button class="zoom-btn-plus" style="
                        width: 32px;
                        height: 32px;
                        border: none;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 16px;
                        transition: all 0.2s;
                    ">
                        <i class="fas fa-plus"></i>
                    </button>
                    
                    <button class="zoom-btn-reset" title="Reset" style="
                        width: 32px;
                        height: 32px;
                        border: 2px solid #667eea;
                        background: white;
                        color: #667eea;
                        border-radius: 8px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 12px;
                        transition: all 0.2s;
                    ">
                        <i class="fas fa-undo"></i>
                    </button>
                </div>
            `;
            
            message.appendChild(zoomContainer);
            
            // Get elements
            const slider = zoomContainer.querySelector('.zoom-slider');
            const zoomValue = zoomContainer.querySelector('.zoom-value');
            const btnMinus = zoomContainer.querySelector('.zoom-btn-minus');
            const btnPlus = zoomContainer.querySelector('.zoom-btn-plus');
            const btnReset = zoomContainer.querySelector('.zoom-btn-reset');
            
            // Store original font size
            const originalFontSize = window.getComputedStyle(messageContent).fontSize;
            message.dataset.originalFontSize = originalFontSize;
            
            // Slider functionality
            const updateZoom = (value) => {
                const fontSize = parseInt(value);
                messageContent.style.fontSize = `${fontSize}px`;
                messageContent.style.lineHeight = `${fontSize * 1.6}px`;
                zoomValue.textContent = `${fontSize}px`;
                slider.value = fontSize;
                
                // Update button states
                btnMinus.disabled = fontSize <= 12;
                btnPlus.disabled = fontSize >= 32;
                
                btnMinus.style.opacity = fontSize <= 12 ? '0.5' : '1';
                btnPlus.style.opacity = fontSize >= 32 ? '0.5' : '1';
            };
            
            slider.addEventListener('input', (e) => {
                updateZoom(e.target.value);
            });
            
            // Button controls
            btnMinus.addEventListener('click', () => {
                const newValue = Math.max(12, parseInt(slider.value) - 2);
                updateZoom(newValue);
            });
            
            btnPlus.addEventListener('click', () => {
                const newValue = Math.min(32, parseInt(slider.value) + 2);
                updateZoom(newValue);
            });
            
            btnReset.addEventListener('click', () => {
                updateZoom(16);
            });
            
            // Button hover effects
            [btnMinus, btnPlus].forEach(btn => {
                btn.addEventListener('mouseenter', () => {
                    if (!btn.disabled) {
                        btn.style.transform = 'scale(1.1)';
                        btn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                    }
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = 'scale(1)';
                    btn.style.boxShadow = 'none';
                });
            });
            
            btnReset.addEventListener('mouseenter', () => {
                btnReset.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                btnReset.style.color = 'white';
                btnReset.style.transform = 'scale(1.1)';
            });
            btnReset.addEventListener('mouseleave', () => {
                btnReset.style.background = 'white';
                btnReset.style.color = '#667eea';
                btnReset.style.transform = 'scale(1)';
            });
            
            // Show/hide on hover
            message.addEventListener('mouseenter', () => {
                zoomContainer.style.opacity = '1';
                zoomContainer.style.pointerEvents = 'auto';
            });
            
            message.addEventListener('mouseleave', () => {
                zoomContainer.style.opacity = '0';
                zoomContainer.style.pointerEvents = 'none';
            });
            
            // Style the slider thumb
            const style = document.createElement('style');
            style.textContent = `
                .zoom-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: white;
                    border: 3px solid #667eea;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s;
                }
                
                .zoom-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }
                
                .zoom-slider::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: white;
                    border: 3px solid #667eea;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s;
                }
                
                .zoom-slider::-moz-range-thumb:hover {
                    transform: scale(1.2);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }
            `;
            
            if (!document.getElementById('zoom-slider-styles')) {
                style.id = 'zoom-slider-styles';
                document.head.appendChild(style);
            }
        });
    }
};

// Initialize the zoom system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other systems to initialize
    setTimeout(() => {
        MessageZoomSystem.init();
    }, 500);
});

// Also expose it globally for manual initialization if needed
window.MessageZoomSystem = MessageZoomSystem;


   document.addEventListener('DOMContentLoaded', () => {
        const hint = document.getElementById('zoomFeatureHint');
        const hasSeenHint = localStorage.getItem('hasSeenZoomHint');
        
        if (!hasSeenHint && hint) {
            setTimeout(() => {
                hint.style.opacity = '1';
                hint.style.pointerEvents = 'auto';
                
                setTimeout(() => {
                    hint.style.opacity = '0';
                    hint.style.pointerEvents = 'none';
                }, 5000);
                
                localStorage.setItem('hasSeenZoomHint', 'true');
            }, 2000);
        }
    });

            // Initialize Canvas System
document.addEventListener('DOMContentLoaded', () => {
    CanvasSystem.init();
    console.log('✅ Canvas System initialized');
});

// Expose globally for debugging
window.CanvasSystem = CanvasSystem;

// Validate critical DOM elements
function validateDOMElements() {
    const elements = {
        responseHistory: document.getElementById('responseHistory'),
        chatContainer: document.getElementById('chatContainer'),
        promptInput: document.getElementById('prompt'),
        generateButton: document.getElementById('generateButton')
    };
    
    const missing = [];
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            missing.push(key);
            console.error(`❌ Missing element: ${key}`);
        }
    }
    
    if (missing.length > 0) {
        alert(`CRITICAL ERROR: Missing DOM elements:\n${missing.join('\n')}\n\nPlease refresh the page.`);
        return false;
    }
    
    console.log('✅ All critical DOM elements found');
    return true;
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
    if (!validateDOMElements()) {
        console.error('❌ DOM validation failed!');
    }
});


console.log('=== DOM CHECK ===');
console.log('responseHistory:', document.getElementById('responseHistory'));
console.log('chatContainer:', document.getElementById('chatContainer'));
console.log('promptInput:', document.getElementById('prompt'));
console.log('generateButton:', document.getElementById('generateButton'));
console.log('activeChatId:', activeChatId);
console.log('chats:', chats);
