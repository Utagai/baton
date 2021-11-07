import { render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  test('renders correctly', () => {
    const buttonText = 'this is a test';
    render(
      <Button ariaLabel="test" onClick={() => {}}>
        {buttonText}
      </Button>,
    );

    const button = screen.getByText(buttonText);
    expect(button).toBeInTheDocument();
  });

  test('calls on click handler on click', (done) => {
    const testCallback = () => {
      done();
    };

    const buttonText = 'this is a test';
    render(
      <Button ariaLabel="test" onClick={testCallback}>
        {buttonText}
      </Button>,
    );

    const button = screen.getByText(buttonText);
    button.click();
  });
});
