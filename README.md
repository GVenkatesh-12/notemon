# Notemon-Pro

A full-featured, markdown-powered notes application with a skeuomorphic UI, built with React and TypeScript.

**Live:** [notemon-pro.vercel.app](https://notemon-pro.vercel.app)

---

## Features

- **Markdown Editor** — Write in Markdown with a rich formatting toolbar (bold, italic, headings, code blocks, tables, task lists, and more). Switch between edit and live preview modes instantly.
- **Syntax Highlighting** — Code blocks render with full syntax highlighting and a one-click copy button.
- **Auto-Save** — Notes are saved automatically after a short pause in typing, with a visible save status indicator.
- **Multi-Tab Interface** — Open multiple notes as tabs. Drag and drop to reorder them.
- **Zen Mode** — A distraction-free, full-screen writing mode. Press `Esc` to exit.
- **Search & Sort** — Search notes by title or content. Sort by last modified, creation date, or title.
- **Dark / Light Theme** — Toggle between themes, with automatic system preference detection.
- **Adjustable Font Size** — Increase or decrease the editor font size, persisted across sessions.
- **Authentication** — Secure sign-up, login, and password change, backed by JWT-based auth.
- **Responsive Design** — Fully usable on mobile with a collapsible sidebar.
- **Word & Character Count** — Real-time stats displayed in the editor footer.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS 4 |
| State Management | Zustand |
| Routing | React Router DOM |
| Markdown | React Markdown + remark-gfm + rehype-raw |
| Code Highlighting | react-syntax-highlighter |
| HTTP Client | Axios |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Date Formatting | date-fns |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/GVenkatesh-12/notemon.git
cd notemon
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```
VITE_API_URL=https://your-api-url.com
```

If omitted, the app defaults to the hosted backend.

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── api/
│   └── client.ts            # Axios instance with auth interceptors
├── components/
│   ├── editor/
│   │   └── Editor.tsx        # Markdown editor with toolbar & preview
│   ├── layout/
│   │   ├── Sidebar.tsx       # Note list, search, sort, logout
│   │   └── TabBar.tsx        # Draggable tab system
│   ├── ui/
│   │   ├── ChangePasswordDialog.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── SkeuoButton.tsx
│   │   └── SkeuoInput.tsx
│   └── ThemeToggle.tsx       # Dark / light mode switch
├── pages/
│   ├── Dashboard.tsx         # Main app layout with zen mode
│   ├── Login.tsx
│   └── Register.tsx
├── store/
│   ├── authStore.ts          # Auth state (Zustand)
│   └── notesStore.ts         # Notes & tabs state (Zustand)
├── App.tsx                   # Routes & auth guards
└── main.tsx                  # Entry point
```

## License

MIT
