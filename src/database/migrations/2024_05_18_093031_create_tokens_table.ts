import { TokenEnum } from '#src/enums/token.enum'
import { BaseMigration, type DatabaseImpl } from '@athenna/database'

export class Tokens extends BaseMigration {
  public tableName = 'tokens'

  public async up(db: DatabaseImpl) {
    return db.createTable(this.tableName, builder => {
      builder.increments('id')
      builder.integer('user_id').unsigned().references('id').inTable('users')
      builder.enum('type', TokenEnum.values()).notNullable()
      builder.string('token').notNullable()
      builder.string('value').nullable()
      builder.timestamps(true, true, false)
    })
  }

  public async down(db: DatabaseImpl) {
    return db.dropTable(this.tableName)
  }
}
