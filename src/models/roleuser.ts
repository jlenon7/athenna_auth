import { User } from '#src/models/user'
import { Role } from '#src/models/role'
import { Column, BaseModel, BelongsTo, type Relation } from '@athenna/database'

export class RoleUser extends BaseModel {
  public static table() {
    return 'roles_users'
  }

  @Column()
  public id: number

  @Column({ name: 'user_id' })
  public userId: number

  @Column({ name: 'role_id' })
  public roleId: number

  @BelongsTo(() => User)
  public user: Relation<User>

  @BelongsTo(() => Role)
  public role: Relation<Role>
}
