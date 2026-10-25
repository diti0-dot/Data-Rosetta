import React from "react";
import { Link, Route, Routes } from "react-router-dom";
import fileHistory from "../../assets/file_history.png";
import dataDict from "../../assets/data_dict.jpg";
import csvPreview from "../../assets/csv_preview.jpg";
import domainCon from "../../assets/domain_con.png";
import exportDict from "../../assets/expore_dict.jpg";
import jsonPreview from "../../assets/json_preview.png";
import AddFileForm from "../upload/upload.jsx";
import "./banner.css";

function Banner() {
  return (
    <div>
      <header className="mediaHeader">
        <div className="viewportHeader">
          <div className="header">
            <h1>Data Rosetta</h1>
            <p>Speak your data’s language.</p>
            <div className="actions">
              <a href="#data-dictionary" className="data_dict">Try Data Dictionary</a>
              <Link to="/data-accessibility" className="data_dict">Try Data accessibility</Link>
            </div>
             <h2>Make an unfamiliar dataset make sense</h2>
          </div>
          <div className="image-gallery">
      <img src={csvPreview} alt="CSV Preview" />
      <img src={dataDict} alt="Data Dictionary" />
      <img src={domainCon} alt="Domain Confirmation" />
      <img src={exportDict} alt="Export Dictionary" />
      <img src={fileHistory} alt="File History" />
      <img src={jsonPreview} alt="JSON Preview" />
    </div>
        </div>
      </header>

        <section id="data-dictionary">
        <h2>Data Dictionary</h2>
        <p className="dictIntro">
          A data dictionary is a document that describes every column in a dataset:
        </p>
        <AddFileForm />
      </section>
    </div>
  );
}

export default Banner;