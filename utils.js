const fs = require("fs");

function readJSON(path) {
  const data = fs.readFileSync(path, "utf8");
  return JSON.parse(data);
}

function writeJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
}

module.exports = { readJSON, writeJSON };
