import express from "express";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- GEMINI AI PROXY (SEGURANÇA) ---
// Todas as chamadas ao Gemini passam pelo backend, protegendo a API Key
app.post("/api/gemini", async (req, res) => {
  const { model, contents, config } = req.body;
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY não configurada no servidor" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-3-flash-preview'}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents, ...config })
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Erro no proxy Gemini:", error);
    res.status(500).json({ error: "Erro ao comunicar com o Gemini" });
  }
});

// --- API ROUTES ---

// User Profile
app.get("/api/profile", async (req, res) => {
  try {
    let user = await prisma.user.findUnique({
      where: { id: 1 },
      include: {
        seals: true,
        favorites: true,
        itineraries: {
          include: {
            days: {
              include: { stops: true }
            }
          }
        }
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 1,
          email: "navegante@exemplo.com",
          name: "Capitão Navegante",
          bio: "Explorando os sete mares e as ruas de paralelepípedo.",
          avatar: "https://i.pravatar.cc/150?u=navegante",
          credits: 1
        },
        include: {
          seals: true,
          favorites: true,
          itineraries: {
            include: {
              days: {
                include: { stops: true }
              }
            }
          }
        }
      });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar perfil" });
  }
});

// Mock route to upgrade to Pro or Add Credits
app.post("/api/upgrade", async (req, res) => {
  const { type, days } = req.body;
  try {
    let data = {};
    if (type === 'trip') {
      const duration = days || 15;
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + duration);
      data = { activeTripUntil: expirationDate };
    } else if (type === 'lifetime') {
      data = { isPremium: true };
    }
    
    const user = await prisma.user.update({
      where: { id: 1 },
      data
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro no upgrade" });
  }
});

app.put("/api/profile", async (req, res) => {
  const { name, bio, avatar } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: 1 },
      data: { name, bio, avatar }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});

// Posts
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: true,
        comments: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar posts" });
  }
});

app.post("/api/posts", async (req, res) => {
  const { local, texto, img } = req.body;
  try {
    const post = await prisma.post.create({
      data: {
        userId: 1,
        local,
        texto,
        img
      },
      include: { user: true }
    });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar post" });
  }
});

app.post("/api/posts/:id/like", async (req, res) => {
  const { id } = req.params;
  try {
    const post = await prisma.post.update({
      where: { id: parseInt(id) },
      data: { likes: { increment: 1 } }
    });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Erro ao curtir post" });
  }
});

// Seals (Passport)
app.post("/api/seals", async (req, res) => {
  const { name, icon, color } = req.body;
  try {
    const seal = await prisma.seal.create({
      data: {
        userId: 1,
        name,
        icon,
        color
      }
    });
    res.json(seal);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar selo" });
  }
});

// Favorites
app.post("/api/favorites", async (req, res) => {
  const { localId } = req.body;
  try {
    const favorite = await prisma.favorite.create({
      data: {
        userId: 1,
        localId
      }
    });
    res.json(favorite);
  } catch (error) {
    res.status(500).json({ error: "Erro ao favoritar" });
  }
});

app.delete("/api/favorites/:localId", async (req, res) => {
  const { localId } = req.params;
  try {
    await prisma.favorite.deleteMany({
      where: {
        userId: 1,
        localId: parseInt(localId)
      }
    });
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao remover favorito" });
  }
});

// --- VITE MIDDLEWARE ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Capitão, o servidor está no ar em http://localhost:${PORT}`);
  });
}

startServer();
