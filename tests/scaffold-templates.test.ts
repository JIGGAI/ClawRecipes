import { describe, expect, test } from 'vitest';
import { renderTeamMd, renderTicketsMd } from '../src/lib/scaffold-templates';

describe('scaffold templates', () => {
  test('TEAM.md contains canonical workflow and testing lane', () => {
    const md = renderTeamMd('my-team');
    expect(md).toContain('# my-team');
    expect(md).toMatch(/Stages:\s*backlog\s*→\s*in-progress\s*→\s*testing\s*→\s*done/i);
    expect(md).toMatch(/work\/testing\//);
  });

  test('TICKETS.md contains QA handoff language and testing lane', () => {
    const md = renderTicketsMd('my-team');
    expect(md).toMatch(/Stages:\s*backlog\s*→\s*in-progress\s*→\s*testing\s*→\s*done/i);
    expect(md).toMatch(/work\/testing\//);
    expect(md).toMatch(/Owner:\s*test/i);
    expect(md).toMatch(/Move the ticket file to work\/testing\//i);
  });
});
