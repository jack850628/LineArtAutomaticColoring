import Vue from 'vue';
import vuetify from '@/plugins/vuetify';
import VueP5 from 'vue-p5';
import {generator, waitModelLoad} from './u2model';

Vue.component('vue-p5', VueP5);

const STATUS = {
    INIT: 0,
    DRAW_WRITE: 1,
    SET_IMAGE: 2
}
const TOOLS = {
    PEN: 0,
    ERASER: 1
}
const LINE_SIZE = {
    X1: 1,
    X4: 4,
    X8: 8,
    X12: 12
}

function newSizeH(w , h, nw){
    return (nw * h) / w;
}
function resetOrientation(srcBase64, srcOrientation, callback) {
    var img = new Image();	

    img.onload = function() {
        var width = img.width,
                height = img.height,
            canvas = document.createElement('canvas'),
                ctx = canvas.getContext("2d");
            
        // set proper canvas dimensions before transform & export
        if (4 < srcOrientation && srcOrientation < 9) {
            canvas.width = height;
            canvas.height = width;
        } else {
            canvas.width = width;
            canvas.height = height;
        }
        
        // transform context before drawing image
        switch (srcOrientation) {
            case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
            case 3: ctx.transform(-1, 0, 0, -1, width, height ); break;
            case 4: ctx.transform(1, 0, 0, -1, 0, height ); break;
            case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
            case 6: ctx.transform(0, 1, -1, 0, height , 0); break;
            case 7: ctx.transform(0, -1, -1, 0, height , width); break;
            case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
            default: break;
        }

            // draw image
        ctx.drawImage(img, 0, 0);

        // export base64
        callback(canvas.toDataURL());
    };

    img.src = srcBase64;
}

window.onload = function(){
    new Vue({
        el: '#app',
        vuetify,
        data: {
            STATUS,
            TOOLS,
            LINE_SIZE,
            title: '線稿自動上色',
            sheet: false,
            canvasHeight: 450,
            canvasWidth: 450,
            avatar: '',
            avatarHeight: 0,
            avatarWidth: 0,
            avatarX: 0,
            avatarY: 0,
            sliderVal: 450,
            hide: true,
            isModelLoaded: false,

            p5_sketch: null,
            p5_output_sketch: null,
            p5_avatar: null,
            P5_mouseX: -1,
            p5_mouseY: -1,
            p5_status: STATUS.INIT,

            tool: TOOLS.PEN,
            lineSize: LINE_SIZE.X1,
        },
        watch:{
            sliderVal(nv){
                let t = newSizeH(this.avatarWidth, this.avatarHeight, nv);
                this.avatarX -= (nv - this.avatarWidth) / 2;
                this.avatarY -= (t - this.avatarHeight) / 2;
                this.avatarHeight = t;
                this.avatarWidth = nv;
            }
        },
        methods: {
            avatarLoad(){
                this.avatarHeight = newSizeH(avatar.width, avatar.height, this.canvasWidth);
                this.avatarWidth = this.canvasWidth;
                this.avatarX = 0;
                this.avatarY = 0;
                this.sliderVal = this.avatarWidth;
            },
            fileUpLoad(){
                uimg.click();
            },
            fileLoad(file){
                file = file.target.files[0];
                if(file){
                    this.avatar = URL.createObjectURL(file);
                    this.p5_avatar = this.p5_sketch.loadImage(this.avatar);
                    console.log(this.p5_avatar)
                    this.hide = false;
                    this.p5_status = STATUS.SET_IMAGE;
                }
            },
            clickArrow(arrowBtn){
                switch(arrowBtn.target.innerText){
                    case '←':
                        this.avatarX -= 3;
                        break;
                    case '↑':
                        this.avatarY -= 3;
                        break;
                    case '→':
                        this.avatarX += 3;
                        break;
                    case '↓':
                        this.avatarY += 3;
                        break;
                }
            },
            clickZoom(btn){
                switch(btn.target.innerText){
                    case '+':
                        this.sliderVal = Math.min(this.sliderVal + 3, this.canvasWidth * 2);
                        break;
                    case '-':
                        this.sliderVal = Math.max(this.sliderVal - 3, 1);
                        break;
                }
            },
            clickRotateArrow(arrowBtn){
                switch(arrowBtn.target.innerText){
                    case '↻':
                        resetOrientation(avatar.src, 6, (src)=>{
                            avatar.src = src;
                            this.p5_avatar = this.p5_sketch.loadImage(src);
                        });
                        break;
                    case '↺':
                        resetOrientation(avatar.src, 8, (src)=>{
                            avatar.src = src;
                            this.p5_avatar = this.p5_sketch.loadImage(src);
                        });
                        break;
                }
            },
            p5_imageMove(mouseX, mouseY, isMouseDown=false){
                if(
                    mouseX < 0 || mouseX > this.canvasWidth
                    ||
                    mouseY < 0 || mouseY > this.canvasHeight
                ){
                    isMouseDown = false;
                }
                if(isMouseDown){
                    if (this.P5_mouseX == -1 || this.p5_mouseY == -1) {
                        this.P5_mouseX = mouseX;
                        this.p5_mouseY = mouseY;
                        return;
                    }
                    this.avatarX = this.avatarX - (this.P5_mouseX - mouseX);
                    this.avatarY = this.avatarY - (this.p5_mouseY - mouseY);
                    this.P5_mouseX = mouseX;
                    this.p5_mouseY = mouseY;
                }else{
                    this.P5_mouseX = this.p5_mouseY = -1;
                }
            },
            ok(){
                var canvas = document.createElement('canvas');
                canvas.width = canvas.height = 256;
                canvas.getContext("2d").drawImage(document.querySelector('#p5-canvas > canvas'), 0, 0, 256, 256);  

                setTimeout((function(){
                    generator(canvas, document.querySelector('#p5-output-canvas > canvas'));
                }).bind(this));
                // var ctx = canv.getContext('2d');
                // ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
                // ctx.drawImage(avatar, this.avatarX, this.avatarY, this.avatarWidth, this.avatarHeight);
                // // console.log(canv.toDataURL());
                // form.photo.value = canv.toDataURL();
                // form.submit();
            },
            sketch(sk){
                this.p5_sketch = sk;
                // console.log('sketch');
            },
            preload(sketch){
                this.p5_avatar = sketch.loadImage('./default.jpg');
            },
            setup(sketch){
                // console.log('setup');
                sketch.createCanvas(this.canvasWidth, this.canvasHeight);
                sketch.background(sketch.color(255, 255, 255));
            },
            draw(sketch){
                // console.log('draw', this.p5_rotate);
                if(this.p5_status == STATUS.INIT){
                    sketch.image(this.p5_avatar, 0, 0, 450, 453);
                    this.p5_status = STATUS.DRAW_WRITE;
                }else if(this.p5_status == STATUS.SET_IMAGE && this.p5_avatar){
                    sketch.background(sketch.color(255, 255, 255));

                    sketch.image(this.p5_avatar, this.avatarX, this.avatarY, this.avatarWidth, this.avatarHeight);
                    
                    this.p5_imageMove(sketch.mouseX, sketch.mouseY, sketch.mouseIsPressed);
                }else if(this.p5_status == STATUS.DRAW_WRITE){
                    if(sketch.mouseIsPressed){
                        if(this.tool == TOOLS.PEN){
                            sketch.stroke(0, 0, 0);
                        }else if(this.tool == TOOLS.ERASER){
                            sketch.stroke(255, 255, 255);
                        }
                        sketch.strokeWeight(this.lineSize);
                        sketch.line(sketch.mouseX, sketch.mouseY, sketch.pmouseX, sketch.pmouseY);
                    }
                }
            },
            outputSketch(sk){
                this.p5_output_sketch = sk;
                // console.log('sketch');
            },
            outputSetup(sketch){
                // console.log('setup');
                sketch.createCanvas(this.canvasWidth, this.canvasHeight);
                sketch.background(sketch.color(255, 255, 255));
            },
        },
        mounted(){
            waitModelLoad().then(result => this.isModelLoaded=result);
        }
    });
};