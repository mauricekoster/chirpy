import type { Request, Response } from "express";
import { respondWithError, respondWithJSON } from "./json.js";
import { BadRequestError, UserForbiddenError } from "./errors.js";
import { updateChirpyRed } from "../db/queries/users.js";
import { getApiKey } from "../auth.js";
import { config } from "../config.js";

export async function handlerPolkaWebhooks(req: Request, res: Response) {
    type parameters = {
        event: string;
        data: {
            userId: string;
        };
    };

    const key = getApiKey(req);
    if (config.api.polka_key !== key) {
        throw new BadRequestError("Invalid API key");
    }

    const params: parameters = req.body;
    
    if (!params.event || !params.data) {
        throw new BadRequestError("Missing required fields");
    }

    console.log(`event: ${params.event} data: ${params.data.userId}`);
    if (params.event !== "user.upgraded") {
        respondWithJSON(res, 204, null);
        return;
    }

    try {
        const user = await updateChirpyRed(params.data.userId, true);
        respondWithJSON(res, 204, null);
    } catch (err) {
        respondWithError(res, 404, "User not found");
    }
    

}