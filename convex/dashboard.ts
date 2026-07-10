import { query } from "./_generated/server";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    // Note: For a large database, use `count()` if available or digest tables. 
    // Here we use collect() for simplicity since data is small.
    const testimonials = await ctx.db.query("testimonials").collect();
    const applications = await ctx.db.query("applications").collect();
    const partnerships = await ctx.db.query("partnerships").collect();

    return {
      totalTestimonials: testimonials.length,
      pendingApplications: applications.filter((a) => a.paymentStatus === "pending").length,
      successfulApplications: applications.filter((a) => a.paymentStatus === "success").length,
      totalPartnerships: partnerships.length,
    };
  },
});
