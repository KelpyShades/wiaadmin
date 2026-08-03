/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminFunctions from "../adminFunctions.js";
import type * as auth from "../auth.js";
import type * as businesses from "../businesses.js";
import type * as dashboard from "../dashboard.js";
import type * as emails from "../emails.js";
import type * as executives from "../executives.js";
import type * as files from "../files.js";
import type * as gallery from "../gallery.js";
import type * as globalSettings from "../globalSettings.js";
import type * as http from "../http.js";
import type * as inbox from "../inbox.js";
import type * as invites from "../invites.js";
import type * as newsletter from "../newsletter.js";
import type * as resources from "../resources.js";
import type * as testimonials from "../testimonials.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminFunctions: typeof adminFunctions;
  auth: typeof auth;
  businesses: typeof businesses;
  dashboard: typeof dashboard;
  emails: typeof emails;
  executives: typeof executives;
  files: typeof files;
  gallery: typeof gallery;
  globalSettings: typeof globalSettings;
  http: typeof http;
  inbox: typeof inbox;
  invites: typeof invites;
  newsletter: typeof newsletter;
  resources: typeof resources;
  testimonials: typeof testimonials;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
};
