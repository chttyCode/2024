export function addSubscription(subscriptions,callback) { // 订阅
    subscriptions.push(callback); // 将回调放到队列(数组)中
    const removeSubcription = () => {
        const idx = subscriptions.indexOf(callback);
        if (idx > -1) {
            subscriptions.splice(idx,1)
        }
    }
    return removeSubcription
}

export function triggerSubscriptions(subscriptions, ...args) { // 发布
    subscriptions.slice().forEach(cb=>cb(...args))
}