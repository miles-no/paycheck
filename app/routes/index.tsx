import { Link, useLoaderData } from "@remix-run/react";

import type { LinksFunction, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import React, { useEffect } from "react";
import { LoginForm } from "~/routes/login";
import { optionalUser } from "~/services/user.server";
import blobBackgroundStylesheetUrl from "~/styles/blobBackground.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: blobBackgroundStylesheetUrl }];
};

export async function loader({ params, context, request }: LoaderArgs) {
  const user = await optionalUser(request);
  return json({ user });
}

export default function Index() {
  const { user } = useLoaderData<typeof loader>();
  const blobRef = React.useRef<HTMLDivElement>(null);

  // Move the blob around the screen
  useEffect(() => {
    const blob = blobRef.current;
    let pointerIsMoving = false;
    let pointerPosition = { x: 0, y: 0 };

    // If the pointer is not moving, add some random movement
    const intervalId = setInterval(() => {
      const { x, y } = pointerPosition;
      const { innerWidth, innerHeight } = window;

      if (!pointerIsMoving) {
        blob?.animate(
          {
            left: `${x + Math.random() * (innerWidth - x)}px`,
            top: `${y + Math.random() * (innerHeight - y)}px`,
          },
          { duration: 10000, fill: "forwards", easing: "ease-in-out" }
        );
      }
    }, 10000); // Update every 10 seconds

    // If the pointer is moving, move the blob with it
    window.onpointermove = (event) => {
      pointerIsMoving = true;
      pointerPosition = { x: event.clientX, y: event.clientY };
      setTimeout(() => {
        pointerIsMoving = false;
      }, 1000); // Reset after 1 second

      blob?.animate(
        {
          left: `${pointerPosition.x}px`,
          top: `${pointerPosition.y}px`,
        },
        { duration: 10000, fill: "forwards", easing: "ease-in-out" }
      );
    };

    return () => {
      window.onpointermove = null; // cleanup
      clearInterval(intervalId);
    };
  }, [blobRef.current]);

  return (
    <>
      <main
        id="blobPageContent"
        className="relative min-h-screen sm:flex sm:items-center sm:justify-center"
      >
        <div className="relative sm:pb-16 sm:pt-8">
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div>
              <div className="relative px-4 pt-16 pb-8 sm:px-6 sm:pt-24 sm:pb-14 lg:px-8 lg:pb-20 lg:pt-32">
                <h1 className="text-center text-6xl font-extrabold tracking-tight sm:text-8xl lg:text-9xl">
                  <img
                    src="/miles_logo_red_pms.png"
                    alt="Miles Logo"
                    className="mx-auto mt-16 w-full max-w-[12rem] pb-2 md:max-w-[16rem]"
                  />
                  <span className="sr-only">Miles</span>
                  <span className="uppercase drop-shadow-md">Timesheets</span>
                </h1>

                <div className="mx-auto mt-10 max-w-sm sm:flex sm:max-w-none sm:justify-center">
                  {user ? (
                    <div className="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5 sm:space-y-0">
                      <Link
                        to={`/profile`}
                        className="flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-3 text-base font-medium text-yellow-700 shadow-sm hover:bg-yellow-50 sm:px-8"
                      >
                        Profil
                      </Link>

                      <Link
                        to="/logout"
                        className="flex items-center justify-center rounded-md bg-yellow-500 px-4 py-3 font-medium text-white hover:bg-yellow-600"
                      >
                        Logg ut
                      </Link>
                    </div>
                  ) : (
                    <LoginForm />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <div id="blur" />
      <div id="blob" ref={blobRef} />
      <div id="blob" />
    </>
  );
}
