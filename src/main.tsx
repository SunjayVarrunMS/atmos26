import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import './index.css';
import Layout from './layout/Layout';
import Home from './pages/Home';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'events', lazy: async () => ({ Component: (await import('./pages/Events')).default }) },
      { path: 'events/:id', lazy: async () => ({ Component: (await import('./pages/Event')).default }) },
      { path: 'proshows', lazy: async () => ({ Component: (await import('./pages/Proshows')).default }) },
      { path: 'gallery', lazy: async () => ({ Component: (await import('./pages/Gallery')).default }) },
      { path: 'sponsors', lazy: async () => ({ Component: (await import('./pages/Sponsors')).default }) },
      { path: 'contact', lazy: async () => ({ Component: (await import('./pages/Contact')).default }) },
      { path: '*', lazy: async () => ({ Component: (await import('./pages/NotFound')).default }) },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
