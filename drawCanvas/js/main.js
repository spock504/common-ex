let canvas = document.getElementById('myCanvas');
let ctx = myCanvas.getContext('2d');
const aColorBtn = document.getElementsByClassName('color-item')
const range = document.getElementById("range");
const save = document.getElementById("save");
const eraser = document.getElementById("eraser");
const brush = document.getElementById("brush");
const reSetCanvas = document.getElementById("clear");

let clear = false;
let lWidth = 4;

autoSetSize() // 设置画板的宽高
listenToUser(); // 绘制线条
getColor(); // 颜色修改
setCanvasBg('white') // 设置背景为白色

// 页面卸载前提示
window.onbeforeunload = function () {
    return "Reload site?";
};

// 画笔
brush.onclick = function () {
    clear = false;
    this.classList.add("active");
    eraser.classList.remove("active");
}

// 橡皮擦
eraser.onclick = function () {
    clear = true;
    this.classList.add("active");
    brush.classList.remove("active");
}

// 保存
save.onclick = function () {
    let imgUrl = canvas.toDataURL("image/png");
    let saveA = document.createElement("a");
    document.body.appendChild(saveA);
    saveA.href = imgUrl;
    saveA.download = "img" + (new Date).getTime();
    saveA.target = "_blank";
    saveA.click();
    document.body.removeChild(saveA);
};

// 清空
reSetCanvas.onclick = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCanvasBg('white');
};

// 自适应画板的大小
function autoSetSize() {
    canvasSetSize()
    // 设置画板宽高
    function canvasSetSize() {
        let pageWidth = document.documentElement.clientWidth;
        let pageHeight = document.documentElement.clientHeight;

        canvas.width = pageWidth;
        canvas.height = pageHeight;
    }
    window.onresize = function () {
        canvasSetSize()
    }
}

// 画笔粗细
range.onchange = function () {
    lWidth = this.value;
}

// 设置颜色
function getColor() {
    for (let i = 0; i < aColorBtn.length; i++) {
        aColorBtn[i].onclick = function () {
            for (let i = 0; i < aColorBtn.length; i++) {
                aColorBtn[i].classList.remove("active");
                this.classList.add("active");
                activeColor = this.style.backgroundColor;
                ctx.fillStyle = activeColor;
                ctx.strokeStyle = activeColor;
            }
        }
    }
}

// 绘制线条
function listenToUser() {
    let painting = false; // 绘画状态
    let lastPoint = { x: undefined, y: undefined }; // 最后的坐标点信息

    if (document.body.ontouchstart !== undefined) {
        // 移动端
        canvas.ontouchstart = function (e) {
            this.firstDot = ctx.getImageData(0, 0, canvas.width, canvas.height);//在这里储存绘图表面
            saveData(this.firstDot);
            painting = true;
            const canvasLeft = e.target.offsetLeft;
            const canvasTop = e.target.offsetTop;
            let x = e.changedTouches[0].clientX - canvasLeft;
            let y = e.changedTouches[0].clientY - canvasTop;
            lastPoint = { "x": x, "y": y };
            ctx.save();
            ctx.beginPath();
        };
        // 触摸移动
        canvas.ontouchmove = function (e) {
            if (painting) {
                const canvasLeft = e.target.offsetLeft;
                const canvasTop = e.target.offsetTop;
                let x = e.changedTouches[0].clientX - canvasLeft;
                let y = e.changedTouches[0].clientY - canvasTop;
                let newPoint = { "x": x, "y": y };
                drawLine(lastPoint.x, lastPoint.y, newPoint.x, newPoint.y);
                lastPoint = newPoint;
            }
        };
        //  触摸停下
        canvas.ontouchend = function () {
            painting = false;
        }
    } else {
        // pc端
        canvas.onmousedown = function (e) {
            this.firstDot = ctx.getImageData(0, 0, canvas.width, canvas.height);//在这里储存绘图表面
            saveData(this.firstDot);
            var canvasLeft = e.target.offsetLeft;
            var canvasTop = e.target.offsetTop;
            painting = true;
            let x = e.clientX - canvasLeft;
            let y = e.clientY - canvasTop;
            lastPoint = { "x": x, "y": y };
            ctx.save(); // 先保存
            ctx.beginPath(); // 开始绘制
        };
        canvas.onmousemove = function (e) {
            // console.log("onmousemove")
            if (painting) {
                var canvasLeft = e.target.offsetLeft;
                var canvasTop = e.target.offsetTop;
                let x = e.clientX - canvasLeft;
                let y = e.clientY - canvasTop;
                let newPoint = { "x": x, "y": y };
                drawLine(lastPoint.x, lastPoint.y, newPoint.x, newPoint.y, clear);
                lastPoint = newPoint;
            }
        };

        canvas.onmouseup = function () {
            painting = false;
        };

        canvas.mouseleave = function () {
            painting = false;
        }
    }
}

// 绘制图线
function drawLine(x1, y1, x2, y2) {
    ctx.lineWidth = lWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (clear) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out"; //只有源图像外的目标图像部分会被显示，源图像是透明的。
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.closePath();
        ctx.clip(); // 原始画布中剪切
        ctx.clearRect(0, 0, canvas.width, canvas.height); // ?清空给定矩形内的指定像素
        ctx.restore(); // 从绘图堆栈中弹出上一个Canvas的状态
    } else {
        ctx.moveTo(x1, y1); // 开始位置
        ctx.lineTo(x2, y2); // 结束位置
        ctx.stroke();
        ctx.closePath();
    }
}

// 设置背景
function setCanvasBg(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
}

let historyData = [];

function saveData(data) {
    (historyData.length === 10) && (historyData.shift());// 上限为储存10步，太多了怕挂掉
    historyData.push(data);
}

// 上一步
undo.onclick = function () {
    if (historyData.length < 1) return false;
    ctx.putImageData(historyData[historyData.length - 1], 0, 0); //通过 getImageData() 复制画布上指定矩形的像素数据，然后通过 putImageData() 将图像数据放回画布
    historyData.pop()
};