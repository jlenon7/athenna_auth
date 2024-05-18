import { User } from '#src/models/user'
import { NotFoundException } from '@athenna/http'
import { Column, BaseModel, BelongsTo, type Relation } from '@athenna/database'

export class Token extends BaseModel {
  @Column()
  public id: number

  @Column({ isNullable: false })
  public type: string

  @Column({ isNullable: false })
  public token: string

  @Column({ name: 'user_id' })
  public userId: number

  @Column()
  public value: string

  @Column({ name: 'created_at', isCreateDate: true })
  public createdAt: Date

  @Column({ name: 'updated_at', isUpdateDate: true })
  public updatedAt: Date

  @BelongsTo(() => User)
  public user: Relation<User>

  public static async definition(): Promise<Partial<Token>> {
    return {
      token: this.faker.string.uuid()
    }
  }

  public static async findOrThrowNotFound(token: string): Promise<Token> {
    return Token.findOr({ token }, () => {
      throw new NotFoundException(`Not found any user with token ${token}.`)
    })
  }
}
