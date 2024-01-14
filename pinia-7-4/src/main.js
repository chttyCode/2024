import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 创建pinia
import { createPinia } from './pinia'
// import {createPinia} from 'pinia'

const app = createApp(App);
const pinia = createPinia(); //  获取pinia

function persitisPlugin() { // 为了用户传递参数
    return ({ store, id }) => { // 所有的store都会执行此方法
        let oldState = JSON.parse(localStorage.getItem(id) || '{}');
        store.$state = oldState
        // console.log(store.$state); // 获取全部状态   pinia.state.value[id]
        // store.$patch(oldState); //  $state 可以给一个新的状态，直接覆盖掉
        store.$subscribe((mutation,state) => {
            localStorage.setItem(id,JSON.stringify(state))
        })
    }
}
// persitisPlugin
pinia.use(persitisPlugin())
 ;// use API可以去调用插件的install方法，将app注入进来
app.use(pinia); // 使用pinia插件
app.mount('#app')
