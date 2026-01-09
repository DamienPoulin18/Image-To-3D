// server/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } }); // en prod, remplacez '*' par votre domaine

// Sert le frontend statique et les modèles depuis public/
app.use(express.static(path.join(__dirname, '../public')));

// Crée dossiers si manquent
const uploadsDir = path.join(__dirname, 'uploads');
const modelsDir = path.join(__dirname, '../public/models');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

// Multer pour recevoir les 4 images
const upload = multer({ dest: uploadsDir, limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/start-job', upload.fields([
  { name: 'image0' }, { name: 'image1' }, { name: 'image2' }, { name: 'image3' }
]), (req, res) => {
  // Vérification simple
  const files = req.files || {};
  const count = ['image0','image1','image2','image3'].filter(k => files[k]).length;
  if (count < 4) return res.status(400).json({ error: 'Quatre images requises' });

  const jobId = 'job_' + Date.now();
  console.log('Start job', jobId);

  // Lancer la génération asynchrone (ici simulation + publication de fichiers de test)
  simulateGeneration(jobId);

  res.json({ jobId });
});

io.on('connection', socket => {
  console.log('Socket connected', socket.id);
});

// Simulation contrôlée : émet des partials et un final.
// Remplacez simulateGeneration par votre pipeline réel qui publie partials et final.
function simulateGeneration(jobId) {
  const totalSteps = 8;
  let step = 0;

  // Si vous avez des GLB d'exemple dans public/models/partial_1.glb ... partial_7.glb et sample_final.glb,
  // la simulation les utilisera. Sinon, elle n'enverra que les pourcentages.
  const partialFiles = [];
  for (let i = 1; i <= totalSteps - 1; i++) {
    const p = `/models/partial_${i}.glb`;
    if (fs.existsSync(path.join(__dirname, '../public', p))) partialFiles.push(p);
  }

  const interval = setInterval(() => {
    step++;
    const percent = Math.min(100, Math.round((step / totalSteps) * 100));
    const message = `Génération ${step}/${totalSteps}`;
    // Choisir un partialModelUrl si disponible (cycle through partialFiles)
    let partialModelUrl = null;
    if (partialFiles.length > 0) {
      const idx = Math.min(partialFiles.length - 1, step - 1);
      partialModelUrl = partialFiles[idx] || null;
    }
    // Émettre l'événement de progression
    io.emit('job.progress', { jobId, percent, message, partialModelUrl });
    console.log('Emitted progress', jobId, percent, partialModelUrl);

    if (step >= totalSteps) {
      clearInterval(interval);
      // Final model path : si vous avez un sample_final.glb, copiez-le en final_<jobId>.glb pour simuler
      const sampleFinal = path.join(modelsDir, 'sample_final.glb');
      const finalName = `/models/final_${jobId}.glb`;
      const finalPath = path.join(modelsDir, `final_${jobId}.glb`);
      if (fs.existsSync(sampleFinal)) {
        try { fs.copyFileSync(sampleFinal, finalPath); }
        catch (e) { console.error('Copy final failed', e); }
      }
      io.emit('job.finished', { jobId, modelUrl: finalName });
      console.log('Emitted finished', jobId, finalName);
    }
  }, 2000); // intervalle 2s entre étapes (ajustable)
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server listening on', PORT));
