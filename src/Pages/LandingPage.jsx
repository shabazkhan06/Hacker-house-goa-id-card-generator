// LandingPage.jsx
import Hero from "../components/Hero";
import "../styles/landing.css";

export default function LandingPage() {
  return (
    <>
      <Hero />  {/* full-bleed, NOT inside a centered container */}
      {/* rest of your page content can go inside a normal container below */}
    </>
  );
}   
