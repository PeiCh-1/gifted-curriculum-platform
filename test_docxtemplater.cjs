const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

function getTemplateFile(filePath) {
  const content = fs.readFileSync(path.resolve(__dirname, filePath), 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
  });
  return doc;
}

try {
  const doc1 = getTemplateFile('public/curriculum_template.docx');
  console.log("curriculum_template.docx PARSED SUCCESSFULLY");
} catch (e) {
  console.error("curriculum_template.docx ERROR:", e.message);
  if (e.properties && e.properties.errors) {
      e.properties.errors.forEach(function(err) {
          console.error("Details:", err);
      });
  }
}

try {
  const doc2 = getTemplateFile('public/igp_template.docx');
  console.log("igp_template.docx PARSED SUCCESSFULLY");
} catch (e) {
  console.error("igp_template.docx ERROR:", e.message);
  if (e.properties && e.properties.errors) {
      e.properties.errors.forEach(function(err) {
          console.error("Details:", err);
      });
  }
}
