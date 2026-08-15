import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const videosDir = path.join(process.cwd(), 'public', 'videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

function runFFmpeg(args: string) {
  try {
    console.log(`Executing: ffmpeg ${args}`);
    execSync(`ffmpeg -y ${args}`, { stdio: 'inherit' });
    console.log('Success!');
  } catch (e: any) {
    console.error('ffmpeg failed:', e.message);
  }
}

// Ensure the source images are defined
const imgAcceso = 'public/loteamiento/acceso-vial.jpg';
const imgAerea = 'public/loteamiento/vista-aerea.jpg';
const imgPrincipal = 'public/loteamiento/vista-principal.jpg';
const imgTerreno = 'public/inmuebles/terrenos/terreno-venta.JPG';

console.log('--- Generating individual segments with synchronized silent audio for main slideshow ---');

// Segment 1: Acceso Vial - 4 seconds
runFFmpeg(`-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -loop 1 -i "${imgAcceso}" -t 4 -vf "scale=1280:720,drawtext=text='BIENVENIDO A EXPERIENCIA ACARAY':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=80:shadowcolor=black:shadowx=2:shadowy=2,drawtext=text='Loteamiento Premium Km 12 - Costa de Rio':fontcolor=white:fontsize=28:x=(w-text_w)/2:y=140:shadowcolor=black:shadowx=2:shadowy=2,setsar=1" -c:v libx264 -pix_fmt yuv420p -r 30 -profile:v main -level 4.0 -c:a aac -shortest segment1.mp4`);

// Segment 2: Vista Principal - 4 seconds
runFFmpeg(`-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -loop 1 -i "${imgPrincipal}" -t 4 -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,drawtext=text='PLANO EXCLUSIVO':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=80:shadowcolor=black:shadowx=2:shadowy=2,drawtext=text='Terrenos Financiados en Sola Firma':fontcolor=white:fontsize=28:x=(w-text_w)/2:y=140:shadowcolor=black:shadowx=2:shadowy=2,setsar=1" -c:v libx264 -pix_fmt yuv420p -r 30 -profile:v main -level 4.0 -c:a aac -shortest segment2.mp4`);

// Segment 3: Vista Aérea - 4 seconds
runFFmpeg(`-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -loop 1 -i "${imgAerea}" -t 4 -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,drawtext=text='VISTA PARADISIACA':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=80:shadowcolor=black:shadowx=2:shadowy=2,drawtext=text='100 metros del Rio Acaray':fontcolor=white:fontsize=28:x=(w-text_w)/2:y=140:shadowcolor=black:shadowx=2:shadowy=2,setsar=1" -c:v libx264 -pix_fmt yuv420p -r 30 -profile:v main -level 4.0 -c:a aac -shortest segment3.mp4`);

console.log('--- Concatenating segments to create the main video ---');
const concatListPath = path.join(process.cwd(), 'concat_list.txt');
fs.writeFileSync(concatListPath, "file 'segment1.mp4'\nfile 'segment2.mp4'\nfile 'segment3.mp4'\n");

// Merge them using concat demuxer copying both video and audio
runFFmpeg(`-f concat -safe 0 -i "${concatListPath}" -c:v copy -c:a copy public/videos/video-estrella.mp4`);

console.log('--- Generating Video 2: Terreno Venta with synchronized silent audio ---');

// Segment A: Terreno Venta - 5 seconds
runFFmpeg(`-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -loop 1 -i "${imgTerreno}" -t 5 -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,drawtext=text='TU FUTURO INMUEBLE':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=80:shadowcolor=black:shadowx=2:shadowy=2,drawtext=text='Km 12 Acaray - Entorno Natural':fontcolor=white:fontsize=28:x=(w-text_w)/2:y=140:shadowcolor=black:shadowx=2:shadowy=2,setsar=1" -c:v libx264 -pix_fmt yuv420p -r 30 -profile:v main -level 4.0 -c:a aac -shortest segment_terreno1.mp4`);

// Segment B: Road access - 5 seconds
runFFmpeg(`-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -loop 1 -i "${imgAcceso}" -t 5 -vf "scale=1280:720,drawtext=text='EXCELENTE ACCESO DIARIO':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=80:shadowcolor=black:shadowx=2:shadowy=2,drawtext=text='Zona en Rápido Desarrollo y Crecimiento':fontcolor=white:fontsize=28:x=(w-text_w)/2:y=140:shadowcolor=black:shadowx=2:shadowy=2,setsar=1" -c:v libx264 -pix_fmt yuv420p -r 30 -profile:v main -level 4.0 -c:a aac -shortest segment_terreno2.mp4`);

const concatTerrenoPath = path.join(process.cwd(), 'concat_terreno.txt');
fs.writeFileSync(concatTerrenoPath, "file 'segment_terreno1.mp4'\nfile 'segment_terreno2.mp4'\n");

const terrainDestDir = path.join(process.cwd(), 'public', 'inmuebles', 'terrenos');
if (!fs.existsSync(terrainDestDir)) {
  fs.mkdirSync(terrainDestDir, { recursive: true });
}
runFFmpeg(`-f concat -safe 0 -i "${concatTerrenoPath}" -c:v copy -c:a copy "${path.join(terrainDestDir, 'terreno-venta1.MP4')}"`);

// Clean up intermediate segment files
['segment1.mp4', 'segment2.mp4', 'segment3.mp4', 'segment_terreno1.mp4', 'segment_terreno2.mp4', 'concat_list.txt', 'concat_terreno.txt'].forEach(f => {
  try {
    fs.unlinkSync(path.join(process.cwd(), f));
  } catch (err) {}
});

// Copy files to all fallbacks
console.log('--- Copying videos with dual streams to all fallback destinations ---');
fs.copyFileSync(path.join(videosDir, 'video-estrella.mp4'), path.join(videosDir, 'video-estrella_optimized.mp4'));
fs.copyFileSync(path.join(videosDir, 'video-estrella.mp4'), path.join(videosDir, 'video-estrella.mov'));
fs.copyFileSync(path.join(videosDir, 'video-estrella.mp4'), path.join(videosDir, 'recorrido-aereo.mp4'));
fs.copyFileSync(path.join(videosDir, 'video-estrella.mp4'), path.join(videosDir, 'extra-rio.mp4'));

fs.copyFileSync(path.join(terrainDestDir, 'terreno-venta1.MP4'), path.join(terrainDestDir, 'terreno-venta1_compat.mp4'));
fs.copyFileSync(path.join(terrainDestDir, 'terreno-venta1.MP4'), path.join(terrainDestDir, 'terreno-venta1_original.MP4'));

console.log('Compliance dual-stream video synthesis complete!');
