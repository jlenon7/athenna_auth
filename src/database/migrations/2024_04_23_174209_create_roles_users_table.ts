import { BaseMigration, type DatabaseImpl } from '@athenna/database'

export class RolesUsers extends BaseMigration {
  public tableName = 'roles_users'

  public async up(db: DatabaseImpl) {
    return db.createTable(this.tableName, builder => {
      builder.increments('id')
      builder.integer('role_id').unsigned().references('id').inTable('roles')
      builder.integer('user_id').unsigned().references('id').inTable('users')
    })
  }

  public async down(db: DatabaseImpl) {
    return db.dropTable(this.tableName)
  }
}
