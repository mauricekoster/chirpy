import { asc, desc, eq } from "drizzle-orm";
import { db } from "../index.js";
import { chirps, NewChirp } from "../schema.js";

export async function createChirp(chirp: NewChirp) {
    const [rows] = await db.insert(chirps).values(chirp).returning();
    return rows;
}

export async function getChirps(authorId: string = "", sort: string = "") {
    var result;
    if (authorId === "") {
        result = db.select().from(chirps);
    } else {
        result = db.select().from(chirps).where(eq(chirps.userId, authorId));
    }

    if (sort === "desc") {
        return result.orderBy(desc(chirps.createdAt));
    } else {
        return result.orderBy(asc(chirps.createdAt));
    }
}

export async function getChirp(id: string) {
    const rows = await db.select().from(chirps).where(eq(chirps.id, id));
    if (rows.length === 0) {
        return;
    }
    return rows[0];
}

export async function deleteChirp(id: string) {
    const rows = await db.delete(chirps).where(eq(chirps.id, id)).returning();
    if (rows.length === 0) {
        return;
    }
    return rows[0];
}
