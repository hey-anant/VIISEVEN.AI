import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new user (Google OAuth)
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    picture: v.string(),
    uid: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();

    if (user?.length == 0) {
      await ctx.db.insert("users", {
        name: args.name,
        email: args.email,
        picture: args.picture,
        uid: args.uid,
        token: 50000,
      });
    } else {
      const existingUser = user[0];
      if (existingUser?.token === undefined || existingUser?.token === null) {
        await ctx.db.patch(existingUser._id, {
          token: 50000,
        });
      }
    }
  },
});

// Sign up with email + password
export const signUpWithEmail = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    uid: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("ALREADY_EXISTS");
    }

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      picture: "",
      uid: args.uid,
      token: 50000,
      passwordHash: args.passwordHash,
    });

    return userId;
  },
});

// Sign in with email + password
export const signInWithEmail = query({
  args: {
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      return { error: "NOT_FOUND" };
    }

    if (!user.passwordHash) {
      return { error: "GOOGLE_ACCOUNT" };
    }

    if (user.passwordHash !== args.passwordHash) {
      return { error: "WRONG_PASSWORD" };
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      token: user.token ?? 50000,
      uid: user.uid,
    };
  },
});

// Get user by email
export const getUsers = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();
    return user[0];
  },
});

// Get user by uid
export const getUserByUid = query({
  args: { uid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_uid", (q) => q.eq("uid", args.uid))
      .first();
  },
});

export const UpdateToken = mutation({
  args: {
    token: v.number(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db.patch(args.userId, {
      token: args.token,
    });
    return result;
  },
});
