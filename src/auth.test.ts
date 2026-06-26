import { describe, it, expect, beforeAll } from "vitest";
import { getMockReq, getMockRes } from 'vitest-mock-express';
import { hashPassword, checkPasswordHash, makeJWT, validateJWT, getBearerToken, extractBearerToken} from "./auth.js";
import { BadRequestError } from "./api/errors.js";

describe("Password Hashing", () => {
    const password1 = "correctPassword123!";
    const password2 = "anotherPassword456!";
    let hash1: string;
    let hash2: string;
    let jwt1: string;

    beforeAll(async () => {
        hash1 = await hashPassword(password1);
        hash2 = await hashPassword(password2);

        jwt1 = makeJWT("user-1", 10000, password1);
    });

    it("should return true for the correct password", async () => {
        const result = await checkPasswordHash(password1, hash1);
        expect(result).toBe(true);
    });

    it("should return correct user id for token with password", async () => {
        const result = validateJWT(jwt1, password1);
        expect(result).toBe("user-1");
    })
});


describe("extractBearerToken", () => {
    it("should extract the token from a valid header", () => {
        const token = "mySecretToken";
        const header = `Bearer ${token}`;
        expect(extractBearerToken(header)).toBe(token);
    });

    it("should extract the token even if there are extra parts", () => {
        const token = "mySecretToken";
        const header = `Bearer ${token} extra-data`;
        expect(extractBearerToken(header)).toBe(token);
    });

    it("should throw a BadRequestError if the header does not contain at least two parts", () => {
        const header = "Bearer";
        expect(() => extractBearerToken(header)).toThrow(BadRequestError);
    });

    it('should throw a BadRequestError if the header does not start with "Bearer"', () => {
        const header = "Basic mySecretToken";
        expect(() => extractBearerToken(header)).toThrow(BadRequestError);
    });

    it("should throw a BadRequestError if the header is an empty string", () => {
        const header = "";
        expect(() => extractBearerToken(header)).toThrow(BadRequestError);
    });
});