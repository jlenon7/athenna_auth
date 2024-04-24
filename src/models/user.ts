import { Role } from '#src/models/role'
import { RoleUser } from '#src/models/roleuser'
import { Column, BaseModel, BelongsToMany } from '@athenna/database'

export class User extends BaseModel {
  @Column()
  public id: number

  @Column({ isNullable: false })
  public name: string

  @Column({ isUnique: true, isNullable: false })
  public email: string

  @Column({ isHidden: true, isNullable: false })
  public password: string

  @BelongsToMany(() => Role, () => RoleUser)
  public roles: Role[]

  public static attributes(): Partial<User> {
    return {}
  }

  public static async definition(): Promise<Partial<User>> {
    return {
      name: this.faker.person.firstName(),
      email: this.faker.internet.email(),
      password: this.faker.internet.password()
    }
  }
}
