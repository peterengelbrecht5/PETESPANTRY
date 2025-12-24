import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

// Add FontAwesome icons to the library
library.add(fas, fab);

createRoot(document.getElementById("root")!).render(<App />);
