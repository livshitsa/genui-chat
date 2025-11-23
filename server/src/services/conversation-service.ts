import { getDatabase } from '../db/database';

export interface Message {
    id?: number;
    conversation_id: string;
    role: 'user' | 'ai';
    content: string;
    component_code?: string;
    model?: 'gemini' | 'anthropic';
    created_at?: string;
}

export interface Conversation {
    id: string;
    created_at?: string;
    updated_at?: string;
    title?: string;
}

export class ConversationService {
    /**
     * Create a new conversation with the given session ID
     */
    static async createConversation(sessionId: string): Promise<Conversation> {
        const db = getDatabase();

        await db.execute({
            sql: 'INSERT INTO conversations (id, title) VALUES (?, ?)',
            args: [sessionId, 'New Conversation']
        });

        return {
            id: sessionId,
            title: 'New Conversation'
        };
    }

    /**
     * Get a conversation by session ID
     */
    static async getConversation(sessionId: string): Promise<Conversation | null> {
        const db = getDatabase();

        const result = await db.execute({
            sql: 'SELECT * FROM conversations WHERE id = ?',
            args: [sessionId]
        });

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            id: row.id as string,
            created_at: row.created_at as string,
            updated_at: row.updated_at as string,
            title: row.title as string
        };
    }

    /**
     * Get or create a conversation
     */
    static async getOrCreateConversation(sessionId: string): Promise<Conversation> {
        let conversation = await this.getConversation(sessionId);

        if (!conversation) {
            conversation = await this.createConversation(sessionId);
        }

        return conversation;
    }

    /**
     * Add a message to a conversation
     */
    static async addMessage(
        sessionId: string,
        role: 'user' | 'ai',
        content: string,
        componentCode?: string,
        model?: 'gemini' | 'anthropic'
    ): Promise<Message> {
        const db = getDatabase();

        // Ensure conversation exists
        await this.getOrCreateConversation(sessionId);

        // Insert message
        const result = await db.execute({
            sql: `INSERT INTO messages (conversation_id, role, content, component_code, model) 
            VALUES (?, ?, ?, ?, ?)`,
            args: [sessionId, role, content, componentCode || null, model || null]
        });

        // Update conversation's updated_at timestamp
        await db.execute({
            sql: 'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            args: [sessionId]
        });

        return {
            id: Number(result.lastInsertRowid),
            conversation_id: sessionId,
            role,
            content,
            component_code: componentCode,
            model
        };
    }

    /**
     * Get all messages for a conversation, ordered by creation time
     */
    static async getConversationHistory(sessionId: string): Promise<Message[]> {
        const db = getDatabase();

        const result = await db.execute({
            sql: `SELECT * FROM messages 
            WHERE conversation_id = ? 
            ORDER BY created_at ASC`,
            args: [sessionId]
        });

        return result.rows.map(row => ({
            id: row.id as number,
            conversation_id: row.conversation_id as string,
            role: row.role as 'user' | 'ai',
            content: row.content as string,
            component_code: row.component_code as string | undefined,
            model: row.model as 'gemini' | 'anthropic' | undefined,
            created_at: row.created_at as string
        }));
    }

    /**
     * Update conversation title (optional enhancement)
     */
    static async updateConversationTitle(sessionId: string, title: string): Promise<void> {
        const db = getDatabase();

        await db.execute({
            sql: 'UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            args: [title, sessionId]
        });
    }

    /**
     * Get all conversations, ordered by most recently updated
     */
    static async getAllConversations(): Promise<Conversation[]> {
        const db = getDatabase();

        const result = await db.execute({
            sql: 'SELECT * FROM conversations ORDER BY updated_at DESC'
        });

        return result.rows.map(row => ({
            id: row.id as string,
            created_at: row.created_at as string,
            updated_at: row.updated_at as string,
            title: row.title as string
        }));
    }

    /**
     * Delete a conversation and all its messages
     */
    static async deleteConversation(sessionId: string): Promise<void> {
        const db = getDatabase();

        await db.execute({
            sql: 'DELETE FROM conversations WHERE id = ?',
            args: [sessionId]
        });
    }
}
