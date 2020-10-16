import { KeyChain } from '../../utils/json-tree';

export class OpenApiValidationError extends Error {

  public missingRequestProperties: Array<KeyChain>;
  public missingResponseProperties: Array<KeyChain>;

  constructor(message?: string, missingRequestProperties: Array<KeyChain> = [], missingResponseProperties: Array<KeyChain> = []) {
      super(message);
      this.missingRequestProperties = missingRequestProperties;
      this.missingResponseProperties = missingResponseProperties;
      // Set the prototype explicitly.
      Object.setPrototypeOf(this, OpenApiValidationError.prototype);
  }
}

export class AsyncApiValidationError extends Error {

  public missingMessageProperties: Array<KeyChain>;

  constructor(message?: string, missingMessageProperties: Array<KeyChain> = []) {
      super(message);
      this.missingMessageProperties = missingMessageProperties;
      // Set the prototype explicitly.
      Object.setPrototypeOf(this, AsyncApiValidationError.prototype);
  }
}
