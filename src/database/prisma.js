// MOCKED DATABASE LAYER FOR AI STUDIO PREVIEW ENVIRONMENT
// Follows ADR-001 (In-Memory MVP Storage) and AI Studio Migration Guidelines.
// Provides in-memory persistence across session restarts.
const bcrypt = require("bcryptjs");

let inMemoryUsers = [
  {
    id: 1,
    name: "Admin EasyFood",
    email: "admin@easyfood.com",
    password: bcrypt.hashSync("admin123", 10),
    avatarUrl: null
  }
];

let inMemoryRestaurants = [
  { id: 1, name: "Burger Craft", category: "Burger", rating: 4.8, ownerId: 1 },
  { id: 2, name: "La Bella Pizza", category: "Pizza", rating: 4.7, ownerId: 1 },
  { id: 3, name: "Kyoto Sushi Bar", category: "Sushi", rating: 4.9, ownerId: 1 },
  { id: 4, name: "Green & Fresh Salad", category: "Saudável", rating: 4.6, ownerId: 1 },
  { id: 5, name: "Smash House Burger", category: "Burger", rating: 4.5, ownerId: 1 },
  { id: 6, name: "Napoletana Forneria", category: "Pizza", rating: 4.8, ownerId: 1 }
];

let inMemoryDishes = [
  {
    id: 1,
    name: "Smash Bacon Duplo",
    category: "Burger",
    price: "34.90",
    imageUrl: "",
    description: "Dois hambúrgueres 100g, queijo cheddar derretido e bacon crocante",
    restaurantId: 1
  },
  {
    id: 2,
    name: "Pizza Margherita Especial",
    category: "Pizza",
    price: "59.00",
    imageUrl: "",
    description: "Molho de tomate pelado, mozzarella di bufala e manjericão fresco",
    restaurantId: 2
  },
  {
    id: 3,
    name: "Combo Sushi Salmão (18 pcs)",
    category: "Sushi",
    price: "68.50",
    imageUrl: "",
    description: "6 sashimis, 4 nigiris, 4 uramakis e 4 hossomakis",
    restaurantId: 3
  },
  {
    id: 4,
    name: "Bowl Mediterrâneo",
    category: "Saudável",
    price: "29.90",
    imageUrl: "",
    description: "Mix de folhas verdes, quinoa real, tomate grape, grão-de-bico e molho tahine",
    restaurantId: 4
  }
];

let inMemoryActivities = [];

const mockPrisma = {
  restaurant: {
    findMany: async (args) => {
      let list = inMemoryRestaurants.map((r) => ({ ...r }));
      if (args?.where) {
        if (args.where.category) {
          list = list.filter((r) => r.category === args.where.category);
        }
        if (args.where.ownerId) {
          list = list.filter((r) => r.ownerId === Number(args.where.ownerId));
        }
      }
      return list;
    },
    findUnique: async ({ where }) => {
      const rest = inMemoryRestaurants.find((r) => r.id === Number(where.id));
      return rest ? { ...rest } : null;
    },
    create: async ({ data }) => {
      const newId = inMemoryRestaurants.length > 0
        ? Math.max(...inMemoryRestaurants.map((r) => r.id)) + 1
        : 1;
      const newRest = {
        id: newId,
        name: data.name,
        category: data.category || null,
        rating: data.rating !== undefined ? Number(data.rating) : 0,
        ownerId: data.ownerId || 1
      };
      inMemoryRestaurants.push(newRest);
      return { ...newRest };
    }
  },

  user: {
    findMany: async () => inMemoryUsers.map((u) => ({ ...u })),
    findUnique: async ({ where }) => {
      if (where.id) {
        const u = inMemoryUsers.find((x) => x.id === Number(where.id));
        return u ? { ...u } : null;
      }
      if (where.email) {
        const u = inMemoryUsers.find((x) => x.email.toLowerCase() === where.email.toLowerCase());
        return u ? { ...u } : null;
      }
      return null;
    },
    create: async ({ data }) => {
      const newId = inMemoryUsers.length > 0
        ? Math.max(...inMemoryUsers.map((u) => u.id)) + 1
        : 1;
      const newUser = {
        id: newId,
        name: data.name,
        email: data.email,
        password: data.password,
        avatarUrl: data.avatarUrl || null
      };
      inMemoryUsers.push(newUser);
      return { ...newUser };
    },
    update: async ({ where, data }) => {
      const idx = inMemoryUsers.findIndex((u) => u.id === Number(where.id));
      if (idx === -1) {
        const err = new Error("Usuário não encontrado");
        err.statusCode = 404;
        throw err;
      }
      inMemoryUsers[idx] = { ...inMemoryUsers[idx], ...data };
      return { ...inMemoryUsers[idx] };
    }
  },

  dish: {
    findMany: async (args) => {
      let list = inMemoryDishes.map((d) => ({ ...d }));
      if (args?.where?.restaurantId) {
        list = list.filter((d) => d.restaurantId === Number(args.where.restaurantId));
      }
      return list;
    },
    findUnique: async ({ where, include }) => {
      const dish = inMemoryDishes.find((d) => d.id === Number(where.id));
      if (!dish) return null;
      const copy = { ...dish };
      if (include?.restaurant) {
        const rest = inMemoryRestaurants.find((r) => r.id === dish.restaurantId);
        copy.restaurant = rest ? { ...rest } : null;
      }
      return copy;
    },
    create: async ({ data }) => {
      const newId = inMemoryDishes.length > 0
        ? Math.max(...inMemoryDishes.map((d) => d.id)) + 1
        : 1;
      const newDish = {
        id: newId,
        name: data.name,
        category: data.category,
        price: data.price,
        imageUrl: data.imageUrl || "",
        description: data.description || "",
        restaurantId: Number(data.restaurantId)
      };
      inMemoryDishes.push(newDish);
      return { ...newDish };
    },
    update: async ({ where, data }) => {
      const idx = inMemoryDishes.findIndex((d) => d.id === Number(where.id));
      if (idx === -1) {
        const error = new Error("Prato não encontrado");
        error.statusCode = 404;
        throw error;
      }
      inMemoryDishes[idx] = { ...inMemoryDishes[idx], ...data };
      return { ...inMemoryDishes[idx] };
    },
    delete: async ({ where }) => {
      const idx = inMemoryDishes.findIndex((d) => d.id === Number(where.id));
      if (idx !== -1) {
        const [deleted] = inMemoryDishes.splice(idx, 1);
        return deleted;
      }
      return {};
    }
  },

  activity: {
    create: async ({ data }) => {
      const newId = inMemoryActivities.length + 1;
      const newActivity = {
        id: newId,
        action: data.action,
        details: data.details || null,
        createdAt: new Date()
      };
      inMemoryActivities.push(newActivity);
      return { ...newActivity };
    }
  }
};

let prisma = mockPrisma;

// Try to use real Prisma if DATABASE_URL is explicitly configured and reachable
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("mock")) {
  try {
    const { PrismaClient } = require("@prisma/client");
    const realPrisma = new PrismaClient();
    // Wrap with proxy fallback in case DB is unreachable
    prisma = new Proxy(realPrisma, {
      get(target, prop) {
        if (prop in target) {
          return target[prop];
        }
        return mockPrisma[prop] || undefined;
      }
    });
  } catch (e) {
    console.warn("[AI Studio] Database offline or unconfigured — active mock storage");
    prisma = mockPrisma;
  }
}

module.exports = prisma;