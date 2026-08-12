import PixelBreathingBackground from "../components/PixelBreathingBackground";
import beachImg from "../assets/Beach-pixel.png";
import "../styles/landing.css";
import hhweb from "../assets/hhweb.png";
import studioLogo from "../assets/247.png";
import { useState } from "react";
import { Link } from "react-router-dom";

const ROLES = [
  "BUILDER", "HACKER", "MENTOR", "ORGANIZER", "VOLUNTEER", "SPEAKER", "STAFF",
];

const initialData = {
  name: "",
  team: "",
  role: "",
  skills: [],
  from: "",
  destination: "GOA",
  photo: null,
  participantId: "HH-GOA-" + Math.floor(1000 + Math.random() * 9000),
};

function PixelPill({ id, title, status, isOpen, onToggle, children }) {
  return (
    <section id={`pill-${id}`} className="gen-pill pixel-pill">
      <button
        type="button"
        className="gen-pill-header"
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        aria-controls={`pill-body-${id}`}
      >
        <span className={`gen-pill-dot ${status ? "done" : ""}`}>
          {status ? "●" : "○"}
        </span>
        <span>{title}</span>
        <span className="gen-pill-arrow">{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen && (
        <div id={`pill-body-${id}`} className="gen-pill-body">
          {children}
        </div>
      )}
    </section>
  );
}

export default function GeneratorPage() {
  const [data, setData] = useState(initialData);
  const [openPill, setOpenPill] = useState("participant");
  const [skillInput, setSkillInput] = useState("");

  const update = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePill = (id) => {
    const nextOpenPill = openPill === id ? null : id;
    setOpenPill(nextOpenPill);
    if (nextOpenPill) {
      setTimeout(() => {
        document.getElementById(`pill-${id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => update("photo", reader.result);
    reader.readAsDataURL(file);
  };

  const addSkill = () => {
    const trimmedSkill = skillInput.trim();
    if (!trimmedSkill) return;
    const normalizedSkill = trimmedSkill.toUpperCase();
    if (data.skills.includes(normalizedSkill)) {
      setSkillInput("");
      return;
    }
    update("skills", [...data.skills, normalizedSkill]);
    setSkillInput("");
  };

  const removeSkill = (index) => {
    update("skills", data.skills.filter((_, idx) => idx !== index));
  };

  const progress = [data.name, data.team, data.role].filter(Boolean).length;

  return (
    <main
      className="generator-page"
      style={{
        position: "relative",
        width: "100%",
        minWidth: 0,
        minHeight: "100dvh",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div
        className="generator-background-layer"
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100dvh",
          zIndex: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <PixelBreathingBackground src={beachImg} className="generator-background" />
      </div>

      <div className="gen-header-row">
        <div className="gen-header-pill gen-header-pill-hh pixel-pill">
          <img src={hhweb} alt="Hacker House" />
        </div>
        <div className="gen-header-pill gen-header-pill-247 pixel-pill">
          <img src={studioLogo} alt="247 Studio" />
        </div>
      </div>

      <div
        className="generator-content"
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          minHeight: "100dvh",
          boxSizing: "border-box",
        }}
      >
        <div className="generator-left">
          <div className="gen-progress-bar pixel-pill">
            <span>CREATE YOUR ID</span>
            <span>{progress}/3</span>
          </div>

          <PixelPill id="participant" title="PARTICIPANT" status={!!data.name} isOpen={openPill === "participant"} onToggle={togglePill}>
            <label htmlFor="participant-name">FULL NAME</label>
            <input
              id="participant-name"
              type="text"
              value={data.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Emmanuel P Babu"
              className="gen-input"
            />

            <label htmlFor="participant-photo">PHOTO</label>
            <input
              id="participant-photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="gen-input"
            />
            {data.photo && <div className="gen-photo-status">PHOTO UPLOADED ✓</div>}
          </PixelPill>

          <PixelPill id="team" title="TEAM" status={!!data.team} isOpen={openPill === "team"} onToggle={togglePill}>
            <label htmlFor="team-name">TEAM NAME</label>
            <input
              id="team-name"
              type="text"
              value={data.team}
              onChange={(e) => update("team", e.target.value)}
              placeholder="BUILDERS"
              className="gen-input"
            />
          </PixelPill>

          <PixelPill id="role" title="ROLE" status={!!data.role} isOpen={openPill === "role"} onToggle={togglePill}>
            <div className="gen-role-grid">
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`gen-role-btn ${data.role === role ? "active" : ""}`}
                  onClick={() => update("role", role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </PixelPill>

          <PixelPill id="tech" title="TECH" status={data.skills.length > 0} isOpen={openPill === "tech"} onToggle={togglePill}>
            <div className="gen-skill-input-row">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="React"
                className="gen-input"
              />
              <button type="button" onClick={addSkill} className="gen-add-btn pixel-pill">
                ADD
              </button>
            </div>

            {data.skills.length > 0 && (
              <div className="gen-skill-tags">
                {data.skills.map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="gen-skill-tag"
                    onClick={() => removeSkill(index)}
                    role="button"
                    tabIndex={0}
                    title="Click to remove"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        removeSkill(index);
                      }
                    }}
                  >
                    {skill} ×
                  </span>
                ))}
              </div>
            )}
          </PixelPill>

          <PixelPill id="travel" title="TRAVEL" status={!!data.from} isOpen={openPill === "travel"} onToggle={togglePill}>
            <label htmlFor="travel-from">FROM</label>
            <input
              id="travel-from"
              type="text"
              value={data.from}
              onChange={(e) => update("from", e.target.value)}
              placeholder="KOCHI, KERALA"
              className="gen-input"
            />
            <label htmlFor="travel-destination">TO</label>
            <input
              id="travel-destination"
              type="text"
              value={data.destination}
              readOnly
              className="gen-input"
            />
          </PixelPill>
        </div>

        <div className="generator-right">
          <div className="id-card-preview pixel-pill">
            <div className="id-card-header">HACKER HOUSE GOA 2026</div>

            <div className="id-card-photo">
              {data.photo ? <img src={data.photo} alt="Participant" /> : "PHOTO"}
            </div>

            <div className="id-card-name">{data.name || "YOUR NAME"}</div>
            <div className="id-card-role">{data.role || "ROLE"}</div>
            <div className="id-card-team">{data.team || "TEAM"}</div>

            {(data.from || data.destination) && (
              <div className="id-card-travel">
                {data.from || "FROM"} → {data.destination}
              </div>
            )}

            <div className="id-card-skills">
              {data.skills.map((skill, index) => (
                <span key={`${skill}-${index}`} className="id-card-skill-badge">
                  {skill}
                </span>
              ))}
            </div>

            <div className="id-card-id">{data.participantId}</div>
          </div>

          <Link to="/FinalPage" className="gen-continue-btn pixel-pill">
            CONTINUE
          </Link>
        </div>
      </div>
    </main>
  );
}