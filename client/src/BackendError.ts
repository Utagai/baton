class BackendError extends Error {
  resp: any;

  constructor(json: any) {
    super(JSON.stringify(json));

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, BackendError.prototype);

    this.resp = json;
  }

  responseJSON(): string {
    return JSON.stringify(this.resp, null, 2);
  }
}

export default BackendError;
