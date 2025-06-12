import { AuthController } from '@app/auth/auth.controller';
import { USER_REGISTER_DATA } from '@test/constants/user.constants';

export async function createAndLoginUser(
  authController: AuthController,
  overrides = {},
): Promise<any> {
  const userData = {
    ...USER_REGISTER_DATA,
    ...overrides,
  };
  await authController.register(userData);
  const login = await authController.login({
    email: userData.email,
    password: userData.password,
  });
  return {
    sub: login.data?._id.toString(),
  };
}
