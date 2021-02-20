// * 1. Promise 是没有中断方法的，使用 race 来自己封装中断方法：
function wrap(promise) {
    // 在这里包装一个 promise，可以控制原来的promise是成功还是失败
    let abort;
    let newPromise = new Promise((resolve, reject) => { // defer 方法
        abort = reject;
    });
    let p = Promise.race([promise, newPromise]); // 任何一个先成功或者失败 就可以获取到结果
    p.abort = abort;
    return p;
}

const promise = new Promise((resolve, reject) => {
    setTimeout(() => { // 模拟的接口调用 ajax 肯定有超时设置
        resolve('成功');
    }, 1000);
});

let newPromise = wrap(promise);

setTimeout(() => {
    // 超过300毫秒 就算超时 应该让 proimise 走到失败态
    newPromise.abort('超时了');
}, 300);

newPromise.then((data => {
    console.log('成功的结果' + data)
})).catch(e => {
    console.log('失败的结果' + e)
})
// 控制台等待 300ms 后输出： 失败的结果超时了

// * 2. 让Promise.all在rejected失败后依然返回resolved成功结果

const p1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve(1);
    }, 1000);
});
const p2 = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject(2); // 失败
    }, 500);
});

const promiseArr = [p1, p2];
const newPromiseArr = promiseArr.map((promiseItem) => {
    return promiseItem.catch((err) => {
        return err;
    })
})

Promise.all(newPromiseArr)
    .then((res) => {
        console.log(res); //[1,2] 都走这里
    }).catch((err) => {
        console.log(err);
    });
