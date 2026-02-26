export interface LoginResponse {
  token: string;
  user: { id: string; displayName: string; role: string };
}
