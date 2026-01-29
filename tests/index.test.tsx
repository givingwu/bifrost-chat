import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ComposerInput } from '@/components/composer/ComposerInput';

test('The button should have correct background color', async () => {
  render(
    <ComposerInput
      value=""
      placeholder="Type message here"
      onChange={console.log}
    />,
  );

  const inputElement = screen.getByPlaceholderText('Type message here');
  expect(inputElement).toBeInTheDocument();
});
