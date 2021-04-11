import axios from 'axios';
import { BACKEND_BASE_URL } from 'config';
import ApiResponse from 'models/ApiResponse';
import { UserModel } from 'models/UserModel';

export async function getUser(userId: string): Promise<UserModel> {
  const response = await axios.get<ApiResponse<{ user: UserModel }>>(
    `${BACKEND_BASE_URL}/users/${userId}`,
  );
  return response.data.result.user;
}

export async function updateUser(userData: UserModel): Promise<void> {
  await axios.put<ApiResponse<UserModel>>(
    `${BACKEND_BASE_URL}/users/${userData.id}`,
    userData,
  );
}
