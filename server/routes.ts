import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertArticleSchema } from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import MemoryStore from "memorystore";
import jwt from 'jsonwebtoken';

const SessionStore = MemoryStore(session);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function registerRoutes(app: Express) {
  // Session setup
  app.use(
    session({
      store: new SessionStore({ checkPeriod: 86400000 }),
      secret: process.env.SESSION_SECRET || "default_secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production" },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport configuration
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false);
        const match = await bcrypt.compare(password, user.password);
        if (!match) return done(null, false);
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, password: hashedPassword });
      res.json({ message: "User created successfully" });
    } catch (err) {
      res.status(400).json({ message: "Username already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      res.json({ token });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/auth/user", requireAuth, async (req, res) => {
    res.json(req.user);
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await storage.getUserById(req.user.id);

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Senha atual incorreta" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await storage.updateUserPassword(user.id, hashedPassword);

    res.json({ message: "Senha alterada com sucesso" });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json({ message: "Logged in successfully" });
  });

  app.post("/api/logout", (req: any, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  // Article routes
  app.get("/api/articles", async (req, res) => {
    const articles = await storage.getPublishedArticles();
    res.json(articles);
  });

  app.get("/api/articles/:slug", async (req, res) => {
    const article = await storage.getArticleBySlug(req.params.slug);
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.json(article);
  });

  // Protected article management routes
  app.get("/api/admin/articles", requireAuth, async (req, res) => {
    const articles = await storage.getArticles();
    res.json(articles);
  });

  app.post("/api/admin/articles", requireAuth, async (req, res) => {
    const parsed = insertArticleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid article data" });
    }
    const article = await storage.createArticle(parsed.data);
    res.json(article);
  });

  app.patch("/api/admin/articles/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const parsed = insertArticleSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid article data" });
    }
    try {
      const article = await storage.updateArticle(id, parsed.data);
      res.json(article);
    } catch (err) {
      res.status(404).json({ message: "Article not found" });
    }
  });

  app.delete("/api/admin/articles/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteArticle(id);
    res.status(204).end();
  });

  const httpServer = createServer(app);
  return httpServer;
}