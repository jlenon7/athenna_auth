import { Uuid } from '@athenna/common'
import { User } from '#src/models/user'
import { RoleEnum } from '#src/enums/role.enum'
import { NotFoundException } from '@athenna/http'
import { UserService } from '#src/services/user.service'
import { Database, DatabaseProvider } from '@athenna/database'
import { Test, type Context, Mock, BeforeEach, AfterEach } from '@athenna/test'

export default class UserServiceTest {
  @BeforeEach()
  public beforeEach() {
    Config.set('database.default', 'fake')

    new DatabaseProvider().register()
  }

  @AfterEach()
  public afterEach() {
    Config.set('database.default', Env('DB_CONNECTION', 'postgres'))

    Mock.restoreAll()
  }

  @Test()
  public async shouldBeAbleToGetAllUsers({ assert }: Context) {
    const fakeUsers = await User.factory().count(10).make()

    Mock.when(Database.driver, 'findMany').resolve(fakeUsers)
    const users = await new UserService().getAll()

    assert.deepEqual(users.data.athenna.toJSON(), fakeUsers.athenna.toJSON())
  }

  @Test()
  public async shouldBeAbleToCreateAnUser({ assert }: Context) {
    const userToCreate = {
      name: 'João Lenon',
      email: 'lenon@athenna.io',
      password: '12345'
    }
    const fakeUser = await User.factory().count(1).make(userToCreate)

    Mock.when(Database.driver, 'find').resolve({ id: 1, name: RoleEnum.CUSTOMER })
    Mock.when(Database.driver, 'createMany').resolve([fakeUser])

    const user = await new UserService().create(userToCreate)

    assert.deepEqual(user.toJSON(), fakeUser.toJSON())
    assert.calledWithMatch(Database.driver.createMany, [Mock.match(userToCreate)])
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

    const user = await new UserService().getByEmail('lenon@athenna.io')

    assert.deepEqual(user.toJSON(), fakeUser.toJSON())
    assert.calledWith(Database.driver.where, 'email', 'lenon@athenna.io')
  }

  @Test()
  public async shouldThrowNotFoundExceptionIfEmailDoesNotExist({ assert }: Context) {
    Mock.when(Database.driver, 'find').resolve(undefined)

    await assert.rejects(() => new UserService().getByEmail('lenon@athenna.io'), NotFoundException)
  }

  @Test()
  public async shouldBeAbleToGetAnUserBytoken({ assert }: Context) {
    const fakeUser = await User.factory().count(1).make()

    Mock.when(Database.driver, 'where').returnThis()
    Mock.when(Database.driver, 'find').resolve(fakeUser)

    const token = Uuid.generate()
    const user = await new UserService().getByToken(token)

    assert.deepEqual(user.toJSON(), fakeUser.toJSON())
    assert.calledWith(Database.driver.where, 'token', token)
  }

  @Test()
  public async shouldThrowNotFoundExceptionIftokenDoesNotExist({ assert }: Context) {
    Mock.when(Database.driver, 'find').resolve(undefined)

    await assert.rejects(() => new UserService().getByToken(Uuid.generate()), NotFoundException)
  }

  @Test()
  public async shouldBeAbleToUpdateAnUser({ assert }: Context) {
    const userToUpdate = {
      name: 'João Lenon'
    }
    const fakeUser = await User.factory().count(1).make(userToUpdate)

    Mock.when(Database.driver, 'find').resolve(fakeUser)
    Mock.when(Database.driver, 'update').resolve(fakeUser)

    await new UserService().update(1, userToUpdate)

    assert.calledWithMatch(Database.driver.update, { name: userToUpdate.name })
  }

  @Test()
  public async shouldNotBeAbleToUpdateUserEmail({ assert }: Context) {
    const userToUpdate = {
      name: 'João Lenon',
      email: 'lenon@athenna.io'
    }
    const fakeUser = await User.factory().count(1).make(userToUpdate)

    Mock.when(Database.driver, 'find').resolve(fakeUser)
    Mock.when(Database.driver, 'update').resolve(fakeUser)

    await new UserService().update(1, userToUpdate)

    assert.calledWithMatch(Database.driver.update, { name: userToUpdate.name })
    assert.notCalledWithMatch(Database.driver.update, { email: userToUpdate.email })
  }

  @Test()
  public async shouldNotBeAbleToUpdateUserPassword({ assert }: Context) {
    const userToUpdate = {
      name: 'João Lenon',
      password: '12345'
    }
    const fakeUser = await User.factory().count(1).make(userToUpdate)

    Mock.when(Database.driver, 'find').resolve(fakeUser)
    Mock.when(Database.driver, 'update').resolve(fakeUser)

    await new UserService().update(1, userToUpdate)

    assert.calledWithMatch(Database.driver.update, { name: userToUpdate.name })
    assert.notCalledWithMatch(Database.driver.update, { password: userToUpdate.password })
  }

  @Test()
  public async shouldBeAbleToDeleteAnUser({ assert }: Context) {
    Mock.when(Database.driver, 'where').returnThis()
    Mock.when(Database.driver, 'update').resolve(undefined)

    await new UserService().delete(1)

    assert.calledTimes(Database.driver.update, 1)
  }
}
