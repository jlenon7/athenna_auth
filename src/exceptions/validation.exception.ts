import { Exception } from '@athenna/common'

export class ValidationException extends Exception {
  public constructor(errors: any[]) {
    const status = 422
    const message = 'Validation failure'
    const code = 'E_VALIDATION_ERROR'
    const details = errors

    super({ code, status, message, details })
  }
}
