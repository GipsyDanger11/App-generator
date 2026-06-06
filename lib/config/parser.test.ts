/**
 * Tests for config parser with logging
 */

import { parseConfig, ensureCompleteApp } from './parser';
import { createLogger, generateRequestId } from '../logger';
import type { AppConfig } from './types';

describe('parseConfig with logging', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should log parse start and completion', () => {
    const logger = createLogger(generateRequestId());
    const input = {
      name: 'Test App',
      description: 'Test description',
      entities: [],
      pages: [],
    };

    parseConfig(input, logger);

    // Verify logging calls
    expect(consoleLogSpy).toHaveBeenCalled();
    
    const logs = consoleLogSpy.mock.calls.map(call => JSON.parse(call[0]));
    
    // Check for parse_start event
    const parseStartLog = logs.find(log => log.event === 'parse_start');
    expect(parseStartLog).toBeDefined();
    expect(parseStartLog?.component).toBe('parser');
    expect(parseStartLog?.data?.inputType).toBe('object');

    // Check for parse_complete event
    const parseCompleteLog = logs.find(log => log.event === 'parse_complete');
    expect(parseCompleteLog).toBeDefined();
    expect(parseCompleteLog?.component).toBe('parser');
    expect(parseCompleteLog?.data?.entityCount).toBe(0);
    expect(parseCompleteLog?.data?.pageCount).toBe(1); // Welcome page is added
  });

  it('should log JSON parse success when input is string', () => {
    const logger = createLogger(generateRequestId());
    const input = JSON.stringify({
      name: 'Test App',
      entities: [],
      pages: [],
    });

    parseConfig(input, logger);

    const logs = consoleLogSpy.mock.calls.map(call => JSON.parse(call[0]));
    
    const jsonParseLog = logs.find(log => log.event === 'json_parse_success');
    expect(jsonParseLog).toBeDefined();
  });

  it('should log JSON parse failure when input is invalid JSON string', () => {
    const logger = createLogger(generateRequestId());
    const input = 'invalid json {';

    parseConfig(input, logger);

    const logs = consoleLogSpy.mock.calls.map(call => JSON.parse(call[0]));
    
    const jsonParseFailLog = logs.find(log => log.event === 'json_parse_failure');
    expect(jsonParseFailLog).toBeDefined();
    expect(jsonParseFailLog?.level).toBe('warn');
  });

  it('should log corrections applied', () => {
    const logger = createLogger(generateRequestId());
    const input = {
      // Missing name
      description: 123, // Invalid type
      entities: [],
      pages: [],
    };

    parseConfig(input, logger);

    const logs = consoleLogSpy.mock.calls.map(call => JSON.parse(call[0]));
    
    const parseCompleteLog = logs.find(log => log.event === 'parse_complete');
    expect(parseCompleteLog?.data?.correctionsApplied).toBeInstanceOf(Array);
  });
});

describe('ensureCompleteApp with logging', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should log augmentation start and complete', () => {
    const logger = createLogger(generateRequestId());
    const config: AppConfig = {
      name: 'Test App',
      description: 'Test description',
      entities: [
        {
          name: 'Task',
          label: 'Task',
          labelPlural: 'Tasks',
          fields: [
            { name: 'title', type: 'string', label: 'Title', required: true, unique: false },
          ],
        },
      ],
      pages: [],
    };

    ensureCompleteApp(config, logger);

    const logs = consoleLogSpy.mock.calls.map(call => JSON.parse(call[0]));
    
    // Check for augmentation_start
    const startLog = logs.find(log => log.event === 'augmentation_start');
    expect(startLog).toBeDefined();
    expect(startLog?.component).toBe('augmenter');
    expect(startLog?.data?.entityCount).toBe(1);
    expect(startLog?.data?.pageCount).toBe(0);

    // Check for augmentation_complete
    const completeLog = logs.find(log => log.event === 'augmentation_complete');
    expect(completeLog).toBeDefined();
    expect(completeLog?.component).toBe('augmenter');
    expect(completeLog?.data?.pagesAdded).toBeGreaterThan(0);
  });

  it('should log home page addition', () => {
    const logger = createLogger(generateRequestId());
    const config: AppConfig = {
      name: 'Test App',
      description: 'Test description',
      entities: [
        {
          name: 'Task',
          label: 'Task',
          labelPlural: 'Tasks',
          fields: [],
        },
      ],
      pages: [],
    };

    ensureCompleteApp(config, logger);

    const logs = consoleLogSpy.mock.calls.map(call => JSON.parse(call[0]));
    
    const homePageLog = logs.find(log => log.event === 'home_page_added');
    expect(homePageLog).toBeDefined();
    expect(homePageLog?.data?.route).toBe('/');
  });

  it('should log entity processing and page additions', () => {
    const logger = createLogger(generateRequestId());
    const config: AppConfig = {
      name: 'Test App',
      description: 'Test description',
      entities: [
        {
          name: 'Task',
          label: 'Task',
          labelPlural: 'Tasks',
          fields: [],
        },
      ],
      pages: [],
    };

    ensureCompleteApp(config, logger);

    const logs = consoleLogSpy.mock.calls.map(call => JSON.parse(call[0]));
    
    // Check for entity processing
    const entityLog = logs.find(log => log.event === 'entity_processing');
    expect(entityLog).toBeDefined();
    expect(entityLog?.data?.entityName).toBe('Task');

    // Check for table page addition
    const tableLog = logs.find(log => log.event === 'table_page_added');
    expect(tableLog).toBeDefined();
    expect(tableLog?.data?.entityName).toBe('Task');

    // Check for form page addition
    const formLog = logs.find(log => log.event === 'form_page_added');
    expect(formLog).toBeDefined();
    expect(formLog?.data?.entityName).toBe('Task');
  });

  it('should log theme color generation', () => {
    const logger = createLogger(generateRequestId());
    const config: AppConfig = {
      name: 'Test App',
      description: 'Test description',
      entities: [],
      pages: [],
    };

    ensureCompleteApp(config, logger);

    const logs = consoleLogSpy.mock.calls.map(call => JSON.parse(call[0]));
    
    const themeLog = logs.find(log => log.event === 'theme_colors');
    expect(themeLog).toBeDefined();
    expect(themeLog?.data?.source).toBe('generated');
    expect(themeLog?.data?.primary).toBeDefined();
    expect(themeLog?.data?.accent).toBeDefined();
  });

  it('should log AI-provided theme when present', () => {
    const logger = createLogger(generateRequestId());
    const config: AppConfig = {
      name: 'Test App',
      description: 'Test description',
      entities: [],
      pages: [],
      theme: {
        primary: '#ff0000',
        accent: '#00ff00',
      },
    };

    ensureCompleteApp(config, logger);

    const logs = consoleLogSpy.mock.calls.map(call => JSON.parse(call[0]));
    
    const themeLog = logs.find(log => log.event === 'theme_colors');
    expect(themeLog).toBeDefined();
    expect(themeLog?.data?.source).toBe('AI-provided');
    expect(themeLog?.data?.primary).toBe('#ff0000');
    expect(themeLog?.data?.accent).toBe('#00ff00');
  });

  it('should skip augmentation when no entities', () => {
    const logger = createLogger(generateRequestId());
    const config: AppConfig = {
      name: 'Test App',
      description: 'Test description',
      entities: [],
      pages: [],
    };

    ensureCompleteApp(config, logger);

    const logs = consoleLogSpy.mock.calls.map(call => JSON.parse(call[0]));
    
    const skipLog = logs.find(log => log.event === 'augmentation_skipped');
    expect(skipLog).toBeDefined();
    expect(skipLog?.data?.reason).toBe('No entities defined');
  });

  it('should log when pages already exist', () => {
    const logger = createLogger(generateRequestId());
    const config: AppConfig = {
      name: 'Test App',
      description: 'Test description',
      entities: [
        {
          name: 'Task',
          label: 'Task',
          labelPlural: 'Tasks',
          fields: [],
        },
      ],
      pages: [
        {
          id: 'home',
          route: '/',
          title: 'Home',
          root: { kind: 'hero', props: {} },
        },
        {
          id: 'tasks',
          route: '/tasks',
          title: 'Tasks',
          entity: 'Task',
          root: { kind: 'table', props: { entity: 'Task' } },
        },
        {
          id: 'tasks-new',
          route: '/tasks/new',
          title: 'New Task',
          entity: 'Task',
          root: { kind: 'form', props: { entity: 'Task', mode: 'create' } },
        },
      ],
    };

    ensureCompleteApp(config, logger);

    const logs = consoleLogSpy.mock.calls.map(call => JSON.parse(call[0]));
    
    // Check that exists logs are present instead of added logs
    const homeExistsLog = logs.find(log => log.event === 'home_page_exists');
    expect(homeExistsLog).toBeDefined();

    const tableExistsLog = logs.find(log => log.event === 'table_page_exists');
    expect(tableExistsLog).toBeDefined();

    const formExistsLog = logs.find(log => log.event === 'form_page_exists');
    expect(formExistsLog).toBeDefined();

    // Verify no pages were added
    const completeLog = logs.find(log => log.event === 'augmentation_complete');
    expect(completeLog?.data?.pagesAdded).toBe(0);
  });
});
