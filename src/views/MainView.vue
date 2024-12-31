<script setup lang="tsx">

import { onMounted, ref } from 'vue'
import state from '@/state'
import router from '@/router'
import { ElButton, ElMessageBox } from 'element-plus';

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons';

const models = [
  { value: 'ppocr_chs', label: "[PaddleOCR][中文] ch_PP-OCRv2_static_320", "desc": "百度官方提供的用于浏览器端部署的中文ocr模型，相比完整版模型缩减了模型尺寸，可能会影响效果。将从百度官方paddlejs模型CDN下载。" },
  { value: 'tesseract_eng', label: "[Tesseract][英文] tessdata_fast/eng.traineddata", "desc": "tessdata_fast 提供的英文识别模型，将从 GitHub 下载。" },
  { value: 'tesseract_chi_sim', label: "[Tesseract][简体中文] tessdata_fast/chi_sim.traineddata", "desc": "tessdata_fast 提供的简体中文识别模型，将从 GitHub 下载。" },
  { value: 'tesseract_jpn', label: "[Tesseract][日文] tessdata_fast/jpn.traineddata", "desc": "tessdata_fast 提供的日文识别模型，将从 GitHub 下载。" }
]

const currentModel = ref(models[0].value);


async function handlePasteImage(event) {
  const items = (event.clipboardData)?.items;
  if (items !== undefined) {
    for (const item of items) {
      if (item.kind === "file") {
        const blob = await new Response(item.getAsFile()?.stream()).blob();
        if (blob !== undefined) {
          const bitmap = await createImageBitmap(blob);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          ctx?.drawImage(bitmap, 0, 0);
          const dataURL = canvas.toDataURL();
          state.objectUrls = [dataURL];
          state.currentModel = currentModel.value;
          router.push('/ocr_result');
        }
      }
    }
  }
}

function uploadImages() {
  state.objectUrls = [];
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.onchange = () => {
    if (input.files !== null) {
      const files = Array.from(input.files);
      const readPromises = files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            state.objectUrls.push(reader.result as string);
            resolve(reader.result);
          };
          reader.onerror = () => {
            reject(reader.error);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readPromises)
        .then(() => {
          state.currentModel = currentModel.value;
          router.push('/ocr_result');
        })
        .catch(error => {
          console.error('Error reading files:', error);
        });
    }
  };
  input.click();
}

async function handleDropImage(event) {
  event.preventDefault();
  state.objectUrls = [];
  console.log(event)
  const files = event.dataTransfer?.files;
  const readPromises = Array.from(files!).map(file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        state.objectUrls.push(reader.result as string);
        resolve(reader.result);
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  });

  Promise.all(readPromises)
    .then(() => {
      state.currentModel = currentModel.value;
      router.push('/ocr_result');
    })
    .catch(error => {
      console.error('Error reading files:', error);
    });
}

async function handleDragOverImage(event) {
  event.preventDefault();
  isOnDrag.value = true;
}

async function handleDragLeaveImage(event) {
  event.preventDefault();
  isOnDrag.value = false;
};

const isOnDrag = ref(false);

const svg = "<div></div>";

function handleModelChange(value: string) {
  localStorage.setItem('currentModel', value);
}

onMounted(() => {
  const model = localStorage.getItem('currentModel');
  if (model !== null) {
    currentModel.value = model;
  }
});

</script>

<template>
  <div @dragover="handleDragOverImage" @drop="handleDropImage" @dragleave="handleDragLeaveImage"
    @paste="handlePasteImage">
    <br />
    <el-card shadow="hover">
      <h2><el-image style="width: 50px; height: 50px" src="favicon.ico" /> ocr.byn.moe <el-link
          href="https://github.com/baiyuanneko/ocr.byn.moe/" target="_blank" type="primary"><font-awesome-icon
            :icon="faGithub" />&nbsp;GitHub</el-link></h2>
      <p>支持paddle.js和tesseract-wasm两种引擎的纯前端ocr，云端不存储任何用户数据，可离线使用*</p>
      <el-text class="mx-1" type="info">*进行一次ocr之后对应模型将被离线缓存并可以离线使用</el-text>
      <br /><br />
      <p>模型/引擎选择：<el-select @change="handleModelChange" v-model="currentModel" placeholder="模型选择" style="width: 400px">
          <el-option v-for="model in models" :key="model.value" :label="model.label" :value="model.value" />
        </el-select> </p>
      <p>你选择的模型的描述：<el-text class="mx-1" type="info">{{ models.find(model => model.value === currentModel)?.desc
          }}</el-text></p>

    </el-card>
    <br />
    <el-card
      style="max-width: 700px;border: 1px dashed var(--el-color-primary); height:400px;justify-content: center;display: flex;text-align: center;justify-items: center;align-items: center;border-radius: 20px;margin: 20px;"
      shadow="hover" v-loading="isOnDrag" element-loading-text="松开即会进行OCR" :element-loading-spinner="svg">
      <div id="drag_area"><el-text class="mx-1" type="primary">
          <p>拖放图片到本页面上，或 <el-button type="primary" @click="uploadImages">上传图片</el-button></p>
          <p>按 Ctrl + V 以 OCR 粘贴板中的图像</p>
        </el-text></div>
    </el-card>
  </div>
</template>
