This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## shadcn/ui

This project uses [shadcn/ui](https://ui.shadcn.com/) for UI components.

### Adding Components

To add a new shadcn/ui component to your project, run:

```bash
npx shadcn@latest add [component-name]
```

For example:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

Components will be installed to `app/(components)/shadcn/ui/`.

### Using Components

Import and use components in your app:

```tsx
import { Button } from '@/(components)/shadcn/ui/button';

export default function MyPage() {
  return <Button>Click me</Button>;
}
```

### Styling Utilities

The `cn` utility function is available for merging Tailwind CSS classes:

```tsx
import { cn } from '@/utils/cn';

<div className={cn('base-class', condition && 'conditional-class')} />;
```
