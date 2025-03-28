import fs from "fs";
import path from "path";

export async function scanHTMLFiles(dir) {
  const tiers = await fs.promises.readdir(dir);
  const files = [];

  for (const tier of tiers) {
    const tierPath = path.join(dir, tier);
    const stat = await fs.promises.stat(tierPath);

    if (stat.isDirectory()) {
      const tierFiles = (await fs.promises.readdir(tierPath))
        .filter(f => f.endsWith('.html'))
        .map(f => ({
          filepath: path.join(tierPath, f),
          tier,
          filename: f
        }));

      files.push(...tierFiles);
    }
  }
  return files;
}
