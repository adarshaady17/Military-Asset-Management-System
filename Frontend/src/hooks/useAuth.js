import { useContext } from "react";
import { AuthContext } from "../context/AuthContextValue.js";
export const useAuth = () => useContext(AuthContext);
