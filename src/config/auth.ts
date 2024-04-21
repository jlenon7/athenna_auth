export default {
  jwt: {
    secret: Env('JWT_SECRET'),
    expiresIn: Env('JWT_EXPIRATION', '1h')
  }
}
