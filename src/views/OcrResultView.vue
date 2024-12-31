<script setup lang="ts">
import state from '@/state'
import { queryPaddleOcr, queryTesseractOcr } from '@/functions'
import { computed, reactive, ref } from 'vue'
import type { Tree } from 'element-plus/lib/components/tree-v2/src/types.js'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'

const goBack = () => {
  window.history.back()
}

interface OcrResult {
  detectionResult: string;
  ocrResult: Option[];
  textarea: unknown;
  elemRef: unknown;
  textareaDisabled: boolean;
  modelTime: number,
  recTime: number,
}

const results: OcrResult[] = reactive([]);

async function operateOcr() {
  console.log(state.objectUrls);
  console.log(state.currentModel)
  for (const objectUrl of state.objectUrls) {
    console.log(111111);
    let res;

    if (state.currentModel === "ppocr_chs") {
      console.log("ppocr")
      res = await queryPaddleOcr(objectUrl)
    } else if (state.currentModel === "tesseract_eng") {
      res = await queryTesseractOcr(objectUrl, "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/eng.traineddata")
    } else if (state.currentModel === "tesseract_chi_sim") {
      res = await queryTesseractOcr(objectUrl, "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/chi_sim.traineddata")
    } else if (state.currentModel === "tesseract_jpn") {
      console.log("jpn")
      res = await queryTesseractOcr(objectUrl, "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/jpn.traineddata")
    }
    if (res === undefined) {
      continue;
    }
    res.ocrResult = res.ocrResult.text;
    const newArray: Option[] = [];
    for (const text of res.ocrResult as string[]) {
      newArray.push({ value: newArray.length.toString(), label: text });
    }
    results.push({
      detectionResult: res.detectionResult,
      ocrResult: newArray,
      textarea: ref(newArray.map((i) => i.label).join('\n')),
      elemRef: ref(null),
      textareaDisabled: true,
      modelTime: res.modelTime,
      recTime: res.recTime,
    });
  }
}

interface Option {
  value: string
  label: string
}

const props = {
  value: 'value',
  label: 'label',
  children: 'children',
}

const handleSelectChange = (
  index: number
) => {
  refresh(index);
}

function refresh(index: number) {
  let selected = results[index].elemRef?.getCheckedKeys();
  if (selected === undefined) {
    selected = [];
  }
  const sortedSelected = selected.sort((a, b) => parseInt(a) - parseInt(b));
  const textarea_result = sortedSelected.map((i) => results[index].ocrResult[parseInt(i)].label).join('\n');
  console.log(selected);
  console.log(textarea_result);
  results[index].textarea = textarea_result;
}

const setRef = (el: Tree, index: number) => {
  results[index].elemRef = el;
}

function selectAll(index: number) {
  const checkedKeys = results[index].ocrResult.map((_, i) => i.toString());
  checkedKeys.forEach((key) => {
    results[index].elemRef?.setChecked(key, true);
  });
  ElMessage({
    message: '已全选',
    type: 'success',
  })
  refresh(index);
}

function unselectAll(index: number) {
  results[index].elemRef?.setCheckedKeys([]);
  ElMessage({
    message: '已全不选',
    type: 'success',
  })
  refresh(index);
}

function switchEditStatus(index: number) {
  results[index].textareaDisabled = !results[index].textareaDisabled;
  ElMessage({
    message: '编辑状态已更新',
    type: 'success',
  })
}

function clearAllBreaks(index: number) {
  results[index].textarea = results[index].textarea.replace(/\n/g, '');
  ElMessage({
    message: '已删除换行（可通过刷新按钮还原）',
    type: 'success',
  })
}

function copyToClipboard(index: number) {
  navigator.clipboard.writeText(results[index].textarea);
  ElNotification({
    title: '已复制到剪贴板',
    message: '已将结果复制到剪贴板',
    type: 'success',
  })
}

const loadingText = computed(() => {
  return '正在识别图片（' + results.length + '/' + state.objectUrls.length + '）';
})

function refreshManually(index: number) {
  refresh(index);
  ElMessage({
    message: '已刷新',
    type: 'success',
  })
}

operateOcr().catch(error => {
  ElMessageBox.alert(error, "无法识别：请尝试更换引擎或模型", {
    confirmButtonText: "确认",
    type: "error",
    callback: () => {
      window.history.back();
    }
  })
});



</script>

<template>
  <el-page-header @back="goBack">
    <template #content>
      <span class="text-large font-600 mr-3"> OCR 识别结果 </span>
    </template>
  </el-page-header>

  <br /><br /><br />
  <el-card shadow="hover" v-for="(result, index) in results" :key="result">
    <el-row>
      <el-col :span="24">
        <div class="grid-content">
          <h2>图片 #{{ index + 1 }}</h2>
        </div>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="5">
        <div class="grid-content">
          <el-text class="mx-1" type="primary">ocr-detect结果</el-text>
          <br /><br />
          <el-image :src="result.detectionResult" style="width: 100%; border: 1px solid var(--el-color-primary);"
            :preview-src-list="[result.detectionResult]" />

        </div>
      </el-col>
      <el-col :span="1">
        <div class="grid-content">
        </div>
      </el-col>
      <el-col :span="6">
        <div class="grid-content">
          <el-text class="mx-1" type="primary">↓请在下方选择需要的文字，然后在右侧预览，并进行复制/粘贴操作→</el-text>
          <br /><br />

          <el-button type="success" plain @click="selectAll(index)">全选</el-button>
          <el-button type="primary" plain @click="unselectAll(index)">全不选</el-button>
          <br /><br />
          <el-tree-v2 style="max-width: 100%; border: 1px solid var(--el-color-primary);" :data="result.ocrResult"
            :props="props" show-checkbox :height="220" @check-change="(data, checked) => { handleSelectChange(index) }"
            :ref="(el) => { setRef(el, index) }" :default-checked-keys="result.ocrResult.map((key) => key.value)" />

        </div>
      </el-col>
      <el-col :span="1">
        <div class="grid-content">
        </div>
      </el-col>
      <el-col :span="11">
        <div class="grid-content">
          <el-text class="mx-1" type="primary">最终结果：</el-text>
          <br /><br />
          <el-input v-model="result.textarea" rows=10 type="textarea" :disabled="result.textareaDisabled" />
          <br /><br />
          <el-button type="primary" @click="() => { copyToClipboard(index) }">复制到剪贴板</el-button>
          <el-button type="danger" @click="() => { clearAllBreaks(index) }">去除全部换行</el-button>
          <el-button type="warning" @click="() => { switchEditStatus(index) }">切换编辑状态</el-button>
          <el-button type="success" @click="() => { refreshManually(index) }">刷新</el-button>
        </div>
      </el-col>
    </el-row>
    <el-text class="mx-1" type="primary">模型初始化用时：{{ result.modelTime / 1000 }}s，识别用时：{{ result.recTime / 1000 }}s，模型：{{
      state.currentModel }}
    </el-text>
  </el-card>

  <el-row v-if="results.length !== state.objectUrls.length">
    <el-col :span="24">
      <div class="grid-content">
        <el-card shadow="hover" style="width: 100%;height: 240px;" v-loading="true" :element-loading-text="loadingText"
          :key="loadingText">

        </el-card>

      </div>
    </el-col>
  </el-row>
</template>
<style lang="css" scoped>
.el-page-header {
  width: 100%;
  position: fixed;
  z-index: 999;
  background-color: white;
  border: 1px solid var(--el-color-primary);
  padding: 20px;
  border-radius: 20px;
}
</style>