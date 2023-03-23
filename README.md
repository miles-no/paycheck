# Miles Timesheets

## Local database

https://www.prisma.io/dataguide/postgresql/setting-up-a-local-postgresql-database

> Version 14 is currently used in our google cloud-instance, so it is recommended to use the same version locally.
 


## Using git-secret

This repository uses `git-secret` to encrypt sensitive files such as environment variables. `git-secret` allows you to store encrypted versions of these files in the repository while keeping the unencrypted versions only on machines that have the decryption key.

To use `git-secret`, you'll need to have GPG installed and set up on your machine. Once you've done that, you'll need to be added to the list of users who're allowed to decrypt the files. You can contact `henry.sjoen@miles.no` to request access.
Or run `git secret whoknows` to see other users who have access.

Once you've been added, you can decrypt the sensitive files by running `git secret reveal`. Make sure to never commit unencrypted versions of these files to the repository!

## Pages and Guards

This is the list of pages and guards that should be implemented for this project. The path is the URL path that should
be used for the page. The guard is a description of the logic that should be used to determine if a user should be able
to access the page. If a user is not able to access the page, they should be redirected to the error page.

### Login Page

- Path: /login
- Guard: If the user is already logged in, they should be redirected to the home page.

[//]: # "### Home Page"
[//]: # "- Path: `/home`"
[//]: # "- Guard: Only authenticated users should be able to access this page. If a user is not logged in, they should be"
[//]: # "redirected to the login page."

### Employee List Page

- Path: `/employees`
- Guard: Only users who're identified as managers should be able to access this page. If a user is not a manager, they
  should be redirected to the home page.

### Employee Timesheet Page

- Path: /employees/{employeeId}/timesheets/{year}/{month}
- Guard: Only users who're identified as employees or managers should be able to access this page. If a user is not an
  employee or manager, they should be redirected to the home page. Additionally, if a user is a manager, they should
  only
  be able to access the timesheet for employees who report to them.

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

#### Special cases

S-102 should be paid at 1000 kr an hour.
S-107 should be paid at 50% of the "Main project".

### Error Page

- Path: `/error`
- Guard: This page should be accessible to all users.

## What's in the stack

> This project is based on the remix-indie stack as shown below. We might not use all of the stack or have decided on going a different direction, (like google auth instead of handling it ourselves), so there are some parts of the code that should be removed.

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

- This step only applies if you've opted out of having the CLI install dependencies for you:

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

This is a pretty simple note-taking app, but it's a good example of how you can build a full stack app with Prisma and
Remix. The main functionality is creating users, logging in and out, and creating and deleting notes.

- creating users, and logging in and out [./app/models/user.server.ts](./app/models/user.server.ts)
- user sessions, and verifying them [./app/session.server.ts](./app/session.server.ts)
- creating, and deleting notes [./app/models/note.server.ts](./app/models/note.server.ts)

## Deployment

This Remix Stack comes with two GitHub Actions that handle automatically deploying your app to production and staging
environments.

Prior to your first deployment, you'll need to do a few things:

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
to [the Fly support community](https://community.fly.io). They're normally pretty responsive over there and hopefully
can help resolve any of your deployment issues and questions.

## GitHub Actions

We use GitHub Actions for continuous integration and deployment. Anything that gets into the `main` branch will be
deployed to production after running tests/build/etc. Anything in the `dev` branch will be deployed to staging.

## Testing

### Cypress

We use Cypress for our End-to-End tests in this project. You'll find those in the `cypress` directory. As you make
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
to get auto-formatting on save. There's also a `npm run format` script you can run to format all files in the project.
