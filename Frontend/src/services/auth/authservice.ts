import axios from 'axios';
import { AUTH_BASE_URL } from 'config';
import ApiResponse from 'models/ApiResponse';
import { UserModel } from 'models/UserModel';
import jwtDecode from 'jwt-decode';

type TokenResponse = ApiResponse<{
  accessToken: string;
  refreshToken: string;
}>;

export async function signIn(email: string, password: string): Promise<string> {
  try {
    const authResult = await axios.post<TokenResponse>(
      `${AUTH_BASE_URL}/auth`,
      {
        email,
        password,
      },
    );

    const { accessToken, refreshToken } = authResult.data.result;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    const { userId } = jwtDecode(accessToken) as { userId: string };
    return userId;
  } catch (err) {
    console.log(err);
    throw new Error('Authentication error');
  }
}

export async function signUp(userData: UserModel): Promise<void> {
  try {
    await axios.post<ApiResponse<void>>(`${AUTH_BASE_URL}/register`, userData);
  } catch (err) {
    console.log(err);
    throw new Error('Signup error');
  }
}

export async function signOut(): Promise<void> {
  try {
    await axios.post<ApiResponse<void>>(`${AUTH_BASE_URL}/logout`);
  } catch (err) {
    console.log(err);
    throw new Error('Logout error');
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

export function getSignedInUserId(): string | undefined {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    return undefined;
  }

  const { userId } = jwtDecode(accessToken) as { userId: string };

  return userId;
}

export async function refreshAccessToken(): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const currentRefreshToken = localStorage.getItem('refreshToken');

  try {
    const refreshResult = await axios.post<TokenResponse>(
      `${AUTH_BASE_URL}/renew`,
      undefined,
      {
        headers: {
          Authorization: `Bearer ${currentRefreshToken}`,
        },
      },
    );

    const { accessToken, refreshToken } = refreshResult.data.result;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    return refreshResult.data.result;
  } catch (err) {
    console.log(err);
    throw new Error('Token refresh error');
  }
}
