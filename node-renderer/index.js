import express from "express";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());

app.post("/render", async (req, res) => {
  const { filepath } = req.body;

  if (!filepath || !fs.existsSync(filepath)) {
    return res.status(400).json({ error: "Invalid file path" });
  }

  const absolutePath = "file://" + path.resolve(filepath);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto(absolutePath, { waitUntil: "networkidle0" });

    const textContent = await page.evaluate(() => {
      return document.body.innerText;
    });

    await browser.close();
    res.json({
      filename: path.basename(filepath),
      text: textContent,
    });
  } catch (err) {
    await browser.close();
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Renderer server running at http://localhost:3000");
});
