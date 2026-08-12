import { Link } from "react-router-dom";
import PixelBreathingBackground from "./PixelBreathingBackground";
import beachImg from "../assets/Beach-pixel.png";
import hhweb from "../assets/hhweb.png";
import studioLogo from "../assets/247.png";
import hhSquare from "../assets/HH (1).png";

export default function Hero() {
  return (
    <section
      className="hero-section"
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: "100vh",
        overflow: "hidden",
      }}
    >
      <PixelBreathingBackground src={beachImg} className="hero-background" />

      <div
        className="hero"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
        }}
      >
        <img
          src={studioLogo}
          alt="Studio"
          style={{
            position: "absolute",
            top: "24px",
            left: "24px",
            width: "90px",
            height: "auto",
            zIndex: 5,
          }}
        />

        <nav className="pill-nav mobile-only">
          <Link to="/generator" className="pill-nav-link pill-nav-active pixel-pill">
            CREATE YOUR ID
          </Link>
        </nav>

        <div className="hero-center">
          <picture>
            <source media="(max-width: 767px)" srcSet={hhSquare} />
            <img src={hhweb} alt="Hacker House Goa" className="hero-wordmark" />
          </picture>

          <Link
            to="/generator"
            className="pill-nav-link pill-nav-active pixel-pill desktop-only"
          >
            CREATE YOUR ID
          </Link>
        </div>
      </div>
    </section>
  );
}