import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import GeneratorPage from "./pages/GeneratorPage";
import PixelBreathingBackground from "./components/PixelBreathingBackground";
import FinalPage from "./pages/FinalPage";
import LoadoutPage from "./pages/LoadoutPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/generator" element={<GeneratorPage />} />
        <Route path="/FinalPage" element={<FinalPage />} />
        <Route path="/loadout" element={<LoadoutPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;