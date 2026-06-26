import type { Request, Response } from "express";

import { createUser, get_by_email, updateUser } from "../db/queries/users.js";
import { BadRequestError, UserNotAuthenticatedError } from "./errors.js";
import { respondWithJSON } from "./json.js";
import { getBearerToken, hashPassword, validateJWT } from "../auth.js";
import { NewUser } from "../db/schema.js";
import { userForRefreshToken } from "../db/queries/refresh.js";
import { config } from "../config.js";

export type UserResponse = Omit<NewUser, "hashed_password">;

export async function handlerUsersCreate(req: Request, res: Response) {
    type parameters = {
        email: string;
        password: string;
    };
    const params: parameters = req.body;

    if (!params.email || !params.password) {
        throw new BadRequestError("Missing required fields");
    }

    const hash = await hashPassword(params.password);
    const user = await createUser({ email: params.email, hashedPassword: hash });

    if (!user) {
        throw new Error("Could not create user");
    }

    respondWithJSON(res, 201, {
        id: user.id,
        email: user.email,
        isChirpyRed: user.isChirpyRed,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    });
}


export async function handlerUsersUpdate(req: Request, res: Response) {
    type parameters = {
        password: string;
        email: string;
    };

    const token = getBearerToken(req);
    const subject = validateJWT(token, config.jwt.secret);

    const params: parameters = req.body;

    if (!params.password || !params.email) {
        throw new BadRequestError("Missing required fields");
    }

    const hashedPassword = await hashPassword(params.password);

    const user = await updateUser(subject, params.email, hashedPassword);

    respondWithJSON(res, 200, {
        id: user.id,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        email: user.email,
        isChirpyRed: user.isChirpyRed,
    } satisfies UserResponse);
}
