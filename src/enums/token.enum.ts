import { Enum } from '@athenna/common'

export class TokenEnum extends Enum {
  static EMAIL = 'email'
  static PASSWORD = 'password'
  static EMAIL_PASSWORD = 'email_password'
  static CONFIRM_ACCOUNT = 'confirm_account'
}
