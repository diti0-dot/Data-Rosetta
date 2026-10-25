import wipIcon from "../../assets/wip.jpg";
import "./accessibility.css";

function Accessibility() {

  return (
    <div className="page-accessibility">

      <section id="data-accessibility">
        <h1 className="accessibility-title">Data Accessibility</h1>
        <p className="dictIntro">
          A tool that checks charts, dashboards, and visualizations for accessibility issues, so people with color vision deficiency, low vision, or screen readers can still understand the data.
        </p>
         <img
                    src={wipIcon}
                    alt="icon"
                    className="wip-logo"
                  />
      </section>
      <h2>WORK IN PROGRESS</h2>
    </div>
    
  );
}

export default Accessibility;