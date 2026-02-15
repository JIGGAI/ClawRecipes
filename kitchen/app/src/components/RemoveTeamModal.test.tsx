import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RemoveTeamModal } from './RemoveTeamModal';

describe('RemoveTeamModal', () => {
  test('shows error when error prop is set', () => {
    render(
      <RemoveTeamModal
        show
        onHide={vi.fn()}
        teamId="my-team"
        loading={false}
        error="Team delete failed"
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Team delete failed');
  });

  test('displays teamId in message', () => {
    render(
      <RemoveTeamModal
        show
        onHide={vi.fn()}
        teamId="acme-team"
        loading={false}
        error={null}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText(/workspace-acme-team/)).toBeInTheDocument();
  });
});
