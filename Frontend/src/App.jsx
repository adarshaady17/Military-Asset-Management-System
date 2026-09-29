import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext.jsx";
import { BaseProvider } from "./context/BaseContext.jsx";
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BaseProvider>
          <AppRoutes />
          <Toaster position="top-right" />
        </BaseProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
