import React from 'react';
import { Link, Route, Routes } from "react-router-dom";
import heroIcon from "../../assets/icon.png";
import Banner from '../home/banner.jsx';
import Accessibility from '../accessibility/accessibility.jsx'
import { How_works, FAQ,Disclaimer,Terms,Privacy,Contact} from '../pages/pages.jsx';
import './Navbar.css';

function Home() {
  return (
    <Banner></Banner>
  );
}

function How_works_header() {
        <How_works/>
}

function FAQ_header() {
  <FAQ/>
}

function Accessibility_header() {
  <Accessibility/>
}

function Disclaimer_header() {
  <Disclaimer/>
}

function Terms_headet() {
  <Terms/>
}

function Privacy_header() {
  <Privacy/>
}

function Contact_header() {
  <Contact/>
}

function Navbar() {
  return (
    <div className="navbar-wrapper">
      <nav className="navbar">
        <div className="navbar-inner">
          <img
            src={heroIcon}
            alt="icon"
            className="navbar-logo"
          />
          <Link to="/" className="navbar-link">Home</Link>
          <Link to="/data-accessibility" className="navbar-link">Accessibility</Link>
          <Link to="/how_it_works" className="navbar-link">How it works</Link>
          <Link to="/FAQ" className="navbar-link">FAQ</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how_it_works" element={<How_works />} />
        <Route path="/FAQ" element={<FAQ />} />
        <Route path="/data-accessibility" element={<Accessibility />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>


    </div>
  );
}

export default Navbar;