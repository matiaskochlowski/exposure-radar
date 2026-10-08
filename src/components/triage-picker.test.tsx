import { render, screen, userEvent } from '@testing-library/react-native';

import { TriagePicker } from '@/components/triage-picker';

describe('TriagePicker', () => {
  it('exposes the statuses as a radio group with the current one selected', async () => {
    await render(<TriagePicker value="investigating" onChange={jest.fn()} />);
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(screen.getByRole('radio', { name: 'Investigating' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Mitigated' })).not.toBeSelected();
  });

  it('reports the chosen status', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    await render(<TriagePicker value="new" onChange={onChange} />);
    await user.press(screen.getByRole('radio', { name: 'Risk accepted' }));
    expect(onChange).toHaveBeenCalledWith('accepted');
  });
});
