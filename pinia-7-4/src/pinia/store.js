import { getCurrentInstance, inject, reactive, computed, toRefs,isRef ,watch} from 'vue'
import { PiniaSymbol } from './rootState';
import { addSubscription, triggerSubscriptions } from './sub'; // 发布和订阅

function isComputed(value) {
    return isRef(value) && value.effect
}
function isObject(value) {
    return typeof value === 'object' && value !== null;
}
function createOptionStore(id, options, pinia) {
    const { state, actions, getters = {} } = options;
    function setup() {
        // 1） 用户提供的状态
        pinia.state.value[id] = state ? state() : {}
        const localState = toRefs(pinia.state.value[id]);// 结构出来依旧是响应式
        const setupStore = Object.assign(
            localState,
            actions, // 用户提供的动作
            Object.keys(getters).reduce((computeds, getterKey) => {
                computeds[getterKey] = computed(() => {
                    const store = pinia._s.get(id); // 当前的store
                    return getters[getterKey].call(store)
                })
                return computeds
            }, {})
        )
        return setupStore
    }
    const store = createSetupStore(id, setup, pinia) // options Api 需要将这个api转化成setup方法
    store.$reset = function () { // 官网有说明此方法只支持 optionApi ，compostionApi无法使用
        const newState = state ? state() : {};
        this.$patch(newState);
    }
    return store
}
// setupStore 用户已经提供了完整的setup方法了，我们只需要直接执行setup函数即可，通过这个返回值，将其放到store上就可以了
function createSetupStore(id, setup, pinia, isSetupStore) {
    function merge(target, partialState) {
        for (const key in partialState) {
            if(!partialState.hasOwnProperty(key)) continue
            const targetValue = target[key]; // 原始的  {a:{a:1}}
            const subPatch = partialState[key]; // 后来的 {a:ref(a:2)}
            if (isObject(targetValue) && isObject(subPatch) && !isRef(subPatch)) { // 如果是ref 就不递归了
                target[key] = merge(targetValue,subPatch)
            } else {
                target[key] = subPatch; // 如果不需要合并直接用新的覆盖掉老的即可
            }
        }
        return target
    }
    function $patch(partialStateOrMutator) { // 这里我们需要获取到原来的所有状态
        // partialStateOrMutator 部分状态
        // 当前store中的全部状态  pinia.state.value[id]
        // {a:{a:1,b:1}}   {a:{a:2}}   => {a:{a:2,b:1}}

        if (typeof partialStateOrMutator !== 'function') {
            merge(pinia.state.value[id], partialStateOrMutator)
        } else {
            partialStateOrMutator(pinia.state.value[id]); // 将当前的store的状态传递到函数中
        }
    }

    const actionSubscriptions = []; // 所有订阅的action事件 都应该放到此数组中
    const partialStore = {
        $patch,

        // 订阅状态
        $subscribe(callback) {
            // 默认vue3中watch一个响应式数据 深度监控的  可以直接放一个响应式对象
            watch(pinia.state.value[id], state => {
                callback({id},state)
            })
        },

        // 订阅用户的action操作
        $onAction: addSubscription.bind(null, actionSubscriptions), // 订阅
    }


    const store = reactive(partialStore); // pinia 就是创建了一个响应式对象而已
    function wrapAction(action) {
        return function () {
            // 将action中的this永远处理成store，保证this指向正确
            const afterCallbacks = [];
            const onErrorCallbacks = []

            const after = (callback) => {
                afterCallbacks.push(callback);
            }
            const onError = (callback) => {
                onErrorCallbacks.push(callback);
            }

            triggerSubscriptions(actionSubscriptions, { after, onError }); // 让用户传递after和error

            // 回调的方式
            let ret;
            try { // 正常action是一个回调的情况 ，我们可以直接拿到返回值触发after回调
                ret = action.call(store, ...arguments);
                triggerSubscriptions(afterCallbacks,ret)
            } catch (e) {
                triggerSubscriptions(onErrorCallbacks,e)
            }
            // 返回值是promise的情况 针对场景做处理
            if (ret instanceof Promise) {
                return ret.then(value => {
                    triggerSubscriptions(afterCallbacks,value)
                }).catch(error => {
                    triggerSubscriptions(onErrorCallbacks,error)
                })
            }
            return ret
        }
    }
    if (isSetupStore) {
        pinia.state.value[id] = {}; // 用于存放setupStore的id 对应的状态
    }
    const setupStore = setup(); // 拿到的setupStore 可能没有处理过this指向
    for (let prop in setupStore) {
        const value = setupStore[prop]
        if (typeof value === 'function') {
            // 将函数的this永远指向store
            setupStore[prop] = wrapAction(value)
        } else if (isSetupStore) { // 对setupStore来做一些处理操作
            // 是用户写的compositionApi
            if (!isComputed(value)) {
                pinia.state.value[id][prop] = value; // 将用户返回的对象里面的所有属性，都存到state属性中
            }
        }
    }
    // store[double] = 0
    Object.assign(store, setupStore)



    Object.defineProperty(store, '$state', {
        get() {
            return pinia.state.value[id]; // 取值操作
        },
        set(newState) {
            store.$patch(newState); // 设置状态
        }
    })

    pinia._p.forEach(plugin => {
        plugin({store,id})
    })
    pinia._s.set(id, store)
    return store;
}
export function defineStore(idOrOptions, setup) {
    let id;
    let options;
    const isSetupStore = typeof setup === 'function'; // 区分optionsAPI 还是setupApi
    // 对用户的两种写法做一个处理
    if (typeof idOrOptions === 'string') {
        id = idOrOptions;
        options = setup;
    } else {
        options = idOrOptions;
        id = idOrOptions.id;
    }
    function useStore() {
        // 这个useStore 只能在组件中使用
        const currentInstance = getCurrentInstance();
        const pinia = currentInstance && inject(PiniaSymbol)
        // return store

        if (!pinia._s.has(id)) { // 这个store是第一次使用
            if (isSetupStore) {
                createSetupStore(id, setup, pinia,isSetupStore); // 创建一个setupStore
            } else {
                // 创建选项store， 还有可能是setupStore
                createOptionStore(id, options, pinia); // 创建后的store只需要存到_s中即可
            }
        }
        const store = pinia._s.get(id); // 如果已经有了store这不用创建直接拿到即可
        return store
    }

    return useStore;
}

// https://prazdevs.github.io/pinia-plugin-persistedstate/zh/guide/