import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors({ origin: true, credentials: false }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'east-bay-trail-tracker' });
});

app.listen(PORT, () => {
  console.log(`East Bay Trail Tracker backend listening on http://localhost:${PORT}`);
});
