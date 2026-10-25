import { Link } from "react-router-dom";
import "./Footer.css";

const CONTACT_EMAIL = "ditidotio@gmail.com";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-wrapper">
        <div className="footer-inner">
          <div className="footer-col">
            <h4 className="footer-title">Legal</h4>
            <Link to="/disclaimer" className="footer-link">Disclaimer</Link>
            <Link to="/terms" className="footer-link">Terms of Service</Link>
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
          </div>

          <div className="footer-col">
            <h4 className="footer-title">Contact</h4>
            <Link to="/contact" className="footer-link">Contact</Link>
            <a href={`mailto:${CONTACT_EMAIL}`} className="footer-link">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {year} Data Rosetta. Licensed under the{" "}
            <a
              href="https://joinup.ec.europa.eu/software/page/eupl"
              target="_blank"
              rel="noreferrer"
            >
              EUPL v1.2
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
