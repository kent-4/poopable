import { render, screen, userEvent } from '@testing-library/react-native';
import { DesignPreview } from '../src/screens/DesignPreview';

test('saving an example updates its visible state and Reset restores it', async () => {
  const user = userEvent.setup();
  await render(<DesignPreview />);

  await user.press(screen.getByRole('button', { name: 'Save this example' }));
  expect(
    screen.getByRole('button', { name: 'Saved to preview' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Unsave preview' }),
  ).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Reset preview' }));
  expect(
    screen.getByRole('button', { name: 'Save this example' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Save preview' }),
  ).toBeOnTheScreen();
});
