import { Request, Response, NextFunction } from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                username: string;
                role: string;
            };
            startTime?: number;
        }

        interface Response {
            success?: boolean;
            data?: any;
            error?: string;
            message?: string;
        }
    }
}

export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        username: string;
        role: string;
    };
}

export interface ApiRequest extends Request {
    query: {
        path?: string;
        [key: string]: string | undefined;
    };
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp?: string;
    requestId?: string;
}
