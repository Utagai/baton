import BackendError from './BackendError';
import FileMetadata from './FileMetadata';

// TODO for when we are back:
// * How exactly does CSRF token prevent CSRF?
// * How is CSURF doing things such that it accomplishes the requirements of
// bullet 1?

export type BackendResponse<T> = {
  json: T;
  statusCode: number;
};

export class BackendClient {
  host: string;

  constructor(host: string) {
    this.host = host;
  }

  async wrappedFetch<T>(
    endpoint: string,
    method: string,
    body?: any,
  ): Promise<BackendResponse<T>> {
    return (
      fetch(new URL(endpoint, this.host).href, {
        method,
        credentials: 'same-origin',
        // TODO: Does setting the right content-type here, e.g., Form, help
        // with jest tests?
        body,
      })
        // A little bit of cleverness. We return a single promise that is a tuple of
        // the JSON body + status code, so that when we handle the JSON body, we have
        // the context of the response's status code to determine if the JSON body is
        // actual metadata or a document describing error.
        .then((resp) =>
          Promise.all([resp.json(), Promise.resolve(resp.status)]),
        )
        .then(([json, statusCode]: [any, number]) => {
          if (statusCode !== 200) {
            return Promise.reject(new BackendError(json, statusCode));
          }
          return Promise.resolve({ json, statusCode });
        })
    );
  }

  async getMetadatas(): Promise<BackendResponse<{ files: FileMetadata[] }>> {
    return this.wrappedFetch('/files', 'GET');
  }

  async upload(data: FormData): Promise<BackendResponse<FileMetadata>> {
    return this.wrappedFetch('/upload', 'POST', data);
  }

  async delete(id: string): Promise<BackendResponse<{ id: string }>> {
    return this.wrappedFetch(`/delete/${id}`, 'DELETE');
  }

  async deleteExpired(): Promise<BackendResponse<{}>> {
    return this.wrappedFetch('/deleteexpired', 'DELETE');
  }
}
