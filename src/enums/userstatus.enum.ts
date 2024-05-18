import { Enum } from '@athenna/common'

export class UserStatusEnum extends Enum {
  static PENDENT = 'pendent'
  static APPROVED = 'approved'
  static BLOCKED = 'blocked'
}
