import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@tensorflow/tfjs";

createRoot(document.getElementById("root")!).render(<App />);
