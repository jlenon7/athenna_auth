import bcrypt from 'bcrypt'
import { User } from '#src/models/user'
import { NotFoundException } from '@athenna/http'
import { UserService } from '#src/services/user.service'
import { Database, DatabaseProvider } from '@athenna/database'
import { Test, type Context, Mock, BeforeEach, AfterEach } from '@athenna/test'

export default class UserServiceTest {
  @BeforeEach()
  public beforeEach() {
    new DatabaseProvider().register()
  }

  @AfterEach()
  public afterEach() {
    Mock.restoreAll()
  }

  @Test()
  public async shouldBeAbleToGetAllUsers({ assert }: Context) {
    const fakeUsers = await User.factory().count(10).make()

    Mock.when(Database.driver, 'findMany').resolve(fakeUsers)

    const users = await new UserService().getAll()

    assert.deepEqual(users.athenna.toJSON(), fakeUsers.athenna.toJSON())
  }

  @Test()
  public async shouldBeAbleToCreateAnUser({ assert }: Context) {
    const userToCreate = {
      name: 'João Lenon',
      email: 'lenon@athenna.io',
      password: '12345'
    }
    const fakeUser = await User.factory().count(1).make(userToCreate)

    Mock.when(Database.driver, 'find').resolve(undefined)
    Mock.when(Database.driver, 'createMany').resolve([fakeUser])

    const user = await new UserService().create(userToCreate)

    assert.deepEqual(user.toJSON(), fakeUser.toJSON())
    assert.calledWith(Database.driver.createMany, [
      {
        password: await bcrypt.hash(userToCreate.password, 10),
        ...userToCreate
      }
    ])
  }

  @Test()
  public async shouldBeAbleToGetAnUserById({ assert }: Context) {
    const fakeUser = await User.factory().count(1).make()

    Mock.when(Database.driver, 'where').returnThis()
    Mock.when(Database.driver, 'find').resolve(fakeUser)

    const user = await new UserService().getById(1)

    assert.deepEqual(user.toJSON(), fakeUser.toJSON())
    assert.calledWith(Database.driver.where, 'id', 1)
  }

  @Test()
  public async shouldThrowNotFoundExceptionIfIdDoesNotExist({ assert }: Context) {
    Mock.when(Database.driver, 'find').resolve(undefined)

    await assert.rejects(() => new UserService().getById(1), NotFoundException)
  }

  @Test()
  public async shouldBeAbleToGetAnUserByEmail({ assert }: Context) {
    const fakeUser = await User.factory().count(1).make()

    Mock.when(Database.driver, 'where').returnThis()
    Mock.when(Database.driver, 'find').resolve(fakeUser)

    const user = await new UserService().getByEmailSafe('lenon@athenna.io')

    assert.deepEqual(user.toJSON(), fakeUser.toJSON())
    assert.calledWith(Database.driver.where, 'email', 'lenon@athenna.io')
  }

  @Test()
  public async shouldBeAbleToUpdateAnUser({ assert }: Context) {
    const userToUpdate = {
      name: 'João Lenon',
      email: 'lenon@athenna.io'
    }
    const fakeUser = await User.factory().count(1).make(userToUpdate)

    Mock.when(Database.driver, 'find').resolve(undefined)
    Mock.when(Database.driver, 'update').resolve(fakeUser)

    await new UserService().update(1, userToUpdate)

    assert.calledWith(Database.driver.update, { name: userToUpdate.name, email: userToUpdate.email })
  }

  @Test()
  public async shouldNotBeAbleToUpdateUserPassword({ assert }: Context) {
    const userToUpdate = {
      name: 'João Lenon',
      email: 'lenon@athenna.io',
      password: '12345'
    }
    const fakeUser = await User.factory().count(1).make(userToUpdate)

    Mock.when(Database.driver, 'find').resolve(undefined)
    Mock.when(Database.driver, 'update').resolve(fakeUser)

    await new UserService().update(1, userToUpdate)

    assert.calledWith(Database.driver.update, { name: userToUpdate.name, email: userToUpdate.email })
  }

  @Test()
  public async shouldBeAbleToDeleteAnUser({ assert }: Context) {
    Mock.when(Database.driver, 'where').returnThis()
    Mock.when(Database.driver, 'delete').resolve(undefined)

    await new UserService().delete(1)

    assert.calledWith(Database.driver.where, 'id', 1)
  }
}
