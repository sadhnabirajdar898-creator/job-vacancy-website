import { useRef, useState } from "react";
import "./App.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const QUALIFICATIONS = ["10th", "12th", "ITI", "Diploma", "Any Graduate"];

const detailIcons = {
  title: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
    </>
  ),
  qualification: (
    <>
      <path d="m2 9 10-5 10 5-10 5L2 9Z" />
      <path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5M22 9v6" />
    </>
  ),
  gender: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  location: (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
  ),
};

function DetailIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {detailIcons[name]}
    </svg>
  );
}

function validateApplicant(applicant) {
  const errors = {};

  if (!applicant.name) {
    errors.name = "Please enter your full name.";
  } else if (applicant.name.length < 2) {
    errors.name = "Please enter at least 2 characters for your name.";
  } else if (applicant.name.length > 80) {
    errors.name = "Please keep your name within 80 characters.";
  }

  if (!applicant.mobile) {
    errors.mobile = "Please enter your mobile number.";
  } else if (!/^\d{10}$/.test(applicant.mobile)) {
    errors.mobile = "Please enter a valid 10-digit mobile number.";
  } else if (!/^[6-9]\d{9}$/.test(applicant.mobile)) {
    errors.mobile = "Mobile number must start with 6, 7, 8, or 9.";
  }

  if (!applicant.qualification) {
    errors.qualification = "Please select your qualification.";
  } else if (!QUALIFICATIONS.includes(applicant.qualification)) {
    errors.qualification = "Please select a valid qualification.";
  }

  return errors;
}

function App() {
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleApplyClick = (event) => {
    event.preventDefault();

    const applicationSection = document.getElementById("apply");

    if (!applicationSection) {
      return;
    }

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    applicationSection.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", "#apply");
  };

  const handleFieldChange = (event) => {
    const fieldName = event.target.name;

    setErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });

    if (status.message) {
      setStatus({ type: "", message: "" });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const applicant = {
      name: String(formData.get("name") || "").trim(),
      mobile: String(formData.get("mobile") || "").trim(),
      qualification: String(formData.get("qualification") || "").trim(),
    };

    const nextErrors = validateApplicant(applicant);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus({
        type: "error",
        message: "Please correct the highlighted fields and try again.",
      });

      const firstInvalidField = Object.keys(nextErrors)[0];
      const fieldElement = form.elements.namedItem(firstInvalidField);

      if (fieldElement instanceof HTMLElement) {
        fieldElement.focus();
      }

      return;
    }

    setErrors({});
    setStatus({ type: "", message: "" });
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(applicant),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (
          data.field &&
          ["name", "mobile", "qualification"].includes(data.field)
        ) {
          setErrors({
            [data.field]: data.message || "Please check this field.",
          });
        }

        throw new Error(
          data.message || "Application submission failed. Please try again."
        );
      }

      form.reset();
      setStatus({
        type: "success",
        message: data.message || "Application submitted successfully!",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof TypeError
            ? "Unable to reach the server. Please check your connection and try again."
            : error.message ||
              "Unable to submit your application. Please try again.",
      });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <main className="job-page">
      <header className="top-bar">
        <div className="brand">
          <div className="logo-badge">
            <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
              <circle
                cx="32"
                cy="32"
                r="27"
                fill="none"
                stroke="#ffcc32"
                strokeWidth="2"
              />
              <path
                d="M16 39V29l7 4v-4l7 4v-4l7 4v6H16Z"
                fill="#ffcc32"
              />
              <rect
                x="15.5"
                y="41.2"
                width="22"
                height="2.8"
                rx="1.4"
                fill="#ffcc32"
              />
              <circle cx="43.5" cy="42" r="8.5" fill="#ffcc32" />
              <path
                d="m39.7 42 2.6 2.6 5-6"
                fill="none"
                stroke="#102f4e"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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

          <a
            href="#apply"
            className="top-apply-btn"
            onClick={handleApplyClick}
          >
            Apply Now <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
        <div className="hero-image-wrap">
          <img
            src="/images/factory-machinery-interior.jpg"
            alt="Row of large industrial machines on a clean factory production floor"
            className="hero-image"
          />
        </div>
      </section>

      <section className="job-details" aria-labelledby="job-details-heading">
        <h2 className="job-details-title" id="job-details-heading">
          Job Details
        </h2>

        <div className="detail">
          <span className="detail-icon">
            <DetailIcon name="title" />
          </span>
          <div>
            <h3>Job Title</h3>
            <p>Quality Inspection and Production</p>
          </div>
        </div>

        <div className="detail">
          <span className="detail-icon">
            <DetailIcon name="qualification" />
          </span>
          <div>
            <h3>Qualification</h3>
            <p>10th, 12th, ITI, Diploma and Any Graduate</p>
          </div>
        </div>

        <div className="detail">
          <span className="detail-icon">
            <DetailIcon name="gender" />
          </span>
          <div>
            <h3>Gender</h3>
            <p>Male &amp; Female</p>
          </div>
        </div>

        <div className="detail">
          <span className="detail-icon">
            <DetailIcon name="location" />
          </span>
          <div>
            <h3>Location</h3>
            <p>
              <a
                className="detail-link"
                href="https://www.google.com/maps/search/?api=1&query=MIDC%20Waluj%2C%20Chhatrapati%20Sambhajinagar%2C%20Maharashtra"
                target="_blank"
                rel="noopener noreferrer"
              >
                MIDC Waluj, Chh. Sambhajinagar
              </a>
            </p>
          </div>
        </div>

        <div className="detail">
          <span className="detail-icon">
            <DetailIcon name="person" />
          </span>
          <div>
            <h3>Contact Person</h3>
            <p>P.J. Patil</p>
          </div>
        </div>

        <div className="detail">
          <span className="detail-icon">
            <DetailIcon name="phone" />
          </span>
          <div>
            <h3>Contact Number</h3>
            <p>
              <a className="detail-link" href="tel:+919022746205">
                9022746205
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="application-section" id="apply">
        <div className="application-info">
          <span className="form-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v5h6M8 13h8M8 17h5" />
            </svg>
          </span>
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
          noValidate
          aria-busy={isSubmitting}
        >
          <div className="form-field">
            <label htmlFor="full-name">Full Name</label>
            <input
              id="full-name"
              type="text"
              name="name"
              placeholder="Enter your full name"
              autoComplete="name"
              maxLength={80}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              onChange={handleFieldChange}
              required
            />
            {errors.name && (
              <span className="field-error" id="name-error">
                {errors.name}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="mobile">Mobile Number</label>
            <input
              id="mobile"
              type="tel"
              name="mobile"
              placeholder="Enter your 10-digit mobile number"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              title="Enter a valid 10-digit Indian mobile number"
              aria-invalid={Boolean(errors.mobile)}
              aria-describedby={errors.mobile ? "mobile-error" : undefined}
              onChange={handleFieldChange}
              required
            />
            {errors.mobile && (
              <span className="field-error" id="mobile-error">
                {errors.mobile}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="qualification">Qualification</label>
            <select
              id="qualification"
              name="qualification"
              aria-invalid={Boolean(errors.qualification)}
              aria-describedby={
                errors.qualification ? "qualification-error" : undefined
              }
              onChange={handleFieldChange}
              required
            >
              <option value="">Select your qualification</option>
              {QUALIFICATIONS.map((qualification) => (
                <option key={qualification} value={qualification}>
                  {qualification}
                </option>
              ))}
            </select>
            {errors.qualification && (
              <span className="field-error" id="qualification-error">
                {errors.qualification}
              </span>
            )}
          </div>

          {status.message && (
            <p
              className={`form-message ${status.type}`}
              role={status.type === "error" ? "alert" : "status"}
              aria-live={status.type === "error" ? "assertive" : "polite"}
            >
              {status.message}
            </p>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                Submit Application{" "}
                <span aria-hidden="true">&rarr;</span>
              </>
            )}
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
