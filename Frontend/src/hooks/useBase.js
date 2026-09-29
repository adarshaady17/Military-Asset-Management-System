import { useContext } from "react";
import { BaseContext } from "../context/BaseContextValue.js";
export const useBase = () => useContext(BaseContext);
