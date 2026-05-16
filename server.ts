import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(express.json());

    // API: Proxy Gemini (Segurança)
    app.post('/api/chat', async (req, res) => {
        try {
            const { message } = req.body;
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY ausente.' });
            
            const genAI = new GoogleGenAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(message);
            res.json({ reply: (await result.response).text() });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    if (process.env.NODE_ENV !== 'production') {
        // Modo Desenvolvimento (Vite Middleware)
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        // Modo Produção (Hostinger)
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

startServer();
