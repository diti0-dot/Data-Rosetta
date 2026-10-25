import "./pages.css";

const CONTACT_EMAIL = "ditidotio@gmail.com";
const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;
const LAST_UPDATED = "October 2026";

export function How_works() {
  const steps = [
    {
      title: "Upload a file",
      text: "Upload a CSV, TSV, Excel (.xlsx or .xls), JSON, or Parquet file of up to 50 MB. Data Rosetta has no database, so the file is not saved on our server.",
    },
    {
      title: "Automatic profiling",
      text: "Data Rosetta reads the whole file and works out the type of each column, along with the null percentage, unique count, minimum and maximum (for numeric columns), and up to five sample values.",
    },
    {
      title: "AI enrichment",
      text: "Column names, types, null percentages, and a few sample values are sent to Google Gemini. It suggests a domain, writes a short description for each column, and proposes experts and learning resources. Gemini can make mistakes, so check every suggestion.",
    },
    {
      title: "Review and export",
      text: "Confirm, edit, reject, or flag each description, and add notes. Then export the dictionary as CSV, Excel, Word, or JSON.",
    },
  ];

  return (
    <div className="page how-it-works">
      <h1 className="how-title">How it works</h1>

      <h2 className="section-heading">What is data science?</h2>
      <p className="lead">
        Data science is often described as resting on three pillars: computer science, statistics, and domain expertise. The first two are easy to see. Domain expertise matters just as much, because every field has its own assumptions and methods. A data scientist works with domain specialists to find solutions that fit those methods, rather than reinventing them.
      </p>
      <p className="source">
        Source:{" "}
        <a
          href="https://courses.mooc.fi/org/uh-cs/courses/introduction-to-data-science/chapter-2/what-is-data-science"
          target="_blank"
          rel="noreferrer"
        >
          Introduction to Data Science, University of Helsinki
        </a>
      </p>
      <p className="lead">
        Data Rosetta is built for the third pillar. Alongside the data dictionary, you get a short domain review, suggested experts in that field, and resources to help you learn more about it.
      </p>

      <div className="steps">
        {steps.map((step) => (
          <div key={step.title} className="step">
            <h3 className="step-title">{step.title}</h3>
            <p className="step-text">{step.text}</p>
          </div>
        ))}
      </div>

      <div className="columns">
        <div className="column">
          <h2 className="section-heading orange">What you get</h2>
          <ul className="featureList">
            <li>A per-column data dictionary: type, null %, unique count, min, max, samples, and description</li>
            <li>A domain label and a short review of that field</li>
            <li>Suggested experts and learning resources</li>
            <li>Export as CSV, Excel, Word, or JSON</li>
          </ul>
        </div>

        <div className="column">
          <h2 className="section-heading orange">What we do not do</h2>
          <ul className="featureList">
            <li>We do not create accounts or track you.</li>
            <li>We do not keep your file or your dictionary on our server.</li>
            <li>We do not connect to your database or data warehouse.</li>
            <li>We do not replace a human data steward. We help you get started.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function FAQ() {
  const items = [
    {
      q: "Is my file uploaded to a server?",
      a: "Yes. The file is sent to our FastAPI backend, which reads it into memory, profiles it, and returns the results. The file is not saved to disk or to a database.",
    },
    {
      q: "Do I need to create an account?",
      a: "No. There is no login and no signup. Anyone can open the site and use every feature.",
    },
    {
      q: "Which file formats are supported?",
      a: "CSV, TSV, Excel (.xlsx and .xls), JSON (a standard array of objects), and Parquet. The maximum upload size is 50 MB.",
    },
    {
      q: "Does the profile cover the whole file?",
      a: "Yes. Counts, null percentages, minimum and maximum values, and samples are calculated from every row in the file.",
    },
    {
      q: "How accurate are the AI descriptions?",
      a: "The AI writes short descriptions based on column names, types, and a few sample values. They are a starting point, not a verified account of your data. Review them before you share anything.",
    },
    {
      q: "Are the suggested experts real people?",
      a: "Possibly, but not guaranteed. Gemini can produce names, organisations, or links that do not exist or are out of date. Check each suggestion before you contact anyone.",
    },
    {
      q: "What export formats are available?",
      a: "CSV, Excel (.xlsx), Word (.docx), and JSON. Each export contains the Column, Type, Null %, Unique, Min, Max, Samples, and Description fields. Review status and notes stay in the app.",
    },
    {
      q: "Can two people edit the same dictionary?",
      a: "No. There is no shared workspace and no version history. Each browser session works on its own copy.",
    },
    {
      q: "Is it free?",
      a: "Yes, for now. Data Rosetta uses Google Gemini for the AI parts, along with a small FastAPI backend. If usage grows, we may add limits.",
    },
    {
      q: "Does it work on mobile?",
      a: "The layout adjusts to small screens, but the table views are designed for desktop. On a phone you can still upload a file and read the results.",
    },
    {
      q: "What happens if I close the tab?",
      a: "Your dictionary and upload history are cleared when the tab closes. Export your dictionary before you close the tab if you want to keep it.",
    },
    {
      q: "Can I use this for sensitive data?",
      a: "Be careful. Your file goes to our backend, and column names, types, and sample values go to Google Gemini. If your data contains personal information or trade secrets, remove or anonymise it before uploading.",
    },
  ];

  return (
    <div className="page faq">
      <h1 className="faq-title">Frequently asked questions</h1>

      {items.map((item) => (
        <div key={item.q} className="faq-item">
          <h3 className="faq-question">{item.q}</h3>
          <p className="faq-answer">{item.a}</p>
        </div>
      ))}
    </div>
  );
}

export function Disclaimer() {
  return (
    <div className="page legal">
      <h1 className="legal-title">Disclaimer</h1>
      <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

      <p className="legal-p">
        Data Rosetta is an experimental tool. It produces documentation
        automatically, with help from artificial intelligence. The output may be
        incomplete, inaccurate, or misleading.
      </p>

      <h2 className="legal-h2">AI-generated content</h2>
      <p className="legal-p">
        Column descriptions, domain labels, expert suggestions, and resource
        recommendations come from a large language model. They are a starting
        point, not verified facts. Review them before you rely on them or share
        them with anyone.
      </p>

      <h2 className="legal-h2">Experts and resources</h2>
      <p className="legal-p">
        Google Gemini suggests the experts and resources shown in Data Rosetta.
        Some may not exist, may be out of date, or may not suit your dataset.
        Check each suggestion before you use it or contact anyone. Data Rosetta
        does not endorse these suggestions, and the people and organisations
        listed have not endorsed this tool.
      </p>

      <h2 className="legal-h2">No professional advice</h2>
      <p className="legal-p">
        Nothing on this site is legal, medical, financial, or compliance advice.
        If your dataset contains regulated data, speak to a qualified
        professional before you publish documentation about it.
      </p>

      <h2 className="legal-h2">No warranty</h2>
      <p className="legal-p">
        Data Rosetta is provided "as is", without warranty of any kind. We are
        not liable for any loss or damage that results from using it, including
        data loss, incorrect documentation, or decisions based on generated
        output.
      </p>

      <h2 className="legal-h2">Your responsibility</h2>
      <p className="legal-p">
        You are responsible for the data you upload and for how you use the
        generated dictionary. Only upload data you have the right to process.
      </p>
    </div>
  );
}

export function Terms() {
  return (
    <div className="page legal">
      <h1 className="legal-title">Terms of Service</h1>
      <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

      <h2 className="legal-h2">1. Acceptance</h2>
      <p className="legal-p">
        By using Data Rosetta, you agree to these terms. If you do not agree,
        please do not use the service.
      </p>

      <h2 className="legal-h2">2. What the service is</h2>
      <p className="legal-p">
        Data Rosetta is a free web tool that profiles uploaded data files and
        produces a data dictionary with AI assistance. It has no user accounts.
        It does not keep your files or dictionaries on our server.
      </p>

      <h2 className="legal-h2">3. Acceptable use</h2>
      <p className="legal-p">You agree not to:</p>
      <ul className="legal-list">
        <li>Upload data you do not have the legal right to process.</li>
        <li>Upload malware or attempt to disrupt the service.</li>
        <li>Use the service to generate content that is unlawful, harmful, or infringing.</li>
        <li>Scrape, mirror, or resell the service without permission.</li>
      </ul>

      <h2 className="legal-h2">4. No warranty</h2>
      <p className="legal-p">
        The service is provided "as is" and "as available", without warranty of
        any kind, express or implied, including merchantability, fitness for a
        particular purpose, and non-infringement.
      </p>

      <h2 className="legal-h2">5. Limitation of liability</h2>
      <p className="legal-p">
        To the fullest extent permitted by law, Data Rosetta and its maintainers
        are not liable for any indirect, incidental, special, consequential, or
        punitive damages, or for any loss of data, revenue, or profits, arising
        from your use of the service.
      </p>

      <h2 className="legal-h2">6. Changes</h2>
      <p className="legal-p">
        We may update these terms at any time. Continuing to use the service
        after a change means you accept the updated terms.
      </p>

      <h2 className="legal-h2">7. Governing law</h2>
      <p className="legal-p">
        These terms are governed by the laws of the jurisdiction where the
        project maintainers are based, without regard to conflict-of-law rules.
      </p>

      <h2 className="legal-h2">8. Contact</h2>
      <p className="legal-p">
        Questions about these terms:{" "}
        <a href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a>
      </p>
    </div>
  );
}

export function Privacy() {
  return (
    <div className="page legal">
      <h1 className="legal-title">Privacy Policy</h1>
      <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

      <p className="legal-p">
        Data Rosetta collects as little as possible. There are no accounts, no
        tracking cookies, and no analytics that identify you.
      </p>

      <h2 className="legal-h2">What we process</h2>
      <ul className="legal-list">
        <li>
          <strong>Your file:</strong> sent to our backend, read into memory,
          and profiled. It is not saved to disk or to a database, and it is not
          kept after the response is returned.
        </li>
        <li>
          <strong>Column names, types, and sample values:</strong> sent to
          Google Gemini to generate descriptions, the domain label, experts, and
          resources. Google's terms for the Gemini API apply to this data.
        </li>
        <li>
          <strong>Your dictionary and upload history:</strong> kept in your
          browser's session storage so they survive a page refresh. They are
          cleared when you close the tab. They stay on your device unless you
          upload a file or export it yourself.
        </li>
        <li>
          <strong>Server logs:</strong> our backend logs errors for debugging.
          These logs can include a file name or an error message, but not the
          contents of your file.
        </li>
      </ul>

      <h2 className="legal-h2">What we do not collect</h2>
      <ul className="legal-list">
        <li>No names, email addresses, or accounts.</li>
        <li>No tracking cookies or advertising identifiers.</li>
        <li>No behavioural analytics that identify individual users.</li>
        <li>No copy of your uploaded file or generated dictionary kept on our server.</li>
      </ul>

      <h2 className="legal-h2">Third parties</h2>
      <p className="legal-p">
        We use Google Gemini for AI enrichment. When you run an analysis, column
        names, types, and sample values are sent to Google. Depending on the
        Gemini API plan in use, Google may use this data to improve its
        products. See Google's privacy policy and Gemini API terms for details.
      </p>

      <h2 className="legal-h2">Your rights</h2>
      <p className="legal-p">
        Because we do not keep your files or personal data, there is usually
        nothing for us to delete, export, or correct on request. If you believe
        we hold information about you, email us and we will look into it.
      </p>

      <h2 className="legal-h2">Contact</h2>
      <p className="legal-p">
        Privacy questions: <a href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a>
      </p>
    </div>
  );
}

export function Contact() {
  return (
    <div className="page legal">
      <h1 className="legal-title">Contact</h1>
      <p className="legal-lead">
        Questions, bug reports, feature ideas, or privacy concerns? Email us at
        any time.
      </p>

      <h2 className="legal-h2">Email</h2>
      <p className="legal-p">
        <a href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a>
      </p>

      <h2 className="legal-h2">Reporting a bug</h2>
      <p className="legal-p">
        Include the file format you uploaded, the steps you took, what you
        expected to happen, and what actually happened. Please do not send the
        data file itself unless we ask for it.
      </p>

      <p className="legal-p">
        We are a small team. We read every message, but replies may take a few
        days.
      </p>
    </div>
  );
}