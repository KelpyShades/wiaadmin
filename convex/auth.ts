import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";
import { ConvexError } from "convex/values";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          inviteToken: (params.inviteToken as string | undefined) ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      const { inviteToken } = args.profile;
      
      // Cast ctx.db to use our schema's DataModel to resolve index errors
      const db = ctx.db as unknown as MutationCtx["db"];
      
      // Check if it's the first admin setup
      const existingAdmins = await db.query("userRoles").collect();
      if (existingAdmins.length === 0) {
        // It's the first admin. Allow it and assign admin role.
        await db.insert("userRoles", {
          userId: args.userId as any,
          role: "admin",
        });
        return;
      }
      
      // Otherwise, require a valid invite token for signups
      if (!inviteToken) {
        throw new ConvexError("Sign ups are locked. An invite token is required.");
      }
      
      const invite = await db
        .query("invites")
        .filter((q) => q.eq(q.field("token"), inviteToken as string))
        .unique();
        
      if (!invite) {
        throw new ConvexError("Invalid invite token.");
      }
      if (invite.used) {
        throw new ConvexError("This invite token has already been used.");
      }
      if (invite.expiresAt < Date.now()) {
        throw new ConvexError("This invite token has expired.");
      }
      
      // Clear token after successful use
      await db.delete(invite._id);
      
      // Assign role
      await db.insert("userRoles", {
        userId: args.userId as any,
        role: invite.role,
      });
    }
  }
});
