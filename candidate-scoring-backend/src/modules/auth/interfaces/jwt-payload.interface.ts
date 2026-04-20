export interface JwtPayload {
  email: string;
  sub: string; // user ID
  role: string;
}