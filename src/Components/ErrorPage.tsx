import { Link, useRouteError, isRouteErrorResponse } from "react-router-dom";
import Footer from "./Footer";

export default function ErrorPage() {
  const error = useRouteError();

  let title = "Something went wrong";
  let message = "An unexpected error occurred while loading this page.";
  let statusText = "";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Page not found";
      message = "We couldn’t find the page you were looking for.";
    }
    statusText = `${error.status} ${error.statusText}`;
  }

  return (
    <>
      <section className="section">
        <div className="section-inner">
          <div className="section-header" style={{ textAlign: "left", marginBottom: 32 }}>
            <p className="section-label">Error</p>
            <h1 className="section-title" style={{ fontSize: "clamp(28px, 5vw, 40px)" }}>
              {title}
            </h1>
            <p className="section-desc" style={{ maxWidth: 520 }}>
              {message}
              {statusText && (
                <>
                  {" "}
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>({statusText})</span>
                </>
              )}
            </p>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link to="/" className="btn btn-primary">
              Back to home
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

