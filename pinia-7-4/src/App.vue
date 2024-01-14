<script setup>
import { storeToRefs } from "./pinia";
import { useCounterStore } from "./stores/counter";
const store = useCounterStore();
 const { count } = storeToRefs(store)
console.log(storeToRefs(store))
const { increment } = store;

// devtool 会去查看到两次修改信息, 这个方法平时使用的不多
const patch = () => {
  // store.$patch({ count: 2 }); // react setState  {count:100,a:1,b:2}
  // store.count++;
  // store.count++;
  store.$patch((state) => {
    state.count++;
    state.count++;
  });
};
const reset =()=> {
  store.$reset(); // 拿到默认的state方法在执行一次获取默认值，覆盖掉所用的状态
}
// 类似于  vuex中也实现了一个  $subscribe
store.$subscribe((mutation, state) => { // 只要状态变化了 ，我们可以监控到 发生的动作和最新的状态是什么
  console.log(mutation, state); // 存到本地
});

store.$onAction(({after,onError}) => {
  // 大多数action 是一个promise， 我们希望action执行后再执行一些额外的逻辑
  after(() => {
      console.log(store.count)
  })
  after(() => {
      console.log(store.count)
  })
  onError(err => {
    console.warn(err)
  })
})

</script>
<template>

  {{ count }}
  <div>计数器：{{ store.count }}</div>
  <button @click="increment(2)">累加</button>
  <div>双倍: {{ store.double }}</div>
  <!-- 这种方式可以修改，但是不建议，一般修改状态都是希望统一逻辑来修改 -->


  <!-- patch 直接修改部分所有的状态  reset用默认状态进行覆盖 -->
  <button @click="patch">同时多次修改状态</button>
  <button @click="reset">重置</button>

</template>
<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
