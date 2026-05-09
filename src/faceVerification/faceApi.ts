// import { TextEncoder, TextDecoder } from 'util';
// (global as any).TextEncoder = TextEncoder;
// (global as any).TextDecoder = TextDecoder;
 
// import * as tf from '@tensorflow/tfjs';
// import * as wasm from '@tensorflow/tfjs-backend-wasm';
// import * as faceapi from '@vladmandic/face-api/dist/face-api.node-wasm.js';
// import { Canvas, Image, ImageData } from 'canvas';
// import path from 'path';
 
// faceapi.env.monkeyPatch({ Canvas: Canvas as unknown as typeof HTMLCanvasElement,
//   Image: Image as unknown as typeof HTMLImageElement,
//   ImageData: ImageData as unknown as typeof ImageData as any, });
 
// const ROOT = path.join(__dirname, '../../');
// const MODEL_PATH = path.join(ROOT, 'models');
// const WASM_PATH = path.join(ROOT, 'wasm') + path.sep;
 
// let loaded = false;
 
// export async function loadFaceModels() {
//   if (loaded) return;
 
//   wasm.setWasmPaths(WASM_PATH);
//   await tf.setBackend('wasm');
//   await tf.ready();
 
//   await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
//   await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
//   await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
 
//   loaded = true;
//   console.log('✅ FaceAPI loaded with WASM backend');
// }