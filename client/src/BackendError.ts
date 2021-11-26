class BackendError extends Error {
  respJSON: any;

  constructor(json: any) {
    super(JSON.stringify(json));

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, BackendError.prototype);

    this.respJSON = json;
  }

  responseJSON(): any {
    return this.respJSON;
  }
}

export default BackendError;
