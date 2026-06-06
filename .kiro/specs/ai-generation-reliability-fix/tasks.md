# Implementation Plan: AI Generation Reliability Fix

## Overview

This implementation adds comprehensive structured logging, validation enforcement, and observability to the AI App Generator pipeline. The goal is to diagnose why the system generates incomplete applications (hero-only pages) instead of complete CRUD apps, by adding visibility at every stage of the generation process.

**Key Changes:**
- Structured logging with request correlation IDs throughout the pipeline
- Enhanced validation that rejects incomplete configs and forces provider fallback
- Improved prompt engineering with explicit CRUD requirements
- Health check endpoint for verifying code version and provider status
- Test mode support for pipeline verification without external API calls

**Implementation Language:** TypeScript (Next.js)

## Tasks

- [x] 1. Create logging infrastructure
  - [x] 1.1 Create logger utility with structured logging interface
    - Create `lib/logger.ts` with `Logger` interface, `createLogger()`, and `generateRequestId()` functions
    - Implement structured JSON logging with timestamp, requestId, component, level, event, and data fields
    - Implement log sanitization for API keys and error messages
    - Support debug, info, warn, and error log levels
    - _Requirements: 1.1, 1.4, 7.1_

  - [x] 1.2 Create version identification utility
    - Create `lib/version.ts` with `getVersion()` function
    - Attempt to read Git commit hash using child_process (`git rev-parse --short HEAD`)
    - Fallback to package.json version + timestamp if Git is not available
    - Support `APP_VERSION` environment variable override
    - _Requirements: 1.5, 8.3_

  - [ ]* 1.3 Write unit tests for logger utility
    - Test log entry structure includes all required fields
    - Test request ID generation produces unique UUIDs
    - Test API key sanitization (masks middle characters)
    - Test error serialization captures message and stack
    - _Requirements: 1.1, 1.4_

- [x] 2. Checkpoint - Verify logging infrastructure
  - Ensure all tests pass, verify logger outputs structured JSON to console, ask the user if questions arise.

- [x] 3. Add health check endpoint
  - [x] 3.1 Create health check API route
    - Create `app/api/apps/generate/health/route.ts`
    - Implement GET handler that returns version, timestamp, provider status, and cache info
    - Check which AI provider API keys are configured (GROQ_API_KEY, OPENAI_API_KEY, etc.)
    - Include Node.js version and process uptime in response
    - Return JSON with `HealthResponse` interface structure
    - _Requirements: 1.5, 8.3, 8.4_

  - [ ]* 3.2 Write integration test for health endpoint
    - Test endpoint returns 200 status
    - Test response includes version, timestamp, providers, and cache fields
    - Test providers list shows which API keys are configured
    - _Requirements: 8.4_

- [x] 4. Enhance API route with logging
  - [x] 4.1 Add request correlation and logging to generate route
    - Modify `app/api/apps/generate/route.ts` to generate request ID at entry
    - Create logger instance with request ID using `createLogger()`
    - Log request start with prompt, template ID (if provided), and user ID
    - Log environment details (Node.js version, process uptime) on first request
    - Log final config summary (entity count, page count) before return
    - Log total execution time and success status
    - Pass logger to `generateConfigFromPrompt()` and `parseConfig()` calls
    - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.6, 7.7_

  - [ ]* 4.2 Write integration tests for API route logging
    - Test POST request generates logs with request ID
    - Test logs include request start, execution time, and completion events
    - Test logger is passed to downstream functions
    - _Requirements: 7.1, 7.7_

- [x] 5. Checkpoint - Verify API logging
  - Ensure all tests pass, manually test the generate endpoint and verify logs appear in console, ask the user if questions arise.

- [x] 6. Enhance AI provider chain with validation and logging
  - [x] 6.1 Add validation function with logging
    - Modify `lib/mistral.ts` to add optional `logger` parameter to `isUsableConfig()` function
    - Log validation start with config structure (entity count, page count)
    - Check for at least one entity
    - Check for at least one table page (`root.kind === 'table'`)
    - Check for at least one form page (`root.kind === 'form'`)
    - Log validation result (pass/fail) with specific reasons for failure
    - Return boolean result
    - _Requirements: 3.3, 3.4, 4.1, 4.2, 4.3_

  - [x] 6.2 Add provider attempt function with logging
    - Create new `tryProvider()` helper function in `lib/mistral.ts`
    - Accept provider config, prompt, and logger as parameters
    - Log provider attempt start with provider name, model, and API key status (sanitized)
    - Make API call to the provider
    - Log HTTP response status and response time
    - Extract and parse JSON from response
    - Log raw response structure (entity count, page count, page kinds array)
    - Call `isUsableConfig()` with logger to validate the config
    - Log validation result
    - Return config if valid, null if invalid or error
    - Log errors with provider name, HTTP status, and error message
    - _Requirements: 2.1, 2.2, 2.3, 4.4_

  - [x] 6.3 Update provider chain orchestration with logging
    - Modify `generateConfigFromPrompt()` in `lib/mistral.ts` to accept optional logger parameter
    - Log generation start with provider chain order (Groq → Mistral → OpenAI → Anthropic → Templates)
    - Iterate through providers using `tryProvider()`
    - Log fallback transitions when moving to next provider with reason
    - Log template fallback decision if all providers fail
    - Log final config summary (entity count, page count, theme status)
    - Return final config
    - _Requirements: 2.4, 2.5, 7.2_

  - [ ]* 6.4 Write unit tests for config validation
    - Test config with entities, table, and form returns true
    - Test config with entities but no table returns false
    - Test config with entities but no form returns false
    - Test config with empty entities returns false
    - Verify validation logs include specific failure reasons
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 6.5 Write integration tests for provider chain
    - Mock provider API calls to test success path
    - Mock provider failures to test fallback behavior
    - Test provider rejection when config is incomplete
    - Test template fallback when all providers fail
    - Verify logs show provider attempts, fallbacks, and decisions
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 7. Enhance prompts with explicit CRUD requirements
  - [x] 7.1 Update system prompt in provider functions
    - Modify system prompt in `lib/mistral.ts` to explicitly warn against hero-only apps
    - Add "HARD RULES" section stating: "You MUST generate table pages for EVERY entity"
    - Add rule: "You MUST generate form pages for EVERY entity"
    - Add rule: "DO NOT generate apps with only hero/landing pages"
    - Provide complete example config showing entities with table and form pages
    - List all allowed component kinds
    - _Requirements: 5.3, 5.4, 5.5_

  - [x] 7.2 Update user prompt construction
    - Modify user prompt to restate user's request
    - Add reminder: "Include table pages for listing all entities"
    - Add reminder: "Include form pages for creating/editing all entities"
    - Request JSON-only output
    - _Requirements: 5.3, 5.4_

  - [x] 7.3 Add prompt logging
    - Log full system prompt before provider call (debug level)
    - Log user prompt before provider call (info level)
    - _Requirements: 5.1, 5.2_

- [x] 8. Checkpoint - Verify provider chain enhancements
  - Ensure all tests pass, manually test generation and verify logs show provider attempts, validation results, and fallback behavior, ask the user if questions arise.

- [x] 9. Enhance config parser with logging
  - [x] 9.1 Add logging to parseConfig function
    - Modify `parseConfig()` in `lib/config/parser.ts` to accept optional `logger` parameter
    - Log parse start with input type and size (if string)
    - Attempt JSON parse, log parse success or failure
    - Log corrections applied (missing fields filled, invalid values coerced)
    - Log final structure (entity count, page count)
    - Return AppConfig
    - _Requirements: 3.1, 3.2_

  - [x] 9.2 Add logging to ensureCompleteApp function
    - Modify `ensureCompleteApp()` in `lib/config/parser.ts` to accept optional `logger` parameter
    - Log augmentation start with input state (entity count, page count, existing routes)
    - Check and log home page status (exists/added)
    - Check and log stats page status (exists/added)
    - For each entity, log entity processing (name, existing pages)
    - Check and log table page status (exists/added with route)
    - Check and log form page status (exists/added with route)
    - Generate theme colors if missing (deterministic hash of app name)
    - Log theme status (AI-provided vs generated, colors)
    - Log augmentation summary (pages added, final page count)
    - Return augmented AppConfig
    - _Requirements: 1.2, 1.3, 3.3, 3.5, 4.5, 4.6, 4.7, 6.1, 6.2, 7.5_

  - [ ]* 9.3 Write unit tests for config parsing
    - Test valid JSON string parses correctly
    - Test invalid JSON returns safe default config
    - Test missing fields are filled with defaults
    - Test invalid field types are coerced
    - Verify parsing logs show corrections applied
    - _Requirements: 3.1, 3.2_

  - [ ]* 9.4 Write unit tests for config augmentation
    - Test empty pages array adds home, stats, table, form for each entity
    - Test missing table page for entity adds table page
    - Test missing form page for entity adds form page
    - Test missing theme generates deterministic colors
    - Test complete config is idempotent (no changes)
    - Verify augmentation logs show pages added
    - _Requirements: 4.5, 4.6, 4.7, 6.1, 6.2_

- [x] 10. Add test mode support
  - [x] 10.1 Implement test mode environment variable handling
    - Check for `AI_TEST_MODE` environment variable in `lib/mistral.ts`
    - When test mode is enabled, skip external API calls to AI providers
    - Log test mode activation
    - Use template fallback immediately with full logging
    - Include detailed config structure in test mode logs
    - _Requirements: 9.1, 9.3, 9.4_

  - [x] 10.2 Validate template configs
    - Add startup validation that all template configs pass `isUsableConfig()`
    - Log validation results for each template
    - Throw error if any template is invalid (fail-fast)
    - _Requirements: 9.4_

  - [ ]* 10.3 Write integration tests for test mode
    - Test AI_TEST_MODE=true skips external API calls
    - Test test mode uses template fallback
    - Test test mode logs all intermediate results
    - _Requirements: 9.1, 9.3_

- [x] 11. Add documentation for cache management
  - [x] 11.1 Update README with dev server restart instructions
    - Add section explaining how to properly restart dev server after code changes
    - Document cache clearing steps: `rm -rf .next` (or `Remove-Item -Recurse -Force .next` on Windows)
    - Explain how to verify code version using health endpoint
    - Include troubleshooting steps for when changes aren't reflected
    - _Requirements: 8.1, 8.2_

  - [x] 11.2 Add test prompts documentation
    - Document example test prompts (CRM app, habit tracker, task manager, book library)
    - Explain expected results for each prompt
    - Document verification steps (check logs, verify entities/pages, verify theme)
    - _Requirements: 9.2_

- [ ] 12. Final checkpoint - End-to-end validation
  - Ensure all tests pass, restart dev server and clear cache, test with documented prompts, verify complete log traces appear in console, verify health endpoint returns correct version, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test-related sub-tasks that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Logger parameter is optional in all functions (backward compatible)
- No database schema changes required - all changes are code-only
- Focus on observability first, then validation enforcement, then testing
