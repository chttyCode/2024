import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 创建pinia
import {createPinia} from './pinia'


const app = createApp(App);
const pinia = createPinia(); //  获取pinia
// use API可以去调用插件的install方法，将app注入进来
app.use(pinia); // 使用pinia插件
app.mount('#app')
