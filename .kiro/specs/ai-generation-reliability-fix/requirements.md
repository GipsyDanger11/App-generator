# Requirements Document

## Introduction

This document specifies requirements for fixing reliability issues in the AI App Generator where the system generates incomplete applications (only hero sections with modified text) instead of complete CRUD applications with multiple entities, pages, and functional components.

The system currently has code changes in place to:
- Validate complete app structure via `ensureCompleteApp()`
- Implement multi-provider AI fallback (Groq, Mistral, OpenAI, Anthropic)
- Auto-generate theme colors
- Add logging for debugging

However, user reports indicate these fixes are not producing the expected results, suggesting:
- Code changes may not be executing (cached builds)
- Validation logic may not be triggering correctly
- AI providers may not be receiving correct prompts or returning valid configs
- The complete app enforcement may have gaps

## Glossary

- **AI_Generator**: The system component responsible for generating app configurations from user prompts
- **AppConfig**: The JSON structure containing entities, pages, theme, and other app metadata
- **CRUD_App**: A complete application with Create, Read, Update, Delete functionality for at least one entity
- **Complete_App**: An AppConfig with entities defined, table pages for listing data, and form pages for creating/editing data
- **Hero_Only_App**: An incomplete AppConfig containing only a hero landing page without functional CRUD pages
- **Provider_Chain**: The ordered sequence of AI providers (Groq → Mistral → OpenAI → Anthropic) tried for generation
- **ensureCompleteApp**: The function that validates and augments AppConfigs to ensure they have all required pages
- **Dev_Server**: The Next.js development server that serves the application during development

## Requirements

### Requirement 1: Code Execution Verification

**User Story:** As a developer, I want to verify that code changes are actually running in the dev server, so that I can confirm fixes are being applied.

#### Acceptance Criteria

1. WHEN the generate API endpoint is called, THE AI_Generator SHALL log the execution environment details including timestamp and Node.js process info
2. WHEN `ensureCompleteApp()` is invoked, THE AI_Generator SHALL log entry with the input config entity count and page count
3. WHEN `ensureCompleteApp()` completes, THE AI_Generator SHALL log the output config entity count and page count showing augmentation results
4. THE AI_Generator SHALL log a unique request identifier for each generation request to correlate log entries
5. WHEN the dev server starts, THE AI_Generator SHALL log initialization indicating which code version is loaded

### Requirement 2: AI Provider Execution Tracing

**User Story:** As a developer, I want detailed logging of AI provider calls, so that I can diagnose which provider is being used and what responses are received.

#### Acceptance Criteria

1. WHEN attempting to call an AI provider, THE AI_Generator SHALL log the provider name, model name, and whether an API key is configured
2. WHEN an AI provider call succeeds, THE AI_Generator SHALL log the provider name, response time, and a summary of the returned config structure
3. WHEN an AI provider call fails, THE AI_Generator SHALL log the provider name, error type, HTTP status code, and error message
4. WHEN falling back to the next provider in the chain, THE AI_Generator SHALL log the transition with the reason for fallback
5. WHEN all providers fail and template fallback is used, THE AI_Generator SHALL log which template was selected and why

### Requirement 3: Configuration Validation Tracing

**User Story:** As a developer, I want to see validation results for generated configs, so that I can identify if configs are being rejected or accepted incorrectly.

#### Acceptance Criteria

1. WHEN `parseConfig()` receives input, THE AI_Generator SHALL log the input type and size
2. WHEN `parseConfig()` completes, THE AI_Generator SHALL log the parsed entity count, page count, and any corrections applied
3. WHEN `isUsableConfig()` evaluates a config, THE AI_Generator SHALL log whether the config has entities, table pages, and form pages
4. WHEN `isUsableConfig()` rejects a config, THE AI_Generator SHALL log the specific reason for rejection
5. WHEN `ensureCompleteApp()` augments pages, THE AI_Generator SHALL log each page addition with the page type and entity

### Requirement 4: Complete App Generation Enforcement

**User Story:** As a user, I want every generated app to include functional CRUD pages, so that I receive a working application not just a landing page.

#### Acceptance Criteria

1. WHEN an AI provider returns a config, THE AI_Generator SHALL validate it has at least one entity before accepting it
2. WHEN an AI provider returns a config, THE AI_Generator SHALL validate it has at least one table page before accepting it
3. WHEN an AI provider returns a config, THE AI_Generator SHALL validate it has at least one form page before accepting it
4. IF a provider's config lacks required pages, THEN THE AI_Generator SHALL reject it and try the next provider in the chain
5. WHEN `ensureCompleteApp()` is called, THE AI_Generator SHALL add missing table pages for every entity that lacks one
6. WHEN `ensureCompleteApp()` is called, THE AI_Generator SHALL add missing form pages for every entity that lacks one
7. WHEN `ensureCompleteApp()` is called, THE AI_Generator SHALL add a stats page on the home route if one does not exist

### Requirement 5: Prompt Engineering Verification

**User Story:** As a developer, I want to verify AI providers receive correct prompts, so that I can ensure they are being instructed to generate complete apps.

#### Acceptance Criteria

1. WHEN calling an AI provider, THE AI_Generator SHALL log the full system prompt sent to the provider
2. WHEN calling an AI provider, THE AI_Generator SHALL log the user prompt sent to the provider
3. THE system prompt SHALL explicitly instruct the AI to generate table pages for every entity
4. THE system prompt SHALL explicitly instruct the AI to generate form pages for every entity
5. THE system prompt SHALL explicitly warn against generating only hero pages

### Requirement 6: Theme Color Application Verification

**User Story:** As a user, I want generated apps to have distinct theme colors, so that each app has a unique visual identity.

#### Acceptance Criteria

1. WHEN `ensureCompleteApp()` processes a config without theme colors, THE AI_Generator SHALL generate deterministic colors based on the app name
2. WHEN theme colors are generated, THE AI_Generator SHALL log the selected primary and accent colors
3. WHEN an AI provider returns theme colors, THE AI_Generator SHALL preserve those colors and log that they were provided by the AI
4. THE generated theme SHALL include both primary and accent colors in valid hex format

### Requirement 7: End-to-End Flow Validation

**User Story:** As a developer, I want to trace the complete generation flow from prompt to database, so that I can identify where the process breaks down.

#### Acceptance Criteria

1. WHEN a generation request starts, THE AI_Generator SHALL log the request ID and user prompt
2. WHEN the Provider_Chain is executed, THE AI_Generator SHALL log each provider attempt in sequence
3. WHEN config parsing occurs, THE AI_Generator SHALL log parsing success or failure with details
4. WHEN config validation occurs, THE AI_Generator SHALL log validation results with pass/fail status
5. WHEN config augmentation occurs, THE AI_Generator SHALL log the before and after page counts
6. WHEN the final config is returned to the client, THE AI_Generator SHALL log the complete config structure summary
7. WHEN a generation request completes, THE AI_Generator SHALL log the total execution time and success status

### Requirement 8: Dev Server Cache Management

**User Story:** As a developer, I want to ensure the dev server runs the latest code, so that my fixes are actually applied during testing.

#### Acceptance Criteria

1. THE documentation SHALL include instructions for properly restarting the dev server after code changes
2. THE documentation SHALL include instructions for clearing Next.js build cache when code changes are not reflected
3. WHEN the dev server starts, THE AI_Generator SHALL log a startup timestamp and code version identifier
4. THE AI_Generator SHALL include a health check endpoint that returns the current code version and configuration status

### Requirement 9: Integration Testing Support

**User Story:** As a developer, I want to test the generation flow with known prompts, so that I can verify the system produces complete apps consistently.

#### Acceptance Criteria

1. THE AI_Generator SHALL support a test mode that logs all intermediate results without calling external AI APIs
2. THE AI_Generator SHALL provide example test prompts that should produce complete CRUD apps
3. WHEN running in test mode with template fallback, THE AI_Generator SHALL return a complete validated config
4. THE AI_Generator SHALL validate that all template configs pass `isUsableConfig()` validation
