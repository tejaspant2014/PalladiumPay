import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css'
import { AuthProvider } from "./context/AuthContext.jsx";
import NavBar from "./components/NavBar.jsx";
import Footer from "./components/Footer.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
    <AuthProvider>
      <App />
    </AuthProvider>
);