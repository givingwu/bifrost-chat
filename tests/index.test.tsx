import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ComposerStrategy } from '../src/components/composer/ComposerStrategy';

test('The button should have correct background color', async () => {
  render(
    <ComposerStrategy value="Test" channel="sms" onChange={console.log} />,
  );

  const button = screen.getByText('sms');

  expect(button).toHaveStyle({
    backgroundColor: '#ccc',
  });
});
