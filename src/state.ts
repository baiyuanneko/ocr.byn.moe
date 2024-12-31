import { reactive, ref } from 'vue';

const state = reactive({
  objectUrls: [] as string[],
  currentModel: 'ppocr_chs',
})


export default state;
