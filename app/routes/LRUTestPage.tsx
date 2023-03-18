import type { LoaderFunction } from "@remix-run/router";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { cache } from "~/cache";

export const loader: LoaderFunction = async ({ params, context, request }) => {
  const testKey = "testKey";
  const testValue = "testvalue";
  console.log(cache.has(testKey));
  if (cache.has(testKey)) {
    return json({ testValue: cache.get(testKey), message: "Data in cache" });
  } else {
    cache.set(testKey, testValue);
    return json({ message: "No data in cache" });
  }
};

export default function LRUTestPage() {
  const { message, testValue } = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>LRU Cache Test</h1>
      <p>{message}</p>
      <p>{testValue}</p>
    </div>
  );
}
