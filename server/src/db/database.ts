import { createClient, Client } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';

let db: Client | null = null;

export async function initializeDatabase(): Promise<Client> {
    if (db) {
        return db;
    }

    // Create database client
    db = createClient({
        url: 'file:conversations.db'
    });

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (const statement of statements) {
        await db.execute(statement);
    }

    console.log('✅ Database initialized successfully');
    return db;
}

export function getDatabase(): Client {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}

export async function closeDatabase(): Promise<void> {
    if (db) {
        await db.close();
        db = null;
    }
}
