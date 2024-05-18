import bcrypt from 'bcrypt'
import { Uuid } from '@athenna/common'
import { Role } from '#src/models/role'
import { Token } from '#src/models/token'
import { RoleUser } from '#src/models/roleuser'
import { Column, BaseModel, BelongsToMany, HasMany } from '@athenna/database'
import { TokenEnum } from '#src/enums/token.enum'

export class User extends BaseModel {
  @Column()
  public id: number

  @Column({ isNullable: false })
  public name: string

  @Column({ isUnique: true, isNullable: false })
  public email: string

  @Column({ isUnique: true })
  public cellphone: string

  @Column({ isHidden: true, isNullable: false })
  public password: string

  @Column({ name: 'email_verified_at' })
  public emailVerifiedAt: Date

  @Column({ name: 'cellphone_verified_at' })
  public cellphoneVerifiedAt: Date

  @Column({ name: 'created_at', isCreateDate: true })
  public createdAt: Date

  @Column({ name: 'updated_at', isUpdateDate: true })
  public updatedAt: Date

  @Column({ name: 'deleted_at', isDeleteDate: true })
  public deletedAt: Date

  @HasMany(() => Token)
  public tokens: Token[]

  @BelongsToMany(() => Role, () => RoleUser)
  public roles: Role[]

  public isEmailEqual(email: string) {
    /**
     * If there are no email to validate,
     * it means no change is going to be made.
     */
    if (!email) {
      return true
    }

    return this.email === email
  }

  public isPasswordEqual(password: string) {
    /**
     * If there are no password to validate,
     * it means no change is going to be made.
     */
    if (!password) {
      return true
    }

    return bcrypt.compareSync(password, this.password)
  }

  public async confirmToken() {
    const token = await Token.create({
      userId: this.id,
      type: TokenEnum.CONFIRM_ACCOUNT,
      token: Uuid.generate()
    })

    return token.token
  }

  public async resetEmailToken(email: string) {
    const token = await Token.create({
      value: email,
      userId: this.id,
      type: TokenEnum.EMAIL,
      token: Uuid.generate()
    })

    return token.token
  }

  public async resetPasswordToken(password: string) {
    const token = await Token.create({
      value: password,
      userId: this.id,
      type: TokenEnum.PASSWORD,
      token: Uuid.generate()
    })

    return token.token
  }

  public async resetEmailPasswordToken(email: string, password: string) {
    const token = await Token.create({
      value: JSON.stringify([email, password]),
      userId: this.id,
      type: TokenEnum.PASSWORD,
      token: Uuid.generate()
    })

    return token.token
  }

  public static async definition(): Promise<Partial<User>> {
    return {
      name: this.faker.person.firstName(),
      email: this.faker.internet.email(),
      password: await bcrypt.hash('12345', 10)
    }
  }
}
