# Miles PayCheck: Payroll Transparency and Accuracy

Miles PayCheck aims to provide employees with a clear and comprehensive understanding of their payroll. The majority of
consultants at Miles receive provision-based pay with a base amount, which can vary depending on the project and
individual circumstances.

The challenge arises when employees work on projects without a set rate or those not invoiced to customers, but still
need to generate provisions. For example, an employee might have a sick child and require leave for a few days each
month or work on internal projects. In many cases, the employees should be compensated the same as their main-project
for that work.

Additionally, some employees may be involved in multiple projects, complicating the calculation of provisions. The
payroll system needs to determine the main project's rate, which may not be immediately clear from the financial records
in Xledger.

Miles PayCheck addresses these challenges by making payroll transparent for employees and reducing the error rate before
invoicing customers. This ensures that employees have accurate and up-to-date information about their pay, and customers
are billed correctly, regardless of the nature of their projects.

Furthermore, Miles PayCheck provides managers and admins with the ability to review all employees' timesheets, offering
a comprehensive overview of invoiced amounts versus pay. This enables them to monitor the company's financial health and
assist in making informed decisions for future projections and planning.

- [Miles PayCheck: Payroll Transparency and Accuracy](#miles-paycheck-payroll-transparency-and-accuracy)
  - [Getting started](#getting-started)
  - [Architecture](#architecture)
  - [Environment variables](#environment-variables)
  - [Local database](#local-database)
  - [A note on guarding routes](#a-note-on-guarding-routes)
  - [Design](#design)
    - [Tailwind](#tailwind)
    - [Mobile first](#mobile-first)
    - [Dark mode](#dark-mode)
  - [Pages and Guards](#pages-and-guards)
    - [Login Page](#login-page)
    - [Employee List Page](#employee-list-page)
    - [Employee Timesheet Page](#employee-timesheet-page)
  - [Calculating pay for an employee](#calculating-pay-for-an-employee)
    - [Special cases](#special-cases)
  - [What is in the stack](#what-is-in-the-stack)
  - [Quickstart](#quickstart)
  - [Development](#development)
    - [Relevant code](#relevant-code)
  - [Deployment](#deployment)
    - [Connecting to your database](#connecting-to-your-database)
    - [Getting Help with Deployment](#getting-help-with-deployment)
  - [GitHub Actions](#github-actions)
  - [Testing](#testing)
    - [Cypress](#cypress)
    - [Vitest](#vitest)
    - [Type Checking](#type-checking)
    - [Linting](#linting)
    - [Formatting](#formatting)

## Getting started

1. Install dependencies
   `npm install`
2. Setup database
   For example a [Local database](#local-database)
3. Setup environment variables
   See section [Environment variables](#environment-variables)
4. Run the project
   `npm run dev`

## Architecture

![architecture](out/documentation/architecture/Architecture%20overview.svg)

This project is based on the remix-indie stack.
We might not use all the stack or have decided on going a different direction,
(like google auth instead of handling it ourselves),
so there are some parts of the code that should be removed.

For more about the indie-stack. See `## What is in the stack`-section.

## Environment variables

Here is a sample of the environment variables that should be set for this project.
It is used to set environment variables when running the project locally.

Create a file called `.env` in the root of the project and add the following variables.

```dotenv
NODE_ENV=development
BASE_URL="http://localhost:3000"
SESSION_SECRET="xxxxxx"# random string

DATABASE_URL="postgresql://postgres:********@localhost:5432/miles-timelists?schema=public"

#XLEDGER
XLEDGER_TOKEN="xxxxxxxx"
XLEDGER_GRAPHQL_URL="https://www.xledger.net/graphql"

#GOOGLE AUTH
GOOGLE_CLIENT_ID="1000000000000-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
```

## Local database

<https://www.prisma.io/dataguide/postgresql/setting-up-a-local-postgresql-database>

> Version 14 is currently used in our Google cloud-instance, so it is recommended to use the same version locally.

Then remember to update your environment variables and run `npx prisma migrate dev` to create the tables in the
database.

## A note on guarding routes

Unless public, Always check the user's role before rendering a page.
This should be done in every `loader` and `action`.

## Design

<http://remix.run/docs/en/1.14.3/guides/styling>

### Tailwind

Tailwind has been chosen since it generates pure css in the end.
You may still write some CSS...
I can recommend looking at tailwind-ui-components for learning best-practices with regard to UX.
See tailwind-ui <https://tailwindui.com/components>

### Mobile first

Try to keep the users in mind when designing components.
Most users will be using mobile devices.

Using tailwind, start with mobile, then think about how it will look on larger devices, adding `sm:`, and `md:` etc...
<https://tailwindcss.com/docs/responsive-design#working-mobile-first>

### Dark mode

Tip: Start with light mode, then add `dark:bg-black` and other classnames to make it look nice.

## Pages and Guards

This is the list of pages and guards that should be implemented for this project. The path is the URL path that should
be used for the page. The guard is a description of the logic that should be used to determine if a user should be able
to access the page. If a user is not able to access the page, they should be redirected to the error page.

### Login Page

- Path: /login
- Guard: If the user is already logged in, they should be redirected to the home page.

### Employee List Page

- Path: `/employees`
- Guard: Only users who are identified as managers should be able to access this page.
  If a user is not a manager, they should be redirected to the home page.

### Employee Timesheet Page

- Path: `/employees/{employeeId}/timesheets/{year}/{month}`
- Guard: Only users who are identified as employees or managers should be able to access this page.
  If a user is not an employee or manager, they should be redirected to the home page.
  Additionally, if a user is a manager,
  they should only be able to access the timesheet for employees who report to them.
  (NOT IMPLEMENTED)

## Calculating pay for an employee

To calculate the pay for a given employee, you need to know the following:

Project + activity. How many hours and at what rate.

Each employee has some variables that are used to calculate the pay:

- Yearly fixed salary (Fetched from xledger)
- Self-cost factor (Stored in a table)
- Provision percentage (Stored in a table)

The above can be edited by the manager.

We can then calculate the pay for an employee as follows:

- `Monthly fixed salary = Yearly fixed salary / 12`
- `Monthly invoiced turnover = SUM (Hours * hourly rate) // note calculation is done per project`
- `Monthly self-cost = Monthly fixed salary * self-cost factor`
- `Net amount invoiced that exceeds self-cost = MAX (Monthly invoiced turnover - self-cost; 0)`
- `Monthly provision = (Monthly invoiced turnover - self-cost) * provision percentage`
- `Monthly pay = Monthly fixed salary + Monthly provision`

### Special cases

The following tasks have special rules for calculating the pay:

| Code  | Task                   | Comment               |
|-------|------------------------|-----------------------|
| S-101 | Fagsamtaler            | "Main project"        |
| S-102 | Faglig intervju        | 1000 kr an hour       |
| S-103 | Bistand innsalg        | "Main project"        |
| S-104 | Profilaktiviteter      | "Main project"        |
| S-105 | Mentor                 | "Main project"        |
| S-106 | Fagtjener              | "Main project"        |
| S-107 | Verneplikt             | 50% of "Main project" |
| S-108 | Interntim m/p          | "Main project"        |
| 992   | Syk, egenmelding       | "Main project"        |
| 993   | Sykt                   | "Main project"        |
| 994   | Sykemelding            | "Main project"        |
| 995   | Foreldrepermisjon      | "Main project"        |
| 996   | Annen lønnet permisjon | "Main project"        |

As you see above, most tasks are part of the "Main project".
The "Main project" is the project that the employee has
worked the most hours for the given month.

Note, that the "Main project" is not necessarily the project with the highest pay but the project with the most hours.

## What is in the stack

> This project is based on the remix-indie stack as shown below. We might not use all the stack or have decided on going
> a different direction, (like google auth instead of handling it ourselves), so there are some parts of the code that
> should be removed.

- [Fly app deployment](https://fly.io) with [Docker](https://www.docker.com/)
- Production-ready [SQLite Database](https://sqlite.org)
- Healthcheck endpoint
  for [Fly backups region fallbacks](https://fly.io/docs/reference/configuration/#services-http_checks)
- [GitHub Actions](https://github.com/features/actions) for deploy on merge to production and staging environments
- Email/Password Authentication
  with [cookie-based sessions](https://remix.run/docs/en/v1/api/remix#createcookiesessionstorage)
- Database ORM with [Prisma](https://prisma.io)
- Styling with [Tailwind](https://tailwindcss.com/)
- End-to-end testing with [Cypress](https://cypress.io)
- Local third party request mocking with [MSW](https://mswjs.io)
- Unit testing with [Vitest](https://vitest.dev) and [Testing Library](https://testing-library.com)
- Code formatting with [Prettier](https://prettier.io)
- Linting with [ESLint](https://eslint.org)
- Static Types with [TypeScript](https://typescriptlang.org)

Not a fan of the stack? Fork it, change it, and use `npx create-remix --template your/repo`! Make it your own.

## Quickstart

Click this button to create a [Gitpod](https://gitpod.io) workspace with the project set up and Fly pre-installed

[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/remix-run/indie-stack/tree/main)

## Development

- This step only applies if you have opted out of having the CLI install dependencies for you:

  ```sh
  npx remix init
  ```

- Initial setup: _If you just generated this project, this step has been done for you._

  ```sh
  npm run setup
  ```

- Start dev server:

  ```sh
  npm run dev
  ```

This starts your app in development mode, rebuilding assets on file changes.

The database seed script creates a new user with some data you can use to get started:

- Email: `rachel@remix.run`
- Password: `racheliscool`

### Relevant code

This is a pretty simple note-taking app, but it is a good example of how you can build a full stack app with Prisma and
Remix. The main functionality is creating users, logging in and out, and creating and deleting notes.

- creating users, and logging in and out [./app/models/user.server.ts](./app/models/user.server.ts)
- user sessions, and verifying them [./app/session.server.ts](./app/session.server.ts)
- creating, and deleting notes [./app/models/note.server.ts](./app/models/note.server.ts)

## Deployment

This Remix Stack comes with two GitHub Actions that handle automatically deploying your app to production and staging
environments.

Prior to your first deployment, you will need to do a few things:

- [Install Fly](https://fly.io/docs/getting-started/installing-flyctl/)

- Sign up and log in to Fly

  ```sh
  fly auth signup
  ```

  > **Note:** If you have more than one Fly account, ensure that you're signed into the same account in the Fly CLI as
  > you're in the browser. In your terminal, run `fly auth whoami` and ensure the email matches the Fly account signed
  > into the browser.

- Create two apps on Fly, one for staging and one for production:

  ```sh
  fly apps create miles-dash-c878
  fly apps create miles-dash-c878-staging
  ```

  > **Note:** Make sure this name matches the `app` set in your `fly.toml` file. Otherwise, you will not be able to
  > deploy.

  - Initialize Git.

  ```sh
  git init
  ```

- Create a new [GitHub Repository](https://repo.new), and then add it as the remote for your project. **Don't push your
  app yet!**

  ```sh
  git remote add origin <ORIGIN_URL>
  ```

- Add a `FLY_API_TOKEN` to your GitHub repo. To do this, go to your user settings on Fly and create a
  new [token](https://web.fly.io/user/personal_access_tokens/new), then add it
  to [your repo secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) with the
  name `FLY_API_TOKEN`.

- Add a `SESSION_SECRET` to your fly app secrets, to do this you can run the following commands:

  ```sh
  fly secrets set SESSION_SECRET=$(openssl rand -hex 32) --app miles-dash-c878
  fly secrets set SESSION_SECRET=$(openssl rand -hex 32) --app miles-dash-c878-staging
  ```

  If you don't have openssl installed, you can also use [1password](https://1password.com/password-generator/) to
  generate a random secret, just replace `$(openssl rand -hex 32)` with the generated secret.

- Create a persistent volume for the sqlite database for both your staging and production environments. Run the
  following:

  ```sh
  fly volumes create data --size 1 --app miles-dash-c878
  fly volumes create data --size 1 --app miles-dash-c878-staging
  ```

Now that everything is set up you can commit and push your changes to your repo. Every commit to your `main` branch will
trigger a deployment to your production environment, and every commit to your `dev` branch will trigger a deployment to
your staging environment.

### Connecting to your database

The sqlite database lives at `/data/sqlite.db` in your deployed application. You can connect to the live database by
running `fly ssh console -C database-cli`.

### Getting Help with Deployment

If you run into any issues deploying to Fly, make sure you've followed all the steps above and if you have, then post
as many details about your deployment (including your app name)
to [the Fly support community](https://community.fly.io). They are normally pretty responsive over there and hopefully
can help resolve any of your deployment issues and questions.

## GitHub Actions

We use GitHub Actions for continuous integration and deployment. Anything that gets into the `main` branch will be
deployed to production after running tests/build/etc. Anything in the `dev` branch will be deployed to staging.

## Testing

### Cypress

We use Cypress for our End-to-End tests in this project. You will find those in the `cypress` directory. As you make
changes, add to an existing file or create a new file in the `cypress/e2e` directory to test your changes.

We use [`@testing-library/cypress`](https://testing-library.com/cypress) for selecting elements on the page
semantically.

To run these tests in development, run `npm run test:e2e:dev` which will start the dev server for the app as well as the
Cypress client. Make sure the database is running in docker as described above.

We have a utility for testing authenticated features without having to go through the login flow:

```ts
cy.login();
// you are now logged in as a new user
```

We also have a utility to auto-delete the user at the end of your test. Just make sure to add this in each test file:

```ts
afterEach(() => {
  cy.cleanupUser();
});
```

That way, we can keep your local db clean and keep your tests isolated from one another.

### Vitest

For lower level tests of utilities and individual components, we use `vitest`. We have DOM-specific assertion helpers
via [`@testing-library/jest-dom`](https://testing-library.com/jest-dom).

### Type Checking

This project uses TypeScript. It's recommended to get TypeScript set up for your editor to get a really great in-editor
experience with type checking and auto-complete. To run type checking across the whole project, run `npm run typecheck`.

### Linting

This project uses ESLint for linting. That is configured in `.eslintrc.js`.

### Formatting

We use [Prettier](https://prettier.io/) for auto-formatting in this project. It's recommended to install an editor
plugin (like the [VSCode Prettier plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode))
to get auto-formatting on save. There is also a `npm run format` script you can run to format all files in the project.
