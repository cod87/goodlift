# Custom Instructions for AI on the `goodlift` Vite/React Project (v2 - Comprehensive)

You are an expert AI assistant tasked with developing the `goodlift` application. Your primary goal is to make accurate, high-quality, and context-aware changes to the codebase. Adhere strictly to the principles and instructions below.

## 1. Project Overview & Core Philosophy

- **Purpose**: A strength training application with randomized workout generation.
- **Core Philosophy**: This project prioritizes a clean, performant, and maintainable codebase. Note the existence of `OPTIMIZATION_SUMMARY.md`, which indicates a strong focus on performance. Changes should be efficient and well-structured.

## 2. Core Technologies & Libraries

- **Framework**: React `19.x`
- **Build Tool**: Vite
- **Language**: JavaScript (with JSX)
- **Backend**: Firebase (Authentication & Firestore). All Firebase logic is abstracted into custom hooks.
- **Deployment**: Manual build to the `/docs` directory for GitHub Pages.

#### Key Libraries (You MUST know these):

-   **UI Library**: **Material-UI (MUI)**.
    -   **Action**: Always use MUI components (`<Box>`, `<Button>`, `<TextField>`, `<Typography>`, etc.) for building UI. Adhere to MUI's styling conventions (`sx` prop).
-   **Routing**: **`react-router-dom`**.
    -   **Action**: Use `<Link>` for navigation links and the `useNavigate()` hook for programmatic navigation.
-   **State Management**:
    -   **Global State**: React Context (`src/contexts/AuthContext.jsx`) for authentication status.
    -   **Server State**: **`@tanstack/react-query`**. Use this for fetching, caching, and managing data from Firestore. Do not fetch data directly in components using `useEffect`.
-   **Forms**: **`formik`**.
    -   **Action**: All forms MUST be built using Formik. Use the `<Formik>`, `<Form>`, `<Field>`, and `<ErrorMessage>` components.
-   **Data Visualization**: **`chart.js`** with **`react-chartjs-2`**.
    -   **Action**: When asked to create charts or graphs, use these libraries. Configure chart options and data structures as required by `chart.js`.
-   **Animations**:
    -   **`framer-motion`**: For complex UI animations and transitions.
    -   **`lottie-react`**: For displaying Lottie JSON animations.
-   **Utilities**:
    -   **`date-fns`**: For all date formatting and manipulation.
    -   **`clsx`**: For conditionally combining class names, especially when mixing static and dynamic classes.
    -   **`papaparse`**: For parsing CSV files. This is likely used for data import/export features.
-   **Icons**:
    -   **`@mui/icons-material`**: The primary source for icons.
    -   **`react-icons`**: A secondary source if an icon is not available in MUI.

## 3. File Structure, Build Process, & Deployment

This project's deployment strategy is critical. You MUST understand and respect it.

-   **`vite.config.js`**:
    -   `base: '/goodlift/'`: The production base path. **All absolute asset paths must be prefixed with this.**
    -   `outDir: 'docs'`: Vite builds the project into the `docs/` directory.
    -   `manualChunks`: The project uses an advanced chunking strategy to optimize loading performance. **Do not modify this configuration unless explicitly asked.**

-   **Deployment is Manual via GitHub Pages**:
    1.  Code is changed in `src/`.
    2.  The developer runs `npm run build`.
    3.  Vite generates the production-ready site in the `docs/` folder.
    4.  The **`docs/`** folder is **committed to Git**.
    5.  GitHub Pages serves the site from the `/docs` folder on the `main` branch.

-   **`index.html` (Project Root)**:
    -   The main HTML entry point. Use for global `<meta>`, `<link>`, and CDN `<script>` tags.

-   **`public/` Directory**:
    -   For static assets (`favicon.ico`, `manifest.json`, etc.).
    -   Paths to these assets in `index.html` **must be prefixed** with the base path to work correctly on the live site (e.g., `href="/goodlift/my-icon.png"`).

-   **`src/` Directory**:
    -   `src/main.jsx`: App entry point. Wraps `<App />` in the `AuthProvider`.
    -   `src/App.jsx`: Contains the `react-router-dom` routing setup.
    -   `src/components/`: Small, reusable components.
    -   `src/pages/`: Top-level components for each page/route.
    -   `src/hooks/`: **Crucial folder.** Contains all business logic, especially for Firebase interactions (e.g., `useAuth`, `useFirestore`).
    -   `src/contexts/`: React context providers.
    -   `src/assets/`: Assets imported directly into React components.

## 4. Coding Conventions & Best Practices

-   **ESLint (`eslint.config.js`)**:
    -   A specific rule is configured: `no-unused-vars` allows variables named `motion` or variables in `ALL_CAPS_SNAKE_CASE`. Respect this convention.
-   **Firebase Abstraction**: Never use Firebase SDK functions directly in components. Always go through a hook from `src/hooks/`. If functionality is missing, add it to the appropriate hook.
-   **Documentation**: The repository contains important markdown files like `FIREBASE_SETUP.md` and `DEPLOYMENT.md`. Refer to them if you have questions about the setup.
-   **Changelog**: The project has a `CHANGELOG.md`. When adding features or significant fixes, propose an entry for this file.

## 5. How to Handle Specific Tasks

#### Task: Adding a Static Icon
1.  **File Location**: Place the icon (e.g., `new-icon.png`) in `public/`.
2.  **HTML Update**: Open the root `index.html`.
3.  **Link Tag**: Add `<link rel="icon" href="/goodlift/new-icon.png">` to the `<head>`. **The `/goodlift/` prefix is mandatory.**

#### Task: Creating a New Form
1.  **File Location**: Create a new component in `src/components/` or `src/pages/`.
2.  **Use Formik**: Structure the form using `<Formik>`, `<Form>`, `<Field>`, and MUI's `<TextField>`.
3.  **Validation**: Use Formik's `validationSchema` prop with Yup (or a similar library if present) for validation.
4.  **Submission**: Handle form submission with the `onSubmit` prop, calling a function from a relevant hook in `src/hooks/` to process the data.

#### Task: Displaying a New Chart
1.  **Data Hook**: Ensure the data is fetched via `@tanstack/react-query` in a custom hook.
2.  **Component**: In a component, import `Bar`, `Line`, or `Pie` from `react-chartjs-2`.
3.  **Configuration**: Create `options` and `data` objects according to `chart.js` documentation.
4.  **Render**: Render the chart component with the `options` and `data` props.

#### Task: Proposing a Deployment Update
If your changes are ready for deployment, your response should include these instructions for the user:
> "To deploy these changes, please run the following commands:
> ```bash
> npm run build
> git add docs/
> git commit -m "feat: Describe the feature or change"
> git push origin main
> ```"

## 6. Final Checklist

1.  **Library Choice**: Am I using the correct library for the task (MUI for UI, Formik for forms, Chart.js for charts)?
2.  **Abstraction**: Is all backend logic contained within a hook in `src/hooks/`?
3.  **Asset Paths**: If I added a static asset, is the path in `index.html` prefixed with `/goodlift/`?
4.  **Conventions**: Am I following the project's ESLint rules and coding patterns?
5.  **Deployment**: Am I aware of the manual build-and-commit process for the `docs/` folder?
