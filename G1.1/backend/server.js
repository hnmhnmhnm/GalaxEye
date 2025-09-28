const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { execFile } = require('child_process');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname,'../data/uploads');
const fs = require('fs');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, UPLOAD_DIR); },
  filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage });
const app = express();
app.use(cors());
app.use(express.json());

app.post('/upload', upload.fields([{name:'a'},{name:'b'}]), (req,res)=>{
  if(!req.files || !req.files['a'] || !req.files['b']) return res.status(400).json({error:'two files required'});
  const a = req.files['a'][0].filename;
  const b = req.files['b'][0].filename;
  res.json({ files: { a, b }});
});

app.post('/process', (req,res)=>{
  const { aoi_bbox, file_a, file_b } = req.body;
  if(!aoi_bbox || !file_a || !file_b) return res.status(400).json({error:'aoi_bbox, file_a, file_b required'});
  const aPath = path.join(UPLOAD_DIR, file_a);
  const bPath = path.join(UPLOAD_DIR, file_b);
  const out = path.join(UPLOAD_DIR, 'processed-'+Date.now()+'.tif');
  // Call python worker script
  const worker = path.join(__dirname,'../worker/worker.py');
  const args = ['--input1', aPath, '--input2', bPath, '--aoi', JSON.stringify(aoi_bbox), '--out', out];
  execFile('python3', [worker, ...args], {timeout: 120000}, (err, stdout, stderr) => {
    if(err){
      console.error(err, stderr);
      return res.status(500).json({error: stderr || err.message});
    }
    res.json({ output: out, stdout });
  });
});

const PORT = 4000;
app.listen(PORT, ()=>console.log('Backend running on',PORT));
