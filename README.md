# ScreenShare App

A modern screen sharing application built with TypeScript, featuring web, desktop, and backend components.

## Project Structure

This is a monorepo project using workspaces with the following packages:

- **backend** - Node.js/Express server with Socket.io for real-time communication
- **frontend** - React web application built with Vite
- **desktop** - Desktop application built with Tauri
- **shared** - Shared TypeScript types and utilities

## Prerequisites

- Node.js 18+ or Bun
- Docker (for database)
- Rust (for desktop app development with Tauri)

## Installation

```bash
# Install dependencies
bun install
# or
npm install
```

## Development

```bash
# Start all services in development mode
bun run dev

# Or start specific services
bun run dev:backend   # Start backend server
bun run dev:frontend  # Start frontend app
bun run dev:desktop   # Start desktop app

# Database management
bun run db:start      # Start database container
bun run db:stop       # Stop database container
bun run db:reset      # Reset database
```

## Building

```bash
# Build all packages
bun run build

# Or build specific packages
bun run build:backend
bun run build:frontend
bun run build:desktop
```

## Scripts

- `dev` - Run all packages in development mode
- `build` - Build all packages
- `clean` - Clean all build artifacts
- `db:start` - Start Docker database container
- `db:stop` - Stop Docker database container
- `db:reset` - Reset database to initial state

## Technologies

- **Backend**: Node.js, Express, Socket.io, TypeScript
- **Frontend**: React, Vite, TypeScript
- **Desktop**: Tauri, TypeScript
- **Database**: Docker-based solution
- **Package Manager**: Bun/npm with workspaces

## License

Private