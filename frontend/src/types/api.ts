export interface User {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** Mirrors com.backend.Parkshare.dto.LoginResponse — token is "Bearer <jwt>". */
export interface LoginResponse {
  token: string;
  name: string;
}
