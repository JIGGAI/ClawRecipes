import { describe, expect, test, vi, beforeEach } from 'vitest';
import {
  fetchTeams,
  fetchTickets,
  fetchTicketContent,
  fetchInbox,
  fetchInboxContent,
  fetchHealth,
  fetchRecipes,
  fetchRecipe,
  fetchRecipeStatus,
  fetchActivity,
  fetchCleanupPlan,
  executeCleanup,
  scaffoldRecipeTeam,
  scaffoldRecipeAgent,
  installRecipeSkills,
  moveTicket,
  assignTicket,
  takeTicket,
  handoffTicket,
  completeTicket,
  dispatchTicket,
  removeTeam,
  fetchBindings,
  addBindingAPI,
  removeBindingAPI,
  setOnUnauthorized,
  DEMO_TEAMS,
  DEMO_TEAM_ID,
} from '../app/src/api.ts';
import * as authStore from '../app/src/authStore';

describe('api parseApiError behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('fetchTeams throws Error with parsed JSON error message on 4xx', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve(JSON.stringify({ error: 'Custom error message' })),
      } as Response)
    );

    await expect(fetchTeams()).rejects.toThrow('Custom error message');
  });

  test('fetchTeams throws Error with raw text when response is not JSON', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve('raw error text'),
      } as Response)
    );

    await expect(fetchTeams()).rejects.toThrow('raw error text');
  });

  test('fetchTeams passes no Authorization when authStore has no header', async () => {
    let capturedInit: RequestInit | undefined;
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
      capturedInit = init;
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response);
    });
    vi.spyOn(authStore, 'getAuthHeader').mockReturnValue(undefined);
    await fetchTeams();
    expect(capturedInit?.headers).toBeDefined();
    const headers = capturedInit?.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  test('fetchTeams on 401 clears authStore and calls onUnauthorized', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        status: 401,
        text: () => Promise.resolve(JSON.stringify({ error: 'Unauthorized' })),
      } as Response)
    );
    const clearSpy = vi.spyOn(authStore, 'clear').mockImplementation(() => {});
    const onUnauth = vi.fn();
    setOnUnauthorized(onUnauth);
    await expect(fetchTeams()).rejects.toThrow(/Unauthorized/);
    expect(clearSpy).toHaveBeenCalled();
    expect(onUnauth).toHaveBeenCalled();
    setOnUnauthorized(null);
  });

  test('removeTeam propagates API error on 400', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () =>
          Promise.resolve(JSON.stringify({ error: 'Team not found' })),
      } as Response)
    );

    await expect(removeTeam('my-team')).rejects.toThrow('Team not found');
  });

  test('fetchTickets propagates API error on 400', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve(JSON.stringify({ error: 'Invalid teamId format' })),
      } as Response)
    );

    await expect(fetchTickets('bad..id')).rejects.toThrow('Invalid teamId format');
  });

  test('fetchTicketContent propagates error on 404', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve(JSON.stringify({ error: 'Ticket not found' })),
      } as Response)
    );

    await expect(fetchTicketContent('demo-team', '9999-nonexistent')).rejects.toThrow(
      'Ticket not found'
    );
  });

  test('fetchInbox propagates API error on 4xx', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve(JSON.stringify({ error: 'Team not found' })),
      } as Response)
    );

    await expect(fetchInbox('my-team')).rejects.toThrow('Team not found');
  });

  test('fetchInbox returns inbox items on success', async () => {
    const data = [{ id: '1', title: 'Item 1' }, { id: '2', title: 'Item 2' }];
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(data),
      } as Response)
    );

    const result = await fetchInbox('my-team');
    expect(result).toEqual(data);
  });

  test('fetchHealth propagates API error on 503', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve(JSON.stringify({ error: 'Service unavailable' })),
      } as Response)
    );

    await expect(fetchHealth()).rejects.toThrow('Service unavailable');
  });

  test('fetchRecipes propagates API error on 502', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve(JSON.stringify({ error: 'OpenClaw unavailable' })),
      } as Response)
    );

    await expect(fetchRecipes()).rejects.toThrow('OpenClaw unavailable');
  });

  test('fetchRecipe propagates API error on 404', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve(JSON.stringify({ error: 'Recipe not found' })),
      } as Response)
    );

    await expect(fetchRecipe('missing-recipe')).rejects.toThrow('Recipe not found');
  });

  test('fetchInboxContent propagates API error on 404', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve(JSON.stringify({ error: 'Inbox item not found' })),
      } as Response)
    );

    await expect(fetchInboxContent('my-team', 'inbox-999')).rejects.toThrow(
      'Inbox item not found'
    );
  });

  test('scaffoldRecipeTeam propagates API error on 400', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () =>
          Promise.resolve(JSON.stringify({ error: 'Invalid teamId format' })),
      } as Response)
    );

    await expect(
      scaffoldRecipeTeam('default', 'bad..id')
    ).rejects.toThrow('Invalid teamId format');
  });

  test('moveTicket propagates API error on 400', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () =>
          Promise.resolve(
            JSON.stringify({ error: 'Actions disabled in demo mode' })
          ),
      } as Response)
    );

    await expect(
      moveTicket('demo-team', '0001', 'in-progress')
    ).rejects.toThrow('Actions disabled in demo mode');
  });

  test('assignTicket propagates API error on 400', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () =>
          Promise.resolve(JSON.stringify({ error: 'Owner not in team' })),
      } as Response)
    );

    await expect(
      assignTicket('my-team', '0001', 'unknown')
    ).rejects.toThrow('Owner not in team');
  });

  test('dispatchTicket propagates API error on 400', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () =>
          Promise.resolve(JSON.stringify({ error: 'Team not found' })),
      } as Response)
    );

    await expect(
      dispatchTicket('missing-team', 'Add feature')
    ).rejects.toThrow('Team not found');
  });
});

describe('api success paths', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('fetchTeams returns teams on success', async () => {
    const teams = [{ teamId: 'my-team', recipeId: 'dev', recipeName: 'Dev', scaffoldedAt: '2025-01-01' }];
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(teams),
      } as Response)
    );

    const result = await fetchTeams();
    expect(result).toEqual(teams);
  });

  test('fetchTickets returns tickets shape on success', async () => {
    const data = {
      teamId: 'my-team',
      tickets: [],
      backlog: [],
      inProgress: [],
      testing: [],
      done: [],
    };
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(data),
      } as Response)
    );

    const result = await fetchTickets('my-team');
    expect(result).toEqual(data);
  });

  test('fetchInboxContent returns content string on success', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ content: '# Inbox item content' }),
      } as Response)
    );

    const result = await fetchInboxContent('my-team', 'inbox-001');
    expect(result).toBe('# Inbox item content');
  });

  test('fetchTicketContent returns content string on success', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ content: '# Ticket markdown' }),
      } as Response)
    );

    const result = await fetchTicketContent('my-team', '0001');
    expect(result).toBe('# Ticket markdown');
  });

  test('moveTicket succeeds when res.ok', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response)
    );

    await expect(moveTicket('my-team', '0001', 'in-progress')).resolves.toBeUndefined();
  });

  test('assignTicket succeeds when res.ok', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response)
    );

    await expect(assignTicket('my-team', '0001', 'dev')).resolves.toBeUndefined();
  });

  test('takeTicket succeeds when res.ok', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response)
    );

    await expect(takeTicket('my-team', '0001', 'dev')).resolves.toBeUndefined();
  });

  test('handoffTicket succeeds when res.ok', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response)
    );

    await expect(handoffTicket('my-team', '0001', 'qa')).resolves.toBeUndefined();
  });

  test('completeTicket succeeds when res.ok', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response)
    );

    await expect(completeTicket('my-team', '0001')).resolves.toBeUndefined();
  });

  test('dispatchTicket succeeds when res.ok', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response)
    );

    await expect(dispatchTicket('my-team', 'Add feature')).resolves.toBeUndefined();
  });

  test('scaffoldRecipeTeam succeeds when res.ok', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response)
    );

    await expect(scaffoldRecipeTeam('default', 'my-team')).resolves.toBeUndefined();
  });

  test('scaffoldRecipeAgent succeeds when res.ok', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response)
    );

    await expect(scaffoldRecipeAgent('pm-recipe', 'pm', { name: 'PM', overwrite: true })).resolves.toBeUndefined();
  });

  test('installRecipeSkills returns result when res.ok', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, installed: ['foo'] }),
      } as Response)
    );

    const result = await installRecipeSkills('dev-team', { scope: 'global' });
    expect(result).toEqual({ ok: true, installed: ['foo'] });
  });

  test('fetchActivity returns array when res.ok', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: '1', type: 'move', message: 'Moved', timestamp: '2025-01-01' }]),
      } as Response)
    );

    const result = await fetchActivity();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty('id', '1');
    expect(result[0]).toHaveProperty('message', 'Moved');
  });

  test('fetchActivity with limit appends query param', async () => {
    let capturedUrl = '';
    vi.stubGlobal('fetch', (url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);
    });

    await fetchActivity(25);
    expect(capturedUrl).toBe('/api/activity?limit=25');
  });

  test('fetchCleanupPlan returns plan when res.ok', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            dryRun: true,
            rootDir: '/tmp',
            candidates: [{ teamId: 'smoke-001-team', absPath: '/tmp/ws' }],
            skipped: [],
          }),
      } as Response)
    );

    const result = await fetchCleanupPlan();
    expect(result).toHaveProperty('ok', true);
    expect(result).toHaveProperty('candidates');
    expect(result.candidates[0]).toHaveProperty('teamId', 'smoke-001-team');
  });

  test('executeCleanup returns result when res.ok', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            dryRun: false,
            deleted: ['/tmp/workspace-smoke-001-team'],
          }),
      } as Response)
    );

    const result = await executeCleanup();
    expect(result).toHaveProperty('ok', true);
    expect(result).toHaveProperty('deleted');
  });

  test('fetchActivity propagates API error on 500', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve(JSON.stringify({ error: 'Server error' })),
      } as Response)
    );

    await expect(fetchActivity()).rejects.toThrow('Server error');
  });

  test('fetchCleanupPlan propagates API error on 503', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve(JSON.stringify({ error: 'OpenClaw unavailable' })),
      } as Response)
    );

    await expect(fetchCleanupPlan()).rejects.toThrow('OpenClaw unavailable');
  });

  test('fetchHealth returns ok and openclaw on success', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, openclaw: true }),
      } as Response)
    );

    const result = await fetchHealth();
    expect(result).toEqual({ ok: true, openclaw: true });
  });

  test('fetchRecipes returns recipes on success', async () => {
    const recipes = [{ id: 'default', name: 'Default', source: 'builtin' }];
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(recipes),
      } as Response)
    );

    const result = await fetchRecipes();
    expect(result).toEqual(recipes);
  });

  test('fetchRecipe returns md on success', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ md: '# Recipe\nContent' }),
      } as Response)
    );

    const result = await fetchRecipe('default');
    expect(result).toEqual({ md: '# Recipe\nContent' });
  });

  test('fetchRecipeStatus returns array when API returns single object', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'dev-team',
            requiredSkills: [],
            missingSkills: [],
            installCommands: [],
          }),
      } as Response)
    );

    const result = await fetchRecipeStatus('dev-team');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('id', 'dev-team');
  });

  test('fetchRecipeStatus returns array when API returns array', async () => {
    const data = [
      { id: 'team1', requiredSkills: [], missingSkills: [], installCommands: [] },
      { id: 'team2', requiredSkills: [], missingSkills: [], installCommands: [] },
    ];
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(data),
      } as Response)
    );

    const result = await fetchRecipeStatus();
    expect(result).toBe(data);
    expect(result).toHaveLength(2);
  });

  test('removeTeam succeeds when res.ok', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response)
    );

    await expect(removeTeam('my-team-team')).resolves.toBeUndefined();
  });

  test('fetchBindings returns bindings on success', async () => {
    const bindings = [{ agentId: 'my-agent', match: { channel: 'telegram' } }];
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(bindings),
      } as Response)
    );

    const result = await fetchBindings();
    expect(result).toEqual(bindings);
  });

  test('fetchBindings propagates API error on 503', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () =>
          Promise.resolve(JSON.stringify({ error: 'OpenClaw unavailable' })),
      } as Response)
    );

    await expect(fetchBindings()).rejects.toThrow('OpenClaw unavailable');
  });

  test('addBindingAPI succeeds when res.ok', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response)
    );

    await expect(
      addBindingAPI('my-agent', { channel: 'telegram' })
    ).resolves.toBeUndefined();
  });

  test('addBindingAPI propagates API error on 400', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        text: () =>
          Promise.resolve(JSON.stringify({ error: 'Missing match.channel' })),
      } as Response)
    );

    await expect(
      addBindingAPI('my-agent', { channel: 'slack' })
    ).rejects.toThrow('Missing match.channel');
  });

  test('removeBindingAPI succeeds when res.ok', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response)
    );

    await expect(
      removeBindingAPI({ channel: 'telegram' })
    ).resolves.toBeUndefined();
  });

  test('removeBindingAPI with agentId sends body', async () => {
    let capturedBody = '';
    vi.stubGlobal('fetch', (url: string, opts?: RequestInit) => {
      capturedBody = opts?.body as string || '';
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response);
    });

    await removeBindingAPI({ channel: 'telegram' }, 'my-agent');
    const body = JSON.parse(capturedBody);
    expect(body.agentId).toBe('my-agent');
    expect(body.match).toEqual({ channel: 'telegram' });
  });

  test('installRecipeSkills with team scope sends teamId', async () => {
    let capturedBody = '';
    vi.stubGlobal('fetch', (url: string, opts?: RequestInit) => {
      capturedBody = opts?.body as string || '';
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, installed: [] }),
      } as Response);
    });

    await installRecipeSkills('dev-team', { scope: 'team', teamId: 'my-team' });
    const body = JSON.parse(capturedBody);
    expect(body.scope).toBe('team');
    expect(body.teamId).toBe('my-team');
  });

  test('installRecipeSkills with agent scope sends agentId', async () => {
    let capturedBody = '';
    vi.stubGlobal('fetch', (url: string, opts?: RequestInit) => {
      capturedBody = opts?.body as string || '';
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, installed: [] }),
      } as Response);
    });

    await installRecipeSkills('dev-team', { scope: 'agent', agentId: 'pm' });
    const body = JSON.parse(capturedBody);
    expect(body.scope).toBe('agent');
    expect(body.agentId).toBe('pm');
  });

  test('DEMO_TEAMS has expected shape', () => {
    expect(DEMO_TEAM_ID).toBe('demo-team');
    expect(DEMO_TEAMS).toHaveLength(1);
    expect(DEMO_TEAMS[0]).toHaveProperty('teamId', 'demo-team');
    expect(DEMO_TEAMS[0]).toHaveProperty('recipeId');
    expect(DEMO_TEAMS[0]).toHaveProperty('recipeName');
    expect(DEMO_TEAMS[0]).toHaveProperty('scaffoldedAt');
  });
});
