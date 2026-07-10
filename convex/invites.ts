import { v, ConvexError } from "convex/values";
import { adminMutation, adminQuery } from "./adminFunctions";

export const createInvite = adminMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate a secure random token
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    const token = Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Set expiration to 24 hours from now
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    const inviteId = await ctx.db.insert("invites", {
      email: args.email,
      token,
      expiresAt,
      used: false,
      role: "admin",
    });

    return token;
  },
});

export const getInvites = adminQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("invites").order("desc").collect();
  },
});

export const getAdmins = adminQuery({
  args: {},
  handler: async (ctx) => {
    const roles = await ctx.db
      .query("userRoles")
      .withIndex("by_id")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();
      
    // Fetch user details for each role
    const admins = await Promise.all(
      roles.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return {
          _id: user?._id,
          roleId: r._id, // Need this to remove the role
          name: user?.name,
          email: user?.email,
          createdAt: user?._creationTime,
        };
      })
    );
    return admins.filter(a => a._id);
  },
});

export const revokeInvite = adminMutation({
  args: { id: v.id("invites") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const removeAdmin = adminMutation({
  args: { roleId: v.id("userRoles") },
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.roleId);
    if (!role) throw new ConvexError("Role not found");
    
    // Check if it's the last admin
    const admins = await ctx.db
      .query("userRoles")
      .withIndex("by_id")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();
      
    if (admins.length <= 1) {
      throw new ConvexError("Cannot remove the last admin");
    }
    
    await ctx.db.delete(args.roleId);
  },
});
