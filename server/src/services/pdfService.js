const htmlPdf = require('html-pdf-node');
const marked = require('marked');

/**
 * Converts Markdown content to PDF Buffer
 * @param {string} markdownContent 
 * @returns {Promise<Buffer>}
 */
async function generatePdfFromMarkdown(markdownContent) {
  // 1. Convert Markdown to HTML
  const htmlContent = marked.parse(markdownContent);

  // 2. Wrap via Basic Clean CSS
  const fullHtml = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; line-height: 1.6; color: #333; }
          h1, h2, h3 { color: #2c3e50; }
          code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
          pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  // 3. Generate PDF
  const options = { format: 'A4', printBackground: true };
  const file = { content: fullHtml };

  try {
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    return pdfBuffer;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw new Error("Failed to generate PDF");
  }
}

module.exports = {
  generatePdfFromMarkdown
};
