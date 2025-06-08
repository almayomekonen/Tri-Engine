export function GlobalStyles() {
  return (
    <style jsx global>{`
      .analysis-result strong {
        color: #60a5fa;
        font-weight: bold;
      }
      .analysis-result h1,
      .analysis-result h2,
      .analysis-result h3 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        color: white;
        font-weight: bold;
      }
      .analysis-result h1 {
        font-size: 1.8em;
        color: #93c5fd;
      }
      .analysis-result h2 {
        font-size: 1.5em;
        color: #93c5fd;
      }
      .analysis-result h3 {
        font-size: 1.3em;
        color: #93c5fd;
      }
      .analysis-result ul {
        list-style-type: disc;
        margin-left: 1.5em;
        margin-bottom: 1em;
      }
      .analysis-result ol {
        list-style-type: decimal;
        margin-left: 1.5em;
        margin-bottom: 1em;
      }
      .analysis-result p {
        margin-bottom: 1em;
      }
      .analysis-result table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1em;
        border: 1px solid #4b5563;
      }
      .analysis-result th,
      .analysis-result td {
        border: 1px solid #4b5563;
        padding: 0.5em;
      }
      .analysis-result th {
        background-color: #374151;
      }
      html {
        direction: rtl;
      }
    `}</style>
  );
}
