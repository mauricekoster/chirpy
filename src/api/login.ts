import type { Request, Response } from "express";
import { config } from "../config.js";
import { get_by_email } from "../db/queries/users.js";
import { BadRequestError, UserNotAuthenticatedError } from "./errors.js";
import {
    checkPasswordHash,
    getBearerToken,
    makeJWT,
    makeRefreshToken,
} from "../auth.js";
import { respondWithJSON } from "./json.js";
import { UserResponse } from "./users.js";
import {
    revokeRefreshToken,
    saveRefreshToken,
    userForRefreshToken,
} from "../db/queries/refresh.js";


type LoginResponse = UserResponse & {
    token: string;
    refreshToken: string;
};

export async function handlerLogin(req: Request, res: Response) {
    type parameters = {
        email: string;
        password: string;
    };
    const params: parameters = req.body;

    if (!params.email || !params.password) {
        throw new BadRequestError("Missing required fields");
    }

    const user = await get_by_email(params.email);
    if (!user) {
        throw new UserNotAuthenticatedError("incorrect email or password");
    }
    const matching = await checkPasswordHash(
        params.password,
        user.hashedPassword,
    );
    if (!matching) {
        throw new UserNotAuthenticatedError("incorrect email or password");
    }

    const accessToken = makeJWT(
        user.id,
        config.jwt.defaultDuration,
        config.jwt.secret
    );
    const refreshToken = makeRefreshToken();

    const saved = await saveRefreshToken(user.id, refreshToken);
    if (!saved) {
        throw new UserNotAuthenticatedError("could not save refresh token");
    }

    respondWithJSON(res, 200, {
        id: user.id,
        email: user.email,
        isChirpyRed: user.isChirpyRed,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        token: accessToken,
        refreshToken: refreshToken,
    } satisfies LoginResponse);

}


export async function handlerRefresh(req: Request, res: Response) {
    let refreshToken = getBearerToken(req);

    const result = await userForRefreshToken(refreshToken);
    if (!result) {
        throw new UserNotAuthenticatedError("invalid refresh token");
    }

    const user = result.user;
    const accessToken = makeJWT(
        user.id,
        config.jwt.defaultDuration,
        config.jwt.secret,
    );

    type response = {
        token: string;
    };

    respondWithJSON(res, 200, {
        token: accessToken,
    } satisfies response);
}

export async function handlerRevoke(req: Request, res: Response) {
    const refreshToken = getBearerToken(req);
    await revokeRefreshToken(refreshToken);
    res.status(204).send();
}
