
import * as paddleOcr from '@paddlejs-models/ocr';
import { OCRClient as TesseractOCRClient } from 'tesseract-wasm';

async function queryPaddleOcr(objectUrl: string) {
  const img = document.createElement('img');
  img.src = objectUrl;
  const modelTimeStart = performance.now();
  await paddleOcr.init();
  const modelTime = performance.now() - modelTimeStart;
  const canvas = document.createElement('canvas');
  const recTimeStart = performance.now();
  const ocrResult = await paddleOcr.recognize(img, { canvas: canvas });
  const recTime = performance.now() - recTimeStart;
  const detectionResult = canvas.toDataURL('image/jpeg');
  return {
    ocrResult,
    detectionResult,
    modelTime,
    recTime
  }
}

async function objectUrlToImageBitmap(objectUrl: string) {
  const img = await fetch(objectUrl).then(r => r.blob());
  const bitmap = await createImageBitmap(img);
  return bitmap;
}

async function queryTesseractOcr(objectUrl: string, modelUrl: string) {
  const bitmap = await objectUrlToImageBitmap(objectUrl);
  const ocrClient = new TesseractOCRClient();
  const modelTimeStart = performance.now();
  await ocrClient.loadModel(modelUrl);
  const modelTime = performance.now() - modelTimeStart;

  const recTimeStart = performance.now();
  await ocrClient.loadImage(bitmap);
  const result = await ocrClient.getText();
  const recTime = performance.now() - recTimeStart;
  return {
    ocrResult: { text: result.split("\n") },
    detectionResult: objectUrl,
    modelTime,
    recTime
  }
}


export { queryPaddleOcr, queryTesseractOcr };
