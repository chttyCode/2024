

export { createPinia } from './createStore';
export { defineStore } from './store'
import {toRaw,isRef,isReactive,toRef} from 'vue'


export function storeToRefs(store) {
    store = toRaw(store);
    const result = {}
    for (let key in store) { // 方法同toRefs  toRefs基于toRef来实现的，只是 storeToRefs会移除掉对函数的处理
        let value = store[key];
        if (isRef(value) || isReactive(value)) { // 你是数据不是方法
            result[key] = toRef(store, key);
        }
    }
    return result
}

// mapState mapWritableState mapAction  针对vue2写法的，我们已经进入了vue3的时代了，废弃了。。。


// createPinia   defineStore
// action getters
// $patch $subscribe $onAction $reset $state storeToRefs
// 插件的实现