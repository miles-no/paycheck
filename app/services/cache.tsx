import { LRUCache } from "lru-cache";
import type { XLedgerGraphQLTimesheetQueryResponse } from "~/services/getTimesheet.server";

/**
 * LRU Cache for caching things like API responses.
 * For example, we use this cache to prevent spamming Xledger with requests and to improve application performance.
 *
 * Note: This cache is not a replacement for a database.
 * It is meant to be used for caching API responses.
 *
 * It is also run server-side, so it is not accessible directly from the client.
 *
 * The cache is set up differently for production and development environments.
 * In development, the cache is added to the global object to persist across live reloads.
 *
 * Security considerations:
 * - Since the cache is global for all requests, ensure proper access control is in place for each request.
 * - Verify the identity and authorization of users requesting data to prevent unauthorized access.
 * - The risk of data leakage is low in this implementation, as it's confined to server-side code.
 * However, handle sensitive data with care, as with any server-side request.
 */

let cache: LRUCache<string, any>;

// The options for the cache
const options = {
  // Read more about the options here: https://github.com/isaacs/node-lru-cache#options
  max: 1000, // max number of items in cache
  ttl: 1000 * 60 * 30, // 30 minutes - time to live in ms
  allowStale: false, // return stale items before removing from cache?
  updateAgeOnGet: false, // update the age of an item when it is retrieved?
  updateAgeOnHas: false, // update the age of an item when it is checked?
};

// This is needed to make the cache work with live reload in development. It is not needed in production.
// See: db.server.ts for the same thing only for the database

// We add the cache to the global object so that it can be persisted across live reloads
declare global {
  // noinspection ES6ConvertVarToLetConst,JSUnusedGlobalSymbols
  var __cache: LRUCache<string, XLedgerGraphQLTimesheetQueryResponse>;
}

// and handle the cache lifecycle here
// if (process.env.NODE_ENV === "production") {
//   global.__cache = new LRUCache(options);
// } else {
if (!global.__cache) {
  global.__cache = new LRUCache(options);
}

cache = global.__cache;
// }

export { cache };
