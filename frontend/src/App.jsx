import "./App.css";
import heroImg from "./assets/hero-factory.jpg";

function App() {
  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const applicant = {
      name: String(formData.get("name") || "").trim(),
      mobile: String(formData.get("mobile") || "").trim(),
    };

    if (!applicant.name) {
      alert("Please enter your full name.");
      return;
    }

    if (!/^\d{10}$/.test(applicant.mobile)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(applicant.mobile)) {
      alert("Mobile number must start with 6, 7, 8, or 9.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/apply",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(applicant),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Application submission failed."
        );
      }

      alert("Application submitted successfully!");
      form.reset();
    } catch (error) {
      console.error("Application error:", error);

      alert(
        error.message ||
        "Unable to submit application. Please try again."
      );
    }
  };

  return (
    <main className="job-page">
      <header className="top-bar">
        <div className="brand">
          <div className="logo-badge">
            <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
              <rect x="18" y="28" width="10" height="16" rx="1" fill="#ffcc32" />
              <rect x="30" y="22" width="16" height="22" rx="1" fill="#ffcc32" />
              <rect x="21" y="31" width="3" height="4" rx="0.5" fill="#102f4e" />
              <rect x="33" y="26" width="3.5" height="5" rx="0.5" fill="#102f4e" />
              <rect x="39" y="26" width="3.5" height="5" rx="0.5" fill="#102f4e" />
              <rect x="33" y="34" width="9.5" height="3.5" rx="0.5" fill="#102f4e" />
              <rect x="16" y="44" width="32" height="3" rx="1.5" fill="#ffcc32" />
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-title">Quality Inspection & Production</div>
            <span className="job-vacancy-badge">JOB VACANCY</span>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">CAREER OPPORTUNITY</p>

          <h1>
            Quality Inspection
            <span> & Production</span>
          </h1>

          <p className="hero-subtitle">Build your career with us.</p>

          <a href="#apply" className="top-apply-btn">
            Apply Now <span>→</span>
          </a>
        </div>
        <div className="hero-image-wrap">
          <img
            src={heroImg}
            alt="Industrial factory quality inspection and production of metal parts"
            className="hero-image"
          />
        </div>
      </section>

      <section className="job-details">
        <div className="detail">
          <span className="detail-icon">💼</span>
          <div>
            <h3>Work</h3>
            <p>Quality Inspection and Production</p>
          </div>
        </div>

        <div className="detail">
          <span className="detail-icon">📞</span>
          <div>
            <h3>Contact Number</h3>
            <p>9022746205</p>
          </div>
        </div>

        <div className="detail">
          <span className="detail-icon">👤</span>
          <div>
            <h3>Contact Person</h3>
            <p>P.J. Patil</p>
          </div>
        </div>

        <div className="detail">
          <span className="detail-icon">📍</span>
          <div>
            <h3>Location</h3>
            <p>MIDC Waluj, Chh. Sambhajinagar</p>
          </div>
        </div>

        <div className="detail">
          <span className="detail-icon">🎓</span>
          <div>
            <h3>Eligibility</h3>
            <p>
              10th, 12th, ITI, Diploma and Any Graduate
            </p>
          </div>
        </div>

        <div className="detail">
          <span className="detail-icon">👥</span>
          <div>
            <h3>Gender</h3>
            <p>Male & Female</p>
          </div>
        </div>
      </section>

      <section className="application-section" id="apply">
        <div className="application-info">
          <span className="form-icon">📋</span>
          <h2>Interested?</h2>
          <h2 className="yellow-text">Apply Now</h2>

          <p>
            Fill in your details and submit your application.
            We will get back to you soon.
          </p>
        </div>

        <form
          className="application-form"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            aria-label="Full Name"
            autoComplete="name"
            required
          />

          <input
            type="tel"
            name="mobile"
            placeholder="Mobile Number"
            aria-label="Mobile Number"
            autoComplete="tel"
            inputMode="numeric"
            maxLength={10}
            pattern="[6-9][0-9]{9}"
            title="Enter a valid 10-digit Indian mobile number"
            required
          />

          <button type="submit">
            Submit Application →
          </button>
        </form>
      </section>

      <footer className="job-footer">
        Your Future Starts Here
      </footer>
    </main>
  );
}

export default App;