import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AdminAuthProvider>
    </ThemeProvider>
  );
}
