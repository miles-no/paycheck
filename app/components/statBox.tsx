export function StatBox(props: { label: string; content?: string }) {
  return (
    <div
      className={
        "overflow-hidden rounded-lg bg-white bg-opacity-50 shadow dark:bg-black dark:bg-opacity-40"
      }
    >
      <div className={"px-4 py-5 sm:p-6"}>
        <label
          className={
            "truncate text-sm font-medium text-gray-500 dark:text-white"
          }
        >
          {props.label}
          <p
            className={
              "mt-1 text-3xl font-semibold text-gray-900 dark:text-white"
            }
          >
            {props.content}
          </p>
        </label>
      </div>
    </div>
  );
}
