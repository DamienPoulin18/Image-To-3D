const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

/* Sert le frontend statique si vous déployez tout sur le même service */
app.use(express.static(path.join(__dirname,'../public')));

/* dossier pour stocker uploads et modèles (en prod, utilisez un bucket) */
if(!fs.existsSync(path.join(__dirname,'../public/models'))){
  fs.mkdirSync(path.join(__dirname,'../public/models'), { recursive: true });
}

const upload = multer({ dest: path.join(__dirname,'uploads/') });

app.post('/api/start-job', upload.fields([{name:'image0'},{name:'image1'},{name:'image2'},{name:'image3'}]), (req,res)=>{
  const jobId = 'job_' + Date.now();
  console.log('Start job', jobId);
  simulateGeneration(jobId);
  res.json({ jobId });
});

io.on('connection', socket=>{
  console.log('client connected', socket.id);
});

/* Simulation: émet des partials et un final. Remplacez par votre pipeline réel. */
function simulateGeneration(jobId){
  const steps = 6;
  let i = 0;
  const iv = setInterval(()=>{
    i++;
    const percent = Math.min(100, Math.round((i/steps)*100));
    const partialPath = `/models/partial_${i}.glb`;
    // pour la démo, vous pouvez placer des fichiers partial_1.glb ... partial_5.glb dans public/models
    io.emit('job.progress', { jobId, percent, message: `Étape ${i}/${steps}`, partialModelUrl: partialPath });
    if(i >= steps){
      clearInterval(iv);
      const finalPath = `/models/final_${jobId}.glb`;
      // pour la démo, copiez un sample final dans public/models/final_<jobId>.glb si vous voulez
      io.emit('job.finished', { jobId, modelUrl: finalPath });
    }
  }, 2500);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=>console.log('Server listening on', PORT));
