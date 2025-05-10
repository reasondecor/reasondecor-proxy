const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const app = express();
const PORT = process.env.PORT || 10000;

// แปลง base64 กลับเป็น JSON
const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf8')
);

const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);

app.get('/ar/:sku', async (req, res) => {
  try {
    const sku = req.params.sku;

    await doc.useServiceAccountAuth({
      client_email: credentials.client_email,
      private_key: credentials.private_key.replace(/\\n/g, '\n') // สำคัญมาก!
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[process.env.SHEET_NAME];
    const rows = await sheet.getRows();

    const row = rows.find(r => r.SKU === sku);
    if (!row) return res.status(404).send('SKU not found');

    const fileId = row.DriveID;
    const redirectUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
