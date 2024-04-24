import { BaseMigration, type DatabaseImpl } from '@athenna/database'

export class Roles extends BaseMigration {
  public tableName = 'roles'

  public async up(db: DatabaseImpl) {
    return db.createTable(this.tableName, builder => {
      builder.increments('id')
      builder.string('name').unique().notNullable()
    })
  }

  public async down(db: DatabaseImpl) {
    return db.dropTable(this.tableName)
  }
}
