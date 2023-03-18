import LRUCache from "lru-cache";
import type { XLedgerGraphQLTimesheetQueryResponse } from "~/services/getTimesheet.server";
import type { Employee } from "~/services/getEmployees.server";

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
if (process.env.NODE_ENV === "production") {
  global.__cache = new LRUCache(options);
} else {
  if (!global.__cache) {
    global.__cache = new LRUCache(options);
  }

  cache = global.__cache;
}

export { cache };
