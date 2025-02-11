export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    role: string;
  };
}

export interface User {
  id: number;
  name: string;
  role: string;
}