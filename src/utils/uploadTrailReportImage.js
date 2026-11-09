import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const TARGET_WIDTH = 1600;

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

const compressImageFile = async (file) => {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file.');
  }

  if (file.size <= MAX_IMAGE_BYTES && file.size <= 2 * 1024 * 1024) {
    return file;
  }

  const dataUrl = await readFileAsDataURL(file);
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const scale = Math.min(1, TARGET_WIDTH / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);

  const outputType = file.type === 'image/png' ? 'image/jpeg' : file.type;
  const compressedBlob = await new Promise((resolve) => {
    canvas.toBlob(resolve, outputType, 0.8);
  });

  if (!compressedBlob) {
    return file;
  }

  const safeName = file.name.replace(/\.[^.]+$/, '') || 'trail-photo';
  return new File([compressedBlob], `${safeName}.jpg`, { type: 'image/jpeg' });
};

export default async function uploadTrailReportImage(file, uid) {
  if (!uid) {
    throw new Error('A user is required to upload a report photo.');
  }

  const preparedFile = await compressImageFile(file);
  const timestamp = Date.now();
  const safeName = preparedFile.name.replace(/\s+/g, '-');
  const storageRef = ref(storage, `trail-reports/${uid}/${timestamp}-${safeName}`);

  await uploadBytes(storageRef, preparedFile);
  return getDownloadURL(storageRef);
}
