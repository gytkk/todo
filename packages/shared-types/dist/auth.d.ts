export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserProfile {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
}
export interface JwtPayload {
    sub: string;
    email: string;
    iat: number;
    exp: number;
}
export interface CreateUserRequest {
    email: string;
    password: string;
    name: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface AuthResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        name: string;
    };
}
export interface UpdateProfileRequest {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
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
