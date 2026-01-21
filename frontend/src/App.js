import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FunnelAnalyzer from "@/components/FunnelAnalyzer";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FunnelAnalyzer />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;