import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { AuthGuard } from "./AuthGuard";
import { DemoProvider } from "./DemoContext";
import { Layout } from "./components/Layout";
import { BoardPage } from "./pages/BoardPage";
import { RecipesPage } from "./pages/RecipesPage";
import { BindingsPage } from "./pages/BindingsPage";

export function LoginRedirect() {
  return <Navigate to="/board" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <DemoProvider>
        <BrowserRouter>
          <AuthGuard>
            <Routes>
              <Route path="/login" element={<LoginRedirect />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/board" replace />} />
                <Route path="board" element={<BoardPage />} />
                <Route path="recipes" element={<RecipesPage />} />
                <Route path="bindings" element={<BindingsPage />} />
                <Route path="*" element={<Navigate to="/board" replace />} />
              </Route>
            </Routes>
          </AuthGuard>
        </BrowserRouter>
      </DemoProvider>
    </AuthProvider>
  );
}

