# Chatbot UI

A modern, extensible ChatGPT-like UI built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- Responsive, pixel-perfect chat interface for desktop and mobile
- Markdown rendering for both user and assistant messages
- File upload with previews and drag-and-drop
- Animated character-by-character assistant message rendering
- Sidebar, mobile header, and mobile navbar navigation
- Model toggle, emoji picker, and more
- Full test coverage for core utilities and hooks

## Requirements

- **Node.js v22 or higher** (tested on Node 24.1)
- npm v9 or higher

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:5173](http://localhost:5173) by default.

3. **Build for production:**

   ```bash
   npm run build
   ```

4. **Preview the production build:**

   ```bash
   npm run preview
   ```

5. **Lint the code:**

   ```bash
   npm run lint
   ```

6. **Run tests:**
   ```bash
   npm run test
   ```
   - Uses Jest and React Testing Library
   - Test files are colocated with source files (e.g., `src/utils/helper.test.ts`)

## Project Structure

- `src/components/` — UI components (ChatArea, ChatInput, Sidebar, etc.)
- `src/pages/Chat.tsx` — Main chat page logic
- `src/utils/` — Utility functions and constants
- `src/hooks/` — Custom React hooks (e.g., `useIsMobile`)
- `src/styles/` — Tailwind and custom CSS

## Implementation Notes

- Uses [Vite](https://vitejs.dev/) for fast development and builds
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Jest](https://jestjs.io/) for unit testing
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for hooks and component tests
- TypeScript strict mode enabled
- Modern React patterns (hooks, functional components, context)

## Customization

- Update theme colors in `src/styles/index.css`
- Add or modify icons in `src/assets/icons/`
- Extend chat logic in `src/pages/Chat.tsx`

## License

MIT
