import process from 'process';

import Environment, { nodeEnvToEnvironment } from './Environment';

describe('node env to environment', () => {
  test('works for development', () => {
    process.env.NODE_ENV = 'development';
    expect(nodeEnvToEnvironment()).toBe(Environment.Development);
  });

  test('works for testing', () => {
    process.env.NODE_ENV = 'testing';
    expect(nodeEnvToEnvironment()).toBe(Environment.Testing);
  });

  test('works for production', () => {
    process.env.NODE_ENV = 'production';
    expect(nodeEnvToEnvironment()).toBe(Environment.Production);
  });

  test('throws for unrecognized env string', () => {
    process.env.NODE_ENV = 'lol what';
    expect(() => {
      nodeEnvToEnvironment();
    }).toThrowError(`unrecognized environment string: ${process.env.NODE_ENV}`);
  });
});
