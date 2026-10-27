import { describe, expect, test } from 'vitest';
import { normalizeCronJobs, parseFrontmatter } from '../src/lib/recipe-frontmatter';

describe('recipe frontmatter parsing/validation', () => {
  test('parseFrontmatter requires starting --- and id', () => {
    expect(() => parseFrontmatter('nope')).toThrow(/must start with YAML frontmatter/);

    const md = `---\nname: x\n---\nbody`;
    expect(() => parseFrontmatter(md)).toThrow(/must include id/);
  });

  test('normalizeCronJobs validates required fields and duplicate ids', () => {
    expect(normalizeCronJobs({})).toEqual([]);

    expect(() => normalizeCronJobs({ cronJobs: {} as any })).toThrow(/must be an array/);

    expect(() =>
      normalizeCronJobs({
        cronJobs: [{ id: 'a', schedule: '* * * * *', message: 'hi' }, { id: 'a', schedule: '* * * * *', message: 'hi' }],
      }),
    ).toThrow(/Duplicate cronJobs\[\]\.id/);

    expect(() => normalizeCronJobs({ cronJobs: [{ id: 'x', schedule: '', message: 'm' }] })).toThrow(/schedule is required/);
    expect(() => normalizeCronJobs({ cronJobs: [{ id: 'x', schedule: '* * * * *', message: '' }] })).toThrow(/requires message or command/);
    expect(() => normalizeCronJobs({ cronJobs: [{ id: 'x', schedule: '* * * * *', message: 'm', command: 'echo x' }] })).toThrow(/cannot define both/);

    const out = normalizeCronJobs({ cronJobs: [{ id: 'job', schedule: '* * * * *', message: 'ping' }] });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('job');
    expect(out[0].message).toBe('ping');

    const command = normalizeCronJobs({
      cronJobs: [{ id: 'backup', schedule: '0 0 * * *', command: './backup.sh', commandCwd: '/workspace' }],
    });
    expect(command[0]).toEqual(expect.objectContaining({ command: './backup.sh', commandCwd: '/workspace' }));
  });

  test('normalizeCronJobs accepts task and prompt as message fallback', () => {
    const withTask = normalizeCronJobs({
      cronJobs: [{ id: 't', schedule: '* * * * *', task: 'run task' }],
    });
    expect(withTask[0].message).toBe('run task');

    const withPrompt = normalizeCronJobs({
      cronJobs: [{ id: 'p', schedule: '* * * * *', prompt: 'run prompt' }],
    });
    expect(withPrompt[0].message).toBe('run prompt');

    const messageWins = normalizeCronJobs({
      cronJobs: [{ id: 'm', schedule: '* * * * *', message: 'msg', task: 'task' }],
    });
    expect(messageWins[0].message).toBe('msg');
  });
});
