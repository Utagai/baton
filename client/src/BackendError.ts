class BackendError extends Error {
  jsonResp: any;

  code: number;

  constructor(json: any, statusCode: number) {
    super(JSON.stringify(json));

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, BackendError.prototype);

    this.jsonResp = json;
    this.code = statusCode;
  }

  json(): any {
    return this.jsonResp;
  }

  statusCode(): number {
    return this.code;
  }
}

export default BackendError;
