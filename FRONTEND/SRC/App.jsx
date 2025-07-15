import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import Weather from "./pages/weather";
import Translator from "./pages/translator";
import Currency from "./pages/currency";
import ChatBot from "./pages/chatbot";
import CollaborativeCanvas from "./pages/CollaborativeCanvas";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useChatStore } from "./store/useChatStore";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();
  const { theme } = useThemeStore();
  const { subscribeToMessages, unsubscribeFromMessages } = useChatStore();

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle socket connection and subscriptions
  useEffect(() => {
    if (authUser && socket) {
      subscribeToMessages();
      return () => {
        unsubscribeFromMessages();
      };
    }
  }, [authUser, socket]);

  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div data-theme={theme}>
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/weather" element={authUser ? <Weather /> : <Navigate to="/login" />} />
        <Route path="/translator" element={authUser ? <Translator /> : <Navigate to="/login" />} />
        <Route path="/currency" element={authUser ? <Currency /> : <Navigate to="/login" />} />
        <Route path="/chatbot" element={authUser ? <ChatBot /> : <Navigate to="/login" />} />
        <Route path="/CollaborativeCanvas" element={authUser ? <CollaborativeCanvas /> : <Navigate to="/login" />} />
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;
