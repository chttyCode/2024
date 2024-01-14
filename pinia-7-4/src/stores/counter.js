import { defineStore } from '../pinia'
// import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => { // setup 同组件的setup,我们可以直接将组件中的setup没拿过来就可以了
    const count = ref(0);
    const double = computed(() => {
        return count.value * 2;
    })
    const increment = async (payload) => {
        return new Promise((resolve,reject) => {
            setTimeout(() => {
                count.value += payload;
                reject('失败')
            }, 1000);
        })
    }

    return {
        count, // 状态
        double, // 计算属性
        increment // 函数
    }
})



// export const useCounterStore = defineStore('counter', {
//     state: () => { // -> reactive({})
//         return { count: 0 }
//     },
//     getters: { // -> computed()
//         double() {
//             return this.count*2
//         }
//     },
//     actions: { // method
//         increment(payload) {
//             this.count += payload;
//             // 此状态更新后 我们需要保存到本地
//         },
//         decrement(payload) {
//             this.count -= payload;
//             // 此状态更新后 我们需要保存到本地
//         }
//     }
// })

// optionStore 基于optionsAPI来实现的，使用方式和vuex 基本上一致
// createPinia()
// defineStore()