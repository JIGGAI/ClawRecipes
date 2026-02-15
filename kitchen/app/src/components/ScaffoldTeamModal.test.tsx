import React from 'react';
import { describe, expect, test, vi, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScaffoldTeamModal } from './ScaffoldTeamModal';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function getModal() {
  const dialogs = screen.getAllByRole('dialog');
  return dialogs[dialogs.length - 1];
}

describe('ScaffoldTeamModal', () => {
  test('shows error when onScaffold rejects', async () => {
    const user = userEvent.setup();
    const onScaffold = vi.fn().mockRejectedValue(new Error('Scaffold failed'));
    render(
      <ScaffoldTeamModal
        recipe={{ id: 'default', name: 'Default', kind: 'recipe', source: 'builtin' }}
        onScaffold={onScaffold}
        onClose={vi.fn()}
      />
    );
    const modal = getModal();
    await user.type(within(modal).getByPlaceholderText(/my-team-team/), 'my-team-team');
    await user.click(within(modal).getByRole('button', { name: /Scaffold/ }));
    expect(await within(modal).findByRole('alert')).toHaveTextContent(/Scaffold failed/);
  });

  test('calls onScaffold and onClose when scaffold succeeds', async () => {
    const user = userEvent.setup();
    const onScaffold = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <ScaffoldTeamModal
        recipe={{ id: 'default', name: 'Default', kind: 'recipe', source: 'builtin' }}
        onScaffold={onScaffold}
        onClose={onClose}
      />
    );
    const modal = getModal();
    await user.type(within(modal).getByPlaceholderText(/my-team-team/), 'my-team-team');
    await user.click(within(modal).getByRole('button', { name: /Scaffold/ }));
    await vi.waitFor(() => {
      expect(onScaffold).toHaveBeenCalledWith('my-team-team', false);
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('onClose called when Cancel clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ScaffoldTeamModal
        recipe={{ id: 'default', name: 'Default', kind: 'recipe', source: 'builtin' }}
        onScaffold={vi.fn()}
        onClose={onClose}
      />
    );
    const modal = getModal();
    await user.click(within(modal).getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
