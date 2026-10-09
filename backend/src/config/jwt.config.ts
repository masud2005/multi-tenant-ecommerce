import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET || 'your_super_secret_jwt_access_key',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_super_secret_jwt_refresh_key',
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '5d',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
}));