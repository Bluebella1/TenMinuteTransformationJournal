// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").default(false),
  isActive: boolean("is_active").default(true),
  weekStart: text("week_start").notNull(),
  // YYYY-MM-DD format
  createdAt: timestamp("created_at").default(sql`now()`)
});
var dailyEntries = pgTable("daily_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  // YYYY-MM-DD format
  morningIntention: text("morning_intention"),
  energyLevel: integer("energy_level"),
  suggestedTaskId: varchar("suggested_task_id").references(() => tasks.id),
  tenMinuteActivity: text("ten_minute_activity"),
  // Generated based on tasks
  activityCompleted: boolean("activity_completed").default(false),
  eveningReflection: text("evening_reflection"),
  promiseKept: text("promise_kept"),
  // 'yes', 'partial', 'no'
  followUpResponse: text("follow_up_response"),
  photos: jsonb("photos").$type().default([]),
  voiceNotes: jsonb("voice_notes").$type().default([]),
  createdAt: timestamp("created_at").default(sql`now()`)
});
var reflections = pgTable("reflections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promptId: text("prompt_id").notNull(),
  promptText: text("prompt_text").notNull(),
  response: text("response").notNull(),
  followUpResponse: text("follow_up_response"),
  date: text("date").notNull(),
  // YYYY-MM-DD format
  createdAt: timestamp("created_at").default(sql`now()`)
});
var weeklyReviews = pgTable("weekly_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weekStart: text("week_start").notNull(),
  // YYYY-MM-DD format
  weekEnd: text("week_end").notNull(),
  // YYYY-MM-DD format
  proudActions: text("proud_actions"),
  selfRespectMoments: text("self_respect_moments"),
  patterns: text("patterns"),
  nextWeekCultivate: text("next_week_cultivate"),
  nextWeekSupport: text("next_week_support"),
  growthLevel: integer("growth_level").default(1),
  promisesKept: integer("promises_kept").default(0),
  totalPromises: integer("total_promises").default(0),
  createdAt: timestamp("created_at").default(sql`now()`)
});
var insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true
});
var insertDailyEntrySchema = createInsertSchema(dailyEntries).omit({
  id: true,
  createdAt: true
});
var insertReflectionSchema = createInsertSchema(reflections).omit({
  id: true,
  createdAt: true
});
var insertWeeklyReviewSchema = createInsertSchema(weeklyReviews).omit({
  id: true,
  createdAt: true
});

// server/storage.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
var MemStorage = class {
  tasks;
  dailyEntries;
  reflections;
  weeklyReviews;
  constructor() {
    this.tasks = /* @__PURE__ */ new Map();
    this.dailyEntries = /* @__PURE__ */ new Map();
    this.reflections = /* @__PURE__ */ new Map();
    this.weeklyReviews = /* @__PURE__ */ new Map();
  }
  // Tasks
  async getTasks(weekStart) {
    const tasks2 = Array.from(this.tasks.values()).filter((task) => task.isActive !== false);
    if (weekStart) {
      return tasks2.filter((task) => task.weekStart === weekStart);
    }
    return tasks2;
  }
  async getAllTasks() {
    return Array.from(this.tasks.values()).filter((task) => task.isActive !== false).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }
  async getTask(id) {
    return this.tasks.get(id);
  }
  async createTask(insertTask) {
    const id = randomUUID();
    const task = {
      id,
      title: insertTask.title,
      description: insertTask.description || null,
      isCompleted: insertTask.isCompleted || false,
      isActive: insertTask.isActive !== void 0 ? insertTask.isActive : true,
      weekStart: insertTask.weekStart,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.tasks.set(id, task);
    return task;
  }
  async updateTask(id, updateTask) {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return void 0;
    const updatedTask = { ...existingTask, ...updateTask };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  async deleteTask(id) {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return false;
    const updatedTask = { ...existingTask, isActive: false };
    this.tasks.set(id, updatedTask);
    return true;
  }
  // Daily Entries
  async getDailyEntry(date) {
    return Array.from(this.dailyEntries.values()).find((entry) => entry.date === date);
  }
  async getAllDailyEntries() {
    return Array.from(this.dailyEntries.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  async createDailyEntry(insertEntry) {
    const id = randomUUID();
    const entry = {
      id,
      date: insertEntry.date,
      morningIntention: insertEntry.morningIntention || null,
      energyLevel: insertEntry.energyLevel || null,
      suggestedTaskId: insertEntry.suggestedTaskId || null,
      tenMinuteActivity: insertEntry.tenMinuteActivity || null,
      activityCompleted: insertEntry.activityCompleted || null,
      eveningReflection: insertEntry.eveningReflection || null,
      promiseKept: insertEntry.promiseKept || null,
      followUpResponse: insertEntry.followUpResponse || null,
      photos: insertEntry.photos || null,
      voiceNotes: insertEntry.voiceNotes || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.dailyEntries.set(id, entry);
    return entry;
  }
  async updateDailyEntry(id, updateEntry) {
    const existingEntry = this.dailyEntries.get(id);
    if (!existingEntry) return void 0;
    const updatedEntry = { ...existingEntry, ...updateEntry };
    this.dailyEntries.set(id, updatedEntry);
    return updatedEntry;
  }
  async deleteDailyEntry(id) {
    return this.dailyEntries.delete(id);
  }
  async getDailyEntriesForWeek(weekStart, weekEnd) {
    return Array.from(this.dailyEntries.values()).filter(
      (entry) => entry.date >= weekStart && entry.date <= weekEnd
    );
  }
  // Reflections
  async getReflections(date) {
    const reflections2 = Array.from(this.reflections.values());
    if (date) {
      return reflections2.filter((reflection) => reflection.date === date);
    }
    return reflections2;
  }
  async getAllReflections() {
    return Array.from(this.reflections.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }
  async createReflection(insertReflection) {
    const id = randomUUID();
    const reflection = {
      id,
      promptId: insertReflection.promptId,
      promptText: insertReflection.promptText,
      response: insertReflection.response,
      followUpResponse: insertReflection.followUpResponse || null,
      date: insertReflection.date,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.reflections.set(id, reflection);
    return reflection;
  }
  async updateReflection(id, updateReflection) {
    const existingReflection = this.reflections.get(id);
    if (!existingReflection) return void 0;
    const updatedReflection = { ...existingReflection, ...updateReflection };
    this.reflections.set(id, updatedReflection);
    return updatedReflection;
  }
  async deleteReflection(id) {
    return this.reflections.delete(id);
  }
  // Weekly Reviews
  async getWeeklyReview(weekStart) {
    return Array.from(this.weeklyReviews.values()).find((review) => review.weekStart === weekStart);
  }
  async getAllWeeklyReviews() {
    return Array.from(this.weeklyReviews.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }
  async createWeeklyReview(insertReview) {
    const id = randomUUID();
    const review = {
      id,
      weekStart: insertReview.weekStart,
      weekEnd: insertReview.weekEnd,
      proudActions: insertReview.proudActions || null,
      selfRespectMoments: insertReview.selfRespectMoments || null,
      patterns: insertReview.patterns || null,
      nextWeekCultivate: insertReview.nextWeekCultivate || null,
      nextWeekSupport: insertReview.nextWeekSupport || null,
      growthLevel: insertReview.growthLevel || null,
      promisesKept: insertReview.promisesKept || null,
      totalPromises: insertReview.totalPromises || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.weeklyReviews.set(id, review);
    return review;
  }
  async updateWeeklyReview(id, updateReview) {
    const existingReview = this.weeklyReviews.get(id);
    if (!existingReview) return void 0;
    const updatedReview = { ...existingReview, ...updateReview };
    this.weeklyReviews.set(id, updatedReview);
    return updatedReview;
  }
  async deleteWeeklyReview(id) {
    return this.weeklyReviews.delete(id);
  }
};
var DatabaseStorage = class {
  db;
  constructor() {
    const sql2 = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql2);
  }
  // Tasks
  async getTasks(weekStart) {
    if (weekStart) {
      return await this.db.select().from(tasks).where(
        and(eq(tasks.weekStart, weekStart), eq(tasks.isActive, true))
      );
    }
    return await this.db.select().from(tasks).where(eq(tasks.isActive, true));
  }
  async getAllTasks() {
    return await this.db.select().from(tasks).where(eq(tasks.isActive, true)).orderBy(desc(tasks.createdAt));
  }
  async getTask(id) {
    const result = await this.db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }
  async createTask(insertTask) {
    const result = await this.db.insert(tasks).values(insertTask).returning();
    return result[0];
  }
  async updateTask(id, updateTask) {
    const result = await this.db.update(tasks).set(updateTask).where(eq(tasks.id, id)).returning();
    return result[0];
  }
  async deleteTask(id) {
    const result = await this.db.update(tasks).set({ isActive: false }).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }
  // Daily Entries
  async getDailyEntry(date) {
    const result = await this.db.select().from(dailyEntries).where(eq(dailyEntries.date, date));
    return result[0];
  }
  async getAllDailyEntries() {
    return await this.db.select().from(dailyEntries).orderBy(desc(dailyEntries.date));
  }
  async createDailyEntry(insertEntry) {
    const result = await this.db.insert(dailyEntries).values(insertEntry).returning();
    return result[0];
  }
  async updateDailyEntry(id, updateEntry) {
    const result = await this.db.update(dailyEntries).set(updateEntry).where(eq(dailyEntries.id, id)).returning();
    return result[0];
  }
  async deleteDailyEntry(id) {
    const result = await this.db.delete(dailyEntries).where(eq(dailyEntries.id, id)).returning();
    return result.length > 0;
  }
  async getDailyEntriesForWeek(weekStart, weekEnd) {
    return await this.db.select().from(dailyEntries).where(
      and(gte(dailyEntries.date, weekStart), lte(dailyEntries.date, weekEnd))
    );
  }
  // Reflections
  async getReflections(date) {
    if (date) {
      return await this.db.select().from(reflections).where(eq(reflections.date, date));
    }
    return await this.db.select().from(reflections);
  }
  async getAllReflections() {
    return await this.db.select().from(reflections).orderBy(desc(reflections.createdAt));
  }
  async createReflection(insertReflection) {
    const result = await this.db.insert(reflections).values(insertReflection).returning();
    return result[0];
  }
  async updateReflection(id, updateReflection) {
    const result = await this.db.update(reflections).set(updateReflection).where(eq(reflections.id, id)).returning();
    return result[0];
  }
  async deleteReflection(id) {
    const result = await this.db.delete(reflections).where(eq(reflections.id, id)).returning();
    return result.length > 0;
  }
  // Weekly Reviews
  async getWeeklyReview(weekStart) {
    const result = await this.db.select().from(weeklyReviews).where(eq(weeklyReviews.weekStart, weekStart));
    return result[0];
  }
  async getAllWeeklyReviews() {
    return await this.db.select().from(weeklyReviews).orderBy(desc(weeklyReviews.createdAt));
  }
  async createWeeklyReview(insertReview) {
    const result = await this.db.insert(weeklyReviews).values(insertReview).returning();
    return result[0];
  }
  async updateWeeklyReview(id, updateReview) {
    const result = await this.db.update(weeklyReviews).set(updateReview).where(eq(weeklyReviews.id, id)).returning();
    return result[0];
  }
  async deleteWeeklyReview(id) {
    const result = await this.db.delete(weeklyReviews).where(eq(weeklyReviews.id, id)).returning();
    return result.length > 0;
  }
};
var storage = process.env.NODE_ENV === "development" && process.env.USE_MEMORY_STORAGE === "true" ? new MemStorage() : new DatabaseStorage();

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/tasks", async (req, res) => {
    try {
      const { weekStart } = req.query;
      const tasks2 = await storage.getTasks(weekStart);
      res.json(tasks2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  app2.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });
  app2.put("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(id, validatedData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });
  app2.delete("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteTask(id);
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });
  app2.patch("/api/tasks/:id/complete", async (req, res) => {
    try {
      const { id } = req.params;
      const { completed } = req.body;
      const task = await storage.updateTask(id, { isCompleted: completed });
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task completion" });
    }
  });
  app2.get("/api/daily-all", async (req, res) => {
    try {
      const entries = await storage.getAllDailyEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all daily entries" });
    }
  });
  app2.get("/api/daily/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const entry = await storage.getDailyEntry(date);
      res.json(entry || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily entry" });
    }
  });
  app2.post("/api/daily", async (req, res) => {
    try {
      const validatedData = insertDailyEntrySchema.parse(req.body);
      const entry = await storage.createDailyEntry(validatedData);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ message: "Invalid daily entry data" });
    }
  });
  app2.put("/api/daily/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertDailyEntrySchema.partial().parse(req.body);
      const entry = await storage.updateDailyEntry(id, validatedData);
      if (!entry) {
        return res.status(404).json({ message: "Daily entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(400).json({ message: "Invalid daily entry data" });
    }
  });
  app2.delete("/api/daily-entries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteDailyEntry(id);
      if (!success) {
        return res.status(404).json({ message: "Daily entry not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete daily entry" });
    }
  });
  app2.get("/api/daily-week/:weekStart/:weekEnd", async (req, res) => {
    try {
      const { weekStart, weekEnd } = req.params;
      const entries = await storage.getDailyEntriesForWeek(weekStart, weekEnd);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly entries" });
    }
  });
  app2.get("/api/reflections/:date?", async (req, res) => {
    try {
      const { date } = req.params;
      const reflections2 = await storage.getReflections(date);
      res.json(reflections2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reflections" });
    }
  });
  app2.post("/api/reflections", async (req, res) => {
    try {
      const validatedData = insertReflectionSchema.parse(req.body);
      const reflection = await storage.createReflection(validatedData);
      res.json(reflection);
    } catch (error) {
      res.status(400).json({ message: "Invalid reflection data" });
    }
  });
  app2.put("/api/reflections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertReflectionSchema.partial().parse(req.body);
      const reflection = await storage.updateReflection(id, validatedData);
      if (!reflection) {
        return res.status(404).json({ message: "Reflection not found" });
      }
      res.json(reflection);
    } catch (error) {
      res.status(400).json({ message: "Invalid reflection data" });
    }
  });
  app2.delete("/api/reflections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteReflection(id);
      if (!success) {
        return res.status(404).json({ message: "Reflection not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reflection" });
    }
  });
  app2.get("/api/weekly-review/:weekStart", async (req, res) => {
    try {
      const { weekStart } = req.params;
      const review = await storage.getWeeklyReview(weekStart);
      res.json(review || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly review" });
    }
  });
  app2.post("/api/weekly-review", async (req, res) => {
    try {
      const validatedData = insertWeeklyReviewSchema.parse(req.body);
      const review = await storage.createWeeklyReview(validatedData);
      res.json(review);
    } catch (error) {
      res.status(400).json({ message: "Invalid weekly review data" });
    }
  });
  app2.put("/api/weekly-review/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertWeeklyReviewSchema.partial().parse(req.body);
      const review = await storage.updateWeeklyReview(id, validatedData);
      if (!review) {
        return res.status(404).json({ message: "Weekly review not found" });
      }
      res.json(review);
    } catch (error) {
      res.status(400).json({ message: "Invalid weekly review data" });
    }
  });
  app2.delete("/api/weekly-review/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteWeeklyReview(id);
      if (!success) {
        return res.status(404).json({ message: "Weekly review not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete weekly review" });
    }
  });
  app2.get("/api/tasks-all", async (req, res) => {
    try {
      const tasks2 = await storage.getAllTasks();
      res.json(tasks2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all tasks" });
    }
  });
  app2.get("/api/reflections-all", async (req, res) => {
    try {
      const reflections2 = await storage.getAllReflections();
      res.json(reflections2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all reflections" });
    }
  });
  app2.get("/api/weekly-reviews-all", async (req, res) => {
    try {
      const reviews = await storage.getAllWeeklyReviews();
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all weekly reviews" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.get("/", (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    res.status(200).json({
      status: "healthy",
      message: "TenMinute Transformation Journal is running",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } else {
    next();
  }
});
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "0.0.0.0";
  server.listen(port, host, () => {
    log(`Server running on ${host}:${port}`);
    log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
})();
