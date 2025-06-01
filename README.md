Welcome to your new TanStack app!

# Getting Started

To run this application:

```bash
pnpm install
pnpm start
```

# Building For Production

To build this application for production:

```bash
pnpm build
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
pnpm test
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
pnpx shadcn@latest add button
```

## Routing

This project uses [TanStack Router](https://tanstack.com/router). The initial setup is a file based router. Which means that the routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add another a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you use the `<Outlet />` component.

Here is an example layout that includes a header:

```tsx
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Link } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
```

The `<TanStackRouterDevtools />` component is not required so you can remove it if you don't want it in your layout.

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/people",
  loader: async () => {
    const response = await fetch("https://swapi.dev/api/people");
    return response.json() as Promise<{
      results: {
        name: string;
      }[];
    }>;
  },
  component: () => {
    const data = peopleRoute.useLoaderData();
    return (
      <ul>
        {data.results.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    );
  },
});
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

### React-Query

React-Query is an excellent addition or alternative to route loading and integrating it into you application is a breeze.

First add your dependencies:

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

Next we'll need to create a query client and provider. We recommend putting those in `main.tsx`.

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ...

const queryClient = new QueryClient();

// ...

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

You can also add TanStack Query Devtools to the root route (optional).

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <ReactQueryDevtools buttonPosition="top-right" />
      <TanStackRouterDevtools />
    </>
  ),
});
```

Now you can use `useQuery` to fetch your data.

```tsx
import { useQuery } from "@tanstack/react-query";

import "./App.css";

function App() {
  const { data } = useQuery({
    queryKey: ["people"],
    queryFn: () =>
      fetch("https://swapi.dev/api/people")
        .then((res) => res.json())
        .then((data) => data.results as { name: string }[]),
    initialData: [],
  });

  return (
    <div>
      <ul>
        {data.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

You can find out everything you need to know on how to use React-Query in the [React-Query documentation](https://tanstack.com/query/latest/docs/framework/react/overview).

## State Management

Another common requirement for React applications is state management. There are many options for state management in React. TanStack Store provides a great starting point for your project.

First you need to add TanStack Store as a dependency:

```bash
pnpm add @tanstack/store
```

Now let's create a simple counter in the `src/App.tsx` file as a demonstration.

```tsx
import { useStore } from "@tanstack/react-store";
import { Store } from "@tanstack/store";
import "./App.css";

const countStore = new Store(0);

function App() {
  const count = useStore(countStore);
  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>
        Increment - {count}
      </button>
    </div>
  );
}

export default App;
```

One of the many nice features of TanStack Store is the ability to derive state from other state. That derived state will update when the base state updates.

Let's check this out by doubling the count using derived state.

```tsx
import { useStore } from "@tanstack/react-store";
import { Store, Derived } from "@tanstack/store";
import "./App.css";

const countStore = new Store(0);

const doubledStore = new Derived({
  fn: () => countStore.state * 2,
  deps: [countStore],
});
doubledStore.mount();

function App() {
  const count = useStore(countStore);
  const doubledCount = useStore(doubledStore);

  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>
        Increment - {count}
      </button>
      <div>Doubled - {doubledCount}</div>
    </div>
  );
}

export default App;
```

We use the `Derived` class to create a new store that is derived from another store. The `Derived` class has a `mount` method that will start the derived store updating.

Once we've created the derived store we can use it in the `App` component just like we would any other store using the `useStore` hook.

You can find out everything you need to know on how to use TanStack Store in the [TanStack Store documentation](https://tanstack.com/store/latest).

# Demo files

Files prefixed with `demo` can be safely deleted. They are there to provide a starting point for you to play around with the features you've installed.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

# The Ants Event Scheduler PWA

A mobile-first Progressive Web App (PWA) for managing game events in "The Ants Underground Kingdom" game, with support for custom reminders.

## 🎮 Features

- **Game Event Scheduler**: 963+ weekly recurring game events with color-coded categories
- **Custom Reminders**: Personal reminders with flexible recurrence (hourly, daily, weekly)
- **Timezone-Aware**: Displays game events in your local timezone with UTC reference
- **PWA Support**: Install on mobile devices, works offline
- **Mobile-First Design**: Optimized for touch interfaces with compact UI
- **Smart Notifications**: Browser notifications for enabled events

## 🚀 Live Demo

Visit the live app: [https://nick.github.io/the-ants-helpers/](https://nick.github.io/the-ants-helpers/)

## 🛠️ Technology Stack

- **Framework**: React 19 with TanStack Router
- **Build Tool**: Vite 6 with PWA plugin
- **UI Library**: shadcn/ui components with Tailwind CSS
- **Database**: IndexedDB with Dexie.js
- **Deployment**: GitHub Pages with GitHub Actions

## 📱 Installation

### Install as PWA (Recommended)

1. Visit the live app in your mobile browser
2. Tap "Add to Home Screen" or "Install App"
3. The app will be installed like a native app

### Local Development

```bash
# Clone the repository
git clone https://github.com/nick/the-ants-helpers.git
cd the-ants-helpers

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run serve
```

## 🔧 Development Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run type-check` - Run TypeScript type checking
- `npm run serve` - Preview production build
- `npm test` - Run tests

## 🚀 Deployment to GitHub Pages

This project is automatically deployed to GitHub Pages using GitHub Actions.

### Automatic Deployment

- Push to `main` branch triggers automatic deployment
- GitHub Actions builds and deploys to GitHub Pages
- Live at: `https://[username].github.io/the-ants-helpers/`

### Manual Deployment

```bash
# Build for GitHub Pages
GITHUB_PAGES=true npm run build

# Deploy dist folder to gh-pages branch
# (if using manual deployment)
```

### Setup GitHub Pages

1. Go to repository Settings → Pages
2. Set Source to "GitHub Actions"
3. Push to main branch to trigger deployment

## 📋 Game Events

The app includes 963+ game events organized by:

- **Building Speed-ups** (Yellow): ускорения на стройку
- **Evolution Speed-ups** (Blue): ускорения на эволюцию
- **Hatching Speed-ups** (Green): ускорения на вылуп
- **Special Events** (🍇): Extra rewards and rare events
- **Mixed Categories**: Combination events

## 🕐 Timezone Support

- Game events stored in UTC, displayed in local timezone
- Automatic timezone detection
- Visual timezone indicators
- DST (Daylight Saving Time) aware

## 📱 PWA Features

- **Offline Support**: Works without internet connection
- **Install Prompt**: Add to home screen functionality
- **Push Notifications**: Browser-based notifications
- **App-like Experience**: Full-screen, native feel
- **Auto-updates**: Automatic app updates when available

## 🔧 Configuration

### Environment Variables

- `GITHUB_PAGES=true` - Enables GitHub Pages base path
- `NODE_ENV=production` - Production build mode

### Vite Configuration

The app automatically configures base paths for GitHub Pages deployment.

## 📊 Performance

- **Bundle Size**: ~530KB gzipped
- **First Load**: <2s on 3G
- **Lighthouse Score**: 95+ PWA score
- **Mobile Optimized**: 44px+ touch targets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Create Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Bug Reports

Please report bugs by creating an issue in the [GitHub repository](https://github.com/nick/the-ants-helpers/issues).

---

Made with ❤️ for The Ants Underground Kingdom players
