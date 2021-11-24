import FileMetadata from './FileMetadata';

// TODO for when we are back:
// * How exactly does CSRF token prevent CSRF?
// * How is CSURF doing things such that it accomplishes the requirements of
// bullet 1?

export type BackendResponse = {
  jsonResponse: any;
  statusCode: number;
};

export class BackendClient {
  host: string;

  antiCSRFToken: string;

  constructor(host: string, antiCSRFToken: string) {
    this.host = host;
    this.antiCSRFToken = antiCSRFToken;
  }

  async wrappedFetch(
    endpoint: string,
    method: string,
    body?: any,
  ): Promise<BackendResponse> {
    console.log(
      new URL(endpoint, this.host).href,
      'returning fetch with csrf token: ',
      this.antiCSRFToken,
    );
    return (
      fetch(new URL(endpoint, this.host).href, {
        method,
        credentials: 'same-origin',
        headers: {
          // TODO: Does setting the right content-type here, e.g., Form, help
          // with jest tests?
          'X-CSRF-TOKEN': this.antiCSRFToken,
        },
        body,
      })
        // A little bit of cleverness. We return a single promise that is a tuple of
        // the JSON body + status code, so that when we handle the JSON body, we have
        // the context of the response's status code to determine if the JSON body is
        // actual metadata or a document describing error.
        .then((resp) => {
          console.log('issued request to ', new URL(endpoint, this.host).href);
          console.log('resp: ', resp!.body);
          return Promise.all([resp.json(), Promise.resolve(resp.status)]);
        })
        .then(([jsonResponse, statusCode]: [any, number]) => {
          if (statusCode !== 200) {
            return Promise.reject(new Error(jsonResponse.toString()));
          }
          return Promise.resolve({ jsonResponse, statusCode });
        })
    );
  }

  async getMetadatas(): Promise<FileMetadata[]> {
    return this.wrappedFetch('/files', 'GET').then(
      (resp) => resp.jsonResponse.files,
    );
  }

  async upload(data: FormData): Promise<FileMetadata> {
    return this.wrappedFetch('/upload', 'POST', data).then(
      (resp) => resp.jsonResponse,
    );
  }

  async delete(id: string): Promise<{ id: string }> {
    return this.wrappedFetch(`/delete/${id}`, 'DELETE').then(
      (resp) => resp.jsonResponse,
    );
  }

  async deleteExpired(): Promise<BackendResponse> {
    return this.wrappedFetch('/deleteexpired', 'DELETE');
  }
}
