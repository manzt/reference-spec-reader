import nunjucks from "nunjucks";
import { promises as fsp } from "fs";
import { parse } from "./src/index.js";


fsp.readFile('./ref.json').then(data => {
  const spec = JSON.parse(data);
  const expanded = parse(spec, nunjucks.renderString);
  console.log(expanded);
})
