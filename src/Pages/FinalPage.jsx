import PixelBreathingBackground from "../components/PixelBreathingBackground";
import beachImg from "../assets/Beach-pixel.png";
import "../styles/landing.css";
import { Link } from "react-router-dom";

export default function FinalPage() {
  return (
    <main className="final-page-wrapper">
      <div className="final-page-bg">
        <PixelBreathingBackground src={beachImg} />
      </div>

      <div className="final-title-pill pixel-pill">
        <h1>Choose your ID Card Template</h1>
      </div>

      <div className="final-panel"></div>

      <Link to="/loadout" className="final-loadout-btn pixel-pill">
        Loadout
      </Link>
    </main>
  );
}