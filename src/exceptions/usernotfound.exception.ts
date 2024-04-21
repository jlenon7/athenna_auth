import { Exception } from '@athenna/common'

export class UserNotFoundException extends Exception {
  public constructor(message: string) {
    const status = 404
    const help = undefined
    const code = 'E_USER_NOT_FOUND'

    super({ code, help, status, message })
  }
}
