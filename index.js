require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const app = express();
const port = process.env.PORT || 3000;

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

async function getDriveIdFromSKU(sku) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${process.env.SHEET_NAME}!A2:B`,
  });
  const rows = res.data.values;
  const match = rows.find(row => row[0] === sku);
  return match ? match[1] : null;
}

app.get('/ar/:sku', async (req, res) => {
  try {
    const sku = req.params.sku;
    const fileId = await getDriveIdFromSKU(sku);

    if (!fileId) return res.status(404).send('SKU not found');

    const driveRes = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    res.setHeader('Content-Type', 'model/vnd.usdz+zip');
    res.setHeader('Content-Disposition', 'inline');
    driveRes.data.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

app.listen(port, () => {
  console.log(`Proxy server running on http://localhost:${port}`);
});
