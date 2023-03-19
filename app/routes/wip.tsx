import Navbar from "~/components/navbar";

export default function WIPPage() {
  return (
    <>
      <Navbar />
      <main className={"mx-auto max-w-7xl sm:px-6 lg:px-8"}>
        <h1
          className={
            "pt-8 pb-8 text-2xl font-light leading-8 text-gray-900 dark:text-white"
          }
        >
          Work in progress
        </h1>
        <p>This page is under construction. Please check back later.</p>
      </main>
    </>
  );
}
