import { LinksFunction } from "@remix-run/node";
import blobBackgroundStylesheetUrl from "~/styles/blobBackground.css";
import React from "react";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: blobBackgroundStylesheetUrl }];
};
export default function Forbidden() {
  return (
    <>
      <main
        id="blobPageContent"
        className="relative min-h-screen sm:flex sm:items-center sm:justify-center"
      >
        <div className="text-center">
          <p className="text-base font-semibold text-gray-600 dark:text-gray-100">
            403
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
            Forbudt
          </h1>
          <p className="mt-6 text-base leading-7 text-gray-600 dark:text-gray-100">
            Du har ikke tilgang til denne siden. Om du tror dette er en feil, ta
            kontakt med support.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/"
              className="rounded-md bg-gray-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 dark:bg-gray-400 dark:text-gray-100 dark:hover:bg-gray-500 dark:focus-visible:outline-gray-400"
            >
              Gå tilbake til forsiden
            </a>
          </div>
        </div>
      </main>
      <div id="blur" />
      <div id="blob" />
    </>
  );
}
