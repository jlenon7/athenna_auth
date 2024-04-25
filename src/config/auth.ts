export default {
  jwt: {
    secret: Env('JWT_SECRET'),
    expiresIn: Env('JWT_EXPIRATION', '1h'),
    permissions: {
      admin: {
        users: ['read', 'write', 'update', 'delete']
      },
      customer: {
        users: ['read', 'write', 'update', 'delete']
      }
    }
  }
}
