import { UserLangEnum } from '#src/enums/userlang.enum'
import { UserStatusEnum } from '#src/enums/userstatus.enum'
import { BaseMigration, type DatabaseImpl } from '@athenna/database'

export class Users extends BaseMigration {
  public tableName = 'users'

  public async up(db: DatabaseImpl) {
    return db.createTable(this.tableName, builder => {
      builder.increments('id')
      builder.string('name').notNullable()
      builder.string('email').unique().notNullable()
      builder.string('cellphone').unique()
      builder.string('password').notNullable()
      builder.timestamp('email_verified_at').defaultTo(null)
      builder.timestamp('cellphone_verified_at').defaultTo(null)
      builder.enum('lang', UserLangEnum.values()).defaultTo(UserLangEnum.PT)
      builder.timestamps(true, true, false)
      builder.timestamp('deleted_at').defaultTo(null)
      builder
        .enum('status', UserStatusEnum.values())
        .defaultTo(UserStatusEnum.PENDENT)
    })
  }

  public async down(db: DatabaseImpl) {
    return db.dropTable(this.tableName)
  }
}
