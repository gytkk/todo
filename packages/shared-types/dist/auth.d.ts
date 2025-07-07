export interface User {
    id: string;
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    emailVerified: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserProfile {
    id: string;
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    emailVerified: boolean;
    createdAt: Date;
}
export interface JwtPayload {
    sub: string;
    email: string;
    iat: number;
    exp: number;
}
export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username?: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: UserProfile;
}
export interface RefreshTokenRequest {
    refreshToken: string;
}
export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
}
export interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
    username?: string;
}
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
export interface ForgotPasswordRequest {
    email: string;
}
export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}
export interface UpdateProfileResponse {
    user: UserProfile;
}
export interface AuthError {
    statusCode: number;
    message: string;
    error: string;
}
export interface ValidationError {
    statusCode: number;
    message: string[];
    error: string;
}
