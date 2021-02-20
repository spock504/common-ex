const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';

class MyPromise {
    constructor(executor) {
        // 默认状态为 PENDING
        this.status = PENDING;
        // 存放成功状态的值，默认为 undefined
        this.value = undefined;
        // 存放失败状态的值，默认为 undefined
        this.reason = undefined;
        // NOTE1:  发布-订阅者模式解决异步问题 （需要先将成功和失败的回调分别存放起来，在executor()的异步任务被执行时，触发 resolve 或 reject，依次调用成功或失败的回调）
        // 存放成功的回调
        this.onResolvedCallbacks = [];
        // 存放失败的回调
        this.onRejectedCallbacks = [];

        // 调用此方法就是成功
        let resolve = (value) => {
            // 状态为 PENDING 时才可以更新状态，防止 executor 中调用了两次 resovle/reject 方法
            if (this.status === PENDING) {
                this.status = FULFILLED;
                this.value = value;
                // 依次将对应的函数执行
                this.onResolvedCallbacks.forEach(fn => fn());
            }
        }

        // 调用此方法就是失败
        let reject = (reason) => {
            // 状态为 PENDING 时才可以更新状态，防止 executor 中调用了两次 resovle/reject 方法
            if (this.status === PENDING) {
                this.status = REJECTED;
                this.reason = reason;
                this.onRejectedCallbacks.forEach(fn => fn());
            }
        }

        try {
            // 立即执行，将 resolve 和 reject 函数传给使用者  
            executor(resolve, reject)
        } catch (error) {
            // 发生异常时执行失败逻辑
            reject(error)
        }
    }

    // 包含一个 then 方法，并接收两个参数 onFulfilled、onRejected
    then(onFulfilled, onRejected) {
        if (this.status === FULFILLED) {
            onFulfilled(this.value)
        }

        if (this.status === REJECTED) {
            onRejected(this.reason)
        }

        if (this.status === PENDING) {
            // 如果promise的状态是 pending，需要将 onFulfilled 和 onRejected 函数存放起来，等待状态确定后，再依次将对应的函数执行
            this.onResolvedCallbacks.push(() => {
                onFulfilled(this.value)
            });

            this.onRejectedCallbacks.push(() => {
                onRejected(this.reason)
            });
        }
    }
}

// 测试用例
const promise = new MyPromise((resolve, reject) => {
    console.log('同步 1');
    setTimeout(() => {
        resolve('异步 2');
    }, 1000);
}).then(
    (data) => {
        console.log('success', data)
    },
    (err) => {
        console.log('faild', err)
    }
)

