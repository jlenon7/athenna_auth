import { BaseMigration, type DatabaseImpl } from '@athenna/database'

export class Users extends BaseMigration {
  public tableName = 'users'

  public async up(db: DatabaseImpl) {
    return db.createTable(this.tableName, builder => {
      builder.increments('id')
      builder.string('name').notNullable()
      builder.string('email').unique().notNullable()
      builder.string('password').notNullable()
      builder.string('email_token').notNullable()
      builder.timestamp('email_verified_at').defaultTo(null)
      builder.timestamps(true, true, false)
      builder.timestamp('deleted_at').defaultTo(null)
    })
  }

  public async down(db: DatabaseImpl) {
    return db.dropTable(this.tableName)
  }
}
