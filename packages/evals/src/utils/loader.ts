import * as fs from "fs";
import * as path from "path";

export function loadXmlFixture(fixtureName: string): string {
  const xmlPath = path.resolve(
    __dirname,
    "../../fixtures/xml",
    `${fixtureName}.xml`,
  );
  return fs.readFileSync(xmlPath, "utf-8");
}

export function loadMetadata(fixtureName: string): any {
  const jsonPath = path.resolve(
    __dirname,
    "../../fixtures/metadata",
    `${fixtureName}.json`,
  );
  return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
}
