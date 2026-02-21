import express from 'express';
import cors from 'cors';
import path from 'path';
import db from './database';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

app.get('/api/vehicles', (req, res) => {
  try { res.json(db.getVehicles()); } 
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
