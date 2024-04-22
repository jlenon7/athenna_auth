import { Exception } from '@athenna/common'

export class ValidationException extends Exception {
  public constructor(error: any) {
    const status = error.status
    const message = 'Validation failure'
    const code = 'E_VALIDATION_ERROR'
    const details = error.messages

    super({ code, status, message, details })
  }
}
