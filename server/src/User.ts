import { PasswordHashInfo } from './Password';

type User = {
  username: string;
  passwordHashInfo: PasswordHashInfo;
};

export default User;
