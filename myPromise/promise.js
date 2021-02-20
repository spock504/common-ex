const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';

const isFunction = (fn) => {
    return typeof fn === 'function'
}

const resolvePromise = (promise2, x, resolve, reject) => {
    // 自己等待自己完成是错误的实现，用一个类型错误，结束掉 promise  Promise/A+ 2.3.1
    if (promise2 === x) {
        return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
    }
    // Promise/A+ 2.3.3.3.3 只能调用一次
    let called;
    // 后续的条件要严格判断 保证代码能和别的库一起使用
    if ((typeof x === 'object' && x != null) || isFunction(x)) {
        try {
            // 为了判断 resolve 过的就不用再 reject 了（比如 reject 和 resolve 同时调用的时候）  Promise/A+ 2.3.3.1`
            let then = x.then;
            if (isFunction(then)) {
                // 不要写成 x.then，直接 then.call 就可以了 因为 x.then 会再次取值，Object.defineProperty  Promise/A+ 2.3.3.3
                then.call(x, y => { // 根据 promise 的状态决定是成功还是失败
                    if (called) return;
                    called = true;
                    // 递归解析的过程（因为可能 promise 中还有 promise） Promise/A+ 2.3.3.3.1
                    resolvePromise(promise2, y, resolve, reject);
                }, r => {
                    // 只要失败就失败 Promise/A+ 2.3.3.3.2
                    if (called) return;
                    called = true;
                    reject(r);
                });
            } else {
                // 如果 x.then 是个普通值就直接返回 resolve 作为结果  Promise/A+ 2.3.3.4
                resolve(x);
            }
        } catch (e) {
            // Promise/A+ 2.3.3.2
            if (called) return;
            called = true;
            reject(e)
        }
    } else {
        // 如果 x 是个普通值就直接返回 resolve 作为结果  Promise/A+ 2.3.4  
        resolve(x)
    }
}


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

            // promise.resolve 是具备等待功能的。如果参数是 promise 会等待这个 promise 解析完毕，再向下执行，
            if (value instanceof MyPromise) {
                // 递归解析 
                return value.then(resolve, reject)
            }
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
            console.log('reason',reason);
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
        //解决 onFufilled，onRejected 没有传值的问题
        //Promise/A+ 2.2.1 / Promise/A+ 2.2.5 / Promise/A+ 2.2.7.3 / Promise/A+ 2.2.7.4
        onFulfilled = isFunction(onFulfilled) ? onFulfilled : v => v;
        //因为错误的值要让后面访问到，所以这里也要抛出个错误，不然会在之后 then 的 resolve 中捕获
        onRejected = isFunction(onRejected) ? onRejected : err => { throw err };
        // 每次调用 then 都返回一个新的 promise，可用于then 的链式调用  Promise/A+ 2.2.7
        let promise2 = new MyPromise((resolve, reject) => {
            if (this.status === FULFILLED) {
                //Promise/A+ 2.2.2
                //Promise/A+ 2.2.4 --- setTimeout
                setTimeout(() => {
                    try {
                        //Promise/A+ 2.2.7.1
                        let x = onFulfilled(this.value);
                        // x可能是一个proimise
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        //Promise/A+ 2.2.7.2
                        reject(e)
                    }
                }, 0);
            }

            if (this.status === REJECTED) {
                //Promise/A+ 2.2.3
                setTimeout(() => {
                    try {
                        let x = onRejected(this.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e)
                    }
                }, 0);
            }

            if (this.status === PENDING) {
                // 如果promise的状态是 pending，需要将 onFulfilled 和 onRejected 函数存放起来，等待状态确定后，再依次将对应的函数执行
                this.onResolvedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            let x = onFulfilled(this.value);
                            resolvePromise(promise2, x, resolve, reject);
                        } catch (e) {
                            reject(e)
                        }
                    }, 0);
                });

                this.onRejectedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            let x = onRejected(this.reason);
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (e) {
                            reject(e)
                        }
                    }, 0);
                });
            }

        })
        return promise2;
    }

    static resolve(data) {
        return new MyPromise((resolve, reject) => {
            resolve(data);
        })
    }

    static reject(reason) {
        return new MyPromise((resolve, reject) => {
            reject(reason);
        })
    }
}

// catch 用来捕获 promise 的异常，就相当于一个没有成功的 then。
MyPromise.prototype.catch = function (errCallback) {
    return this.then(null, errCallback)
}

// finally 无论如何都会执行
MyPromise.prototype.finally = function (callback) {
    return this.then((value) => {
        return MyPromise.resolve(callback()).then(() => value)
    }, (reason) => {
        return MyPromise.resolve(callback()).then(() => { throw reason })
    }
    )
}

// promise.all 是解决并发问题的，多个异步并发获取最终的结果（如果有一个失败则失败）。
MyPromise.all = function (values) {
    if (!Array.isArray(values)) {
        const type = typeof values;
        return new TypeError(`TypeError: ${type} ${values} is not iterable`)
    }

    return new MyPromise((resolve, reject) => {
        let resultArr = [];
        let orderIndex = 0;
        const processResultByKey = (value, index) => {
            resultArr[index] = value;
            if (++orderIndex === values.length) {
                resolve(resultArr)
            }
        }
        for (let i = 0; i < values.length; i++) {
            let value = values[i];
            if (value && typeof value.then === 'function') {
                value.then((value) => {
                    processResultByKey(value, i);
                }, reject);
            } else {
                processResultByKey(value, i);
            }
        }
    });
}

// 采用最快的，不管结果本身是成功状态还是失败状态
Promise.race = function(promises) {
    return new Promise((resolve, reject) => {
      // 一起执行就是for循环
      for (let i = 0; i < promises.length; i++) {
        let val = promises[i];
        if (val && typeof val.then === 'function') {
          val.then(resolve, reject);
        } else { // 普通值
          resolve(val)
        }
      }
    });
}


// 测试用例
// 1. resolve
// MyPromise.resolve(new MyPromise((resolve, reject) => {
//     setTimeout(() => {
//         reject('ok');
//     }, 3000);
// })).then(data => {
//     console.log(data, 'success')
// }).catch(err => {
//     console.log(err, 'error')
// })

// 2. finally
// MyPromise.resolve(456).finally(() => {
//     return new MyPromise((resolve, reject) => {
//         console.log('1. 都会运行');
//         setTimeout(() => {
//             console.log('2. 状态改变');
//             resolve(123)
//         }, 3000);
//     })
// }).then(data => {
//     console.log(data, 'success')
// }).catch(err => {
//     console.log(err, 'error')
// })
// 3. all
let p1 = new MyPromise((resolve, reject) => {
    setTimeout(() => {
        resolve('ok1');
    }, 2000);
})

let p2 = new MyPromise((resolve, reject) => {
    setTimeout(() => {
        reject('ok2');
    }, 1000);
})

MyPromise.all([1, 2, 3, p1, p2]).then(data => {
    console.log('resolve', data);
}, err => {
    console.log('reject', err);
})


MyPromise.defer = MyPromise.deferred = function () {
    let dfd = {
    };
    dfd.promise = new MyPromise((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    })
    return dfd;
}

module.exports = MyPromise; // 导出模块用于promises-aplus-tests 检验promise功能