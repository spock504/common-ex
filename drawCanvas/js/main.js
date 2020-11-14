var canvas = document.getElementById('myCanvas');
var ctx = myCanvas.getContext('2d');

let clear = false;
let lWidth = 4;

listenToUser(canvas);

function listenToUser(canvas) {
    let painting = false; // 绘画状态
    let lastPoint = { x: undefined, y: undefined }; // 最后的坐标点信息

    if (document.body.ontouchstart !== undefined) {
        // 移动端
        canvas.ontouchstart = function (e) {
            console.log('start', e.target)
            painting = true;
            var canvasLeft = e.target.offsetLeft;
            var canvasTop = e.target.offsetTop;
            let x = e.changedTouches[0].clientX - canvasLeft;
            let y = e.changedTouches[0].clientY - canvasTop;
            lastPoint = { "x": x, "y": y };
            ctx.save();
        };
        // 触摸移动
        canvas.ontouchmove = function (e) {
            if (painting) {
                var canvasLeft = e.target.offsetLeft;
                var canvasTop = e.target.offsetTop;
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
            var canvasLeft = e.target.offsetLeft;
            var canvasTop = e.target.offsetTop;
            painting = true;
            let x = e.clientX - canvasLeft;
            let y = e.clientY - canvasTop;
            lastPoint = { "x": x, "y": y };
            ctx.save();
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
    ctx.moveTo(x1, y1); // 开始位置
    ctx.lineTo(x2, y2); // 结束位置
    ctx.stroke();
    ctx.closePath();
}