import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const MAX_FIRESTORE_FIELD_BYTES = 900 * 1024;

const isLocalDevelopment = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname.endsWith('.local');
};

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.readAsDataURL(file);
  });

const loadImage = (dataUrl) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Selected file is not a valid image.'));
    image.src = dataUrl;
  });

const resizeAndCompressImage = async (file, maxDimension = MAX_IMAGE_DIMENSION, quality = 0.78) => {
  const dataUrl = await readFileAsDataURL(file);
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);

  const outputType = file.type === 'image/png' ? 'image/jpeg' : file.type;
  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, outputType, quality);
  });

  return blob
    ? new File([blob], file.name.replace(/\.[^.]+$/, '') || 'trail-photo', { type: outputType })
    : file;
};

const compressImageFile = async (file) => {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file.');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Please choose an image under 8MB to keep uploads reliable.');
  }

  if (file.size <= 1.5 * 1024 * 1024 && file.width && file.width <= MAX_IMAGE_DIMENSION && file.height && file.height <= MAX_IMAGE_DIMENSION) {
    return file;
  }

  let maxDimension = MAX_IMAGE_DIMENSION;
  let quality = 0.78;
  let preparedFile = file;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    preparedFile = await resizeAndCompressImage(preparedFile, maxDimension, quality);

    if (preparedFile.size <= 1.5 * 1024 * 1024) {
      return preparedFile;
    }

    maxDimension = Math.max(900, Math.round(maxDimension * 0.8));
    quality = Math.max(0.45, quality - 0.1);
  }

  return preparedFile;
};

const getLocalDataUrl = async (file) => {
  const preparedFile = await compressImageFile(file);
  const dataUrl = await readFileAsDataURL(preparedFile);

  if (dataUrl.length > MAX_FIRESTORE_FIELD_BYTES) {
    const compressedFile = await resizeAndCompressImage(preparedFile, 1000, 0.55);
    return readFileAsDataURL(compressedFile);
  }

  return dataUrl;
};

export default async function uploadTrailReportImage(file, uid) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file.');
  }

  const preparedFile = await compressImageFile(file);

  if (isLocalDevelopment()) {
    const localDataUrl = await getLocalDataUrl(preparedFile);
    return localDataUrl;
  }

  if (!uid) {
    throw new Error('A user is required to upload a report photo.');
  }

  const timestamp = Date.now();
  const safeName = preparedFile.name.replace(/\s+/g, '-');
  const storageRef = ref(storage, `trail-reports/${uid}/${timestamp}-${safeName}`);

  await uploadBytes(storageRef, preparedFile);
  return getDownloadURL(storageRef);
}
