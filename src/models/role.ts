import { User } from '#src/models/user'
import { RoleUser } from '#src/models/roleuser'
import { Column, BaseModel, BelongsToMany } from '@athenna/database'

export class Role extends BaseModel {
  @Column()
  public id: number

  @Column({ isUnique: true })
  public name: string

  @BelongsToMany(() => User, () => RoleUser)
  public users: User[]

  public static async definition(): Promise<Partial<Role>> {
    return {
      name: this.faker.person.jobType()
    }
  }
}
