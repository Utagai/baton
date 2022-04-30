import BackendError from './BackendError';
import FileMetadata from './FileMetadata';

export type BackendResponse<T> = {
  json: T;
  // TODO: We don't need this code, I don't think.
  statusCode: number;
};

export class BackendClient {
  // TODO: Rename this to 'hostname' for consistency.
  host: string;

  constructor(host: string) {
    this.host = host;
  }

  async wrappedFetch<T>(
    endpoint: string,
    method: string,
    body?: any,
    headers?: any,
  ): Promise<BackendResponse<T>> {
    return (
      fetch(new URL(endpoint, this.host).href, {
        method,
        credentials: 'same-origin',
        // TODO: Does setting the right content-type here, e.g., Form, help
        // with jest tests? We just had an issue where not setting the content
        // type here made MSW behave oddly...
        body,
        headers,
      })
        // A little bit of cleverness. We return a single promise that is a tuple of
        // the JSON body + status code, so that when we handle the JSON body, we have
        // the context of the response's status code to determine if the JSON body is
        // actual metadata or a document describing error.
        .then((resp) =>
          Promise.all([resp.json(), Promise.resolve(resp.status)]),
        )
        .then(([json, statusCode]: [T, number]) => {
          if (statusCode !== 200) {
            return Promise.reject(new BackendError(json));
          }
          return Promise.resolve({ json, statusCode });
        })
    );
  }

  async getMetadatas(): Promise<BackendResponse<{ files: FileMetadata[] }>> {
    return this.wrappedFetch('files', 'GET');
  }

  async upload(fileData: FormData): Promise<BackendResponse<FileMetadata>> {
    return this.wrappedFetch('upload', 'POST', fileData);
  }

  async delete(id: string): Promise<BackendResponse<{ id: string }>> {
    return this.wrappedFetch(`delete/${id}`, 'DELETE');
  }

  async login(
    username: string,
    plaintextPassword: string,
  ): Promise<BackendResponse<{ loginSuccessful: boolean }>> {
    return this.wrappedFetch(
      'login',
      'POST',
      JSON.stringify({ username, password: plaintextPassword }),
      {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
    ).then((resp) => ({
      json: { loginSuccessful: resp.statusCode === 200 },
      statusCode: resp.statusCode,
    }));
  }

  async isLoggedIn(): Promise<BackendResponse<{ isLoggedIn: boolean }>> {
    return this.wrappedFetch('isLoggedIn', 'GET').then((resp) => ({
      json: { isLoggedIn: resp.statusCode === 200 },
      statusCode: resp.statusCode,
    }));
  }
}
