import { render, screen, userEvent } from '@testing-library/react-native';

import { FilterChip } from '@/components/filter-chip';

describe('FilterChip', () => {
  it('is a checkbox that exposes its checked state', async () => {
    await render(<FilterChip label="Ransomware" selected onToggle={jest.fn()} />);
    expect(screen.getByRole('checkbox', { name: 'Ransomware' })).toBeChecked();
  });

  it('toggles on press', async () => {
    const onToggle = jest.fn();
    const user = userEvent.setup();
    await render(<FilterChip label="Due ≤ 7d" selected={false} onToggle={onToggle} />);
    await user.press(screen.getByRole('checkbox', { name: 'Due ≤ 7d' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
