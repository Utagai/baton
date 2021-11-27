import process from 'process';

enum Environment {
  // NOTE: We don't actually have a dev environment for an app this simple.
  // Development here really just means (Local) development. AKA, actual
  // development of the app.
  Development = 'DEV',
  Production = 'PROD',
  Testing = 'TEST',
}

// TODO: We should test this guy out.
export function nodeEnvToEnvironment(): Environment {
  switch (process.env.NODE_ENV) {
    case 'production':
      return Environment.Production;
    case 'development':
      return Environment.Development;
    case 'testing':
      return Environment.Testing;
    default:
      throw Error(`unrecognized environment string: ${process.env.NODE_ENV}`);
  }
}

export default Environment;
