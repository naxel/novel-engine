/**
 * User: Alexander
 * Date: 07.01.12
 * Time: 19:09
 */
/*
@todo Форматирование текста при помощи управляемых символов "/n"
@todo Определение стадии загрузки контента(музыка, картинки), если не загрузились нуэные ставить таймер и проверки и отображать страницу загрузки
 */
var novelEngine = ({

    _novelName: null,

    _sourceLink: null,

    _widthScreen: 800,

    _heightScreen: 600,

    _stop: false,

    _history: 0,

    _autoPlay: false, //true if debug mode only

    _drawTextInterval: null,

    _drawText: false,

    _textCanvas: null,
    _bgCanvas: null,
    _spriteCanvas: null,
    _bgCtx: null,
    _textCtx: null,
    _spriteCtx: null,
    _leftMargin: 40,
    _interline: 28,
    _leftMarginDefault: 40,
    textSpeed: 40,
    _bgcolor: '#000000',

    _textRow: 0,

    _currentAction: 1,
    _actions: null,

    _imageElements: {},
    _imagePath: 'files/images/',
    _backgroundExt: '.jpg',
    _spriteExt: '.png',
    _currentBg: null,
    _currentSprites: null,

    //@todo Create effects

    _voiceElements: {},
    _voicePath: 'files/voice/',
    _voiceExt: '.ogg',
    _voiceVolume: 0.5,
    _currentVoice: null,

    _musicElements: {},
    _musicPath: 'files/sound/',
    _musicExt: '.ogg',
    _musicVolume: 0.1,
    _currentMusic: null,
    _currentSound: null,

    _currentLinks: null,

    _historyView: false,

    init: function() {

        if (!this._sourceLink) {
            alert('Not set source link');
        }
        if (!this._novelName) {
            alert('Not set novel name');
        }

        if (!this._bgCtx || !this._textCtx || !this._spriteCtx) {
            this._textCanvas = document.createElement('canvas');
            this._historyCanvas = document.createElement('canvas');
            this._bgCanvas = document.createElement('canvas');
            this._spriteCanvas = document.createElement('canvas');
            this._textCanvas.setAttribute('id', 'textCanvas');
            this._historyCanvas.setAttribute('id', 'historyCanvas');
            this._historyCanvas.height = this._textCanvas.height = this._bgCanvas.height = this._spriteCanvas.height = this._heightScreen;
            this._historyCanvas.width = this._textCanvas.width  = this._bgCanvas.width  = this._spriteCanvas.width  = this._widthScreen;
            this._historyCanvas.style.display = 'none';

            document.getElementById('canvas').appendChild(this._bgCanvas);
            document.getElementById('canvas').appendChild(this._spriteCanvas);
            document.getElementById('canvas').appendChild(this._textCanvas);
            document.getElementById('canvas').appendChild(this._historyCanvas);

            this._bgCtx = this._bgCanvas.getContext('2d');
            this._textCtx = this._textCanvas.getContext('2d');
            this._spriteCtx = this._spriteCanvas.getContext('2d');
            this._historyCtx = this._historyCanvas.getContext('2d');
            this._historyCtx.fillStyle = '#000';
            this._historyCtx.fillRect(0, 0, this._widthScreen, this._heightScreen);
        }
    },

    start: function() {
        if (!this._bgCtx || !this._textCtx || !this._spriteCtx) {
            this.init();
        }
        this.destroyGame(true);
        this.listenKeyboard(false);

        this._stop = true;
        clearInterval(this._drawTextInterval);
        this.drawLoadingScreen();
        this._actions = [];
        $.ajax({
             url: novelEngine._sourceLink,
             dataType: 'json',
             success: function(data) {
                 if (data) {
                     novelEngine.stopMusic();
                     novelEngine.stopVoice();
                     novelEngine._currentMusic = null;
                     novelEngine._currentVoice = null;
                     novelEngine._currentSound = null;
                     novelEngine._currentBg = null;
                     novelEngine._currentSprites = null;

                     novelEngine._actions = data;
                     //console.log(data);
                     novelEngine.addActions();

                     setTimeout(function() {
                         novelEngine._textRow = 0;
                         novelEngine.clearText();
                         novelEngine.clearSprite();
                         novelEngine._stop = false;
                         novelEngine.next();
                     }, 1000);
                 }
             }
        });
    },

    setSourceLink: function(link) {
        this._sourceLink = link;
    },
    setNovelName: function(name) {
        this._novelName = name;
    },

    showHideText: function() {
        if (!this._historyView) {
            if (this._textCanvas.style.display == 'none') {
                this._textCanvas.style.display = 'block';
            } else {
                this._textCanvas.style.display = 'none';
            }
        }
    },

    next: function() {
        if (this._drawText) {
            this._drawText = false;
        }
        //history
        if (this._stop && this._textCanvas.style.display == 'none' && this._historyCanvas.style.display == 'block') {
            this._stop = false;
            this._historyCanvas.style.display = 'none';
            this._textCanvas.style.display = 'block';
            this._historyView = false;
            return this;
        }
        if (this._stop || !this._actions || !this._actions[this._history][this._currentAction]) {
            return this;
        }
        if (!novelEngine.timeout) {
            novelEngine.timeout = true;
            setTimeout(function() {
                novelEngine.timeout = false;
            }, 1000);
        } else {
            return this;
        }
        clearInterval(this._drawTextInterval);

        if (this._actions[this._history][this._currentAction].bg && this._actions[this._history][this._currentAction].bg != this._currentBg) {
            this._currentBg = this._actions[this._history][this._currentAction].bg;
            //console.log(this._imageElements[this._currentBg].width, this._currentBg);
            if (this._imageElements[this._currentBg].loaded) {
                this.drawBg();
            } else {
                console.log('not loaded');
                this._stop = true;
                setTimeout(function() {
                    novelEngine._stop = false;
                    novelEngine.next();
                }, 1000);
                return this;
            }
        }

        if (this._actions[this._history][this._currentAction].music && this._actions[this._history][this._currentAction].music != this._currentMusic) {
            if (this._currentMusic) {
                this.stopMusic();
            }
            this._currentMusic = this._actions[this._history][this._currentAction].music;

            this.playMusic();
            //console.log(this._currentMusic);
        }
        if (this._currentVoice) {
            this.stopVoice();
        }
        if (this._actions[this._history][this._currentAction].voice && this._actions[this._history][this._currentAction].voice != this._currentVoice) {
            this._currentVoice = this._actions[this._history][this._currentAction].voice;
            this.playVoice();
        }
        if (this._actions[this._history][this._currentAction].sound && this._actions[this._history][this._currentAction].sound != this._currentSound) {
            this._currentSound = this._actions[this._history][this._currentAction].sound;
            this.playSound();
        }

        if (this._actions[this._history][this._currentAction].bgcolor) {
            this._bgcolor = this._actions[this._history][this._currentAction].bgcolor;
            this.drawBgColor();
        }
        if (this._actions[this._history][this._currentAction].sprites && this._actions[this._history][this._currentAction].sprites != this._currentSprites) {
            this._currentSprites = this._actions[this._history][this._currentAction].sprites;
            this.drawSprites();
        }
        if (this._actions[this._history][this._currentAction].text) {
            this._currentText = '    ' + this._actions[this._history][this._currentAction].text;
            if (this._actions[this._history][this._currentAction].newscreen == '1') {
                this._textRow = 0;
            }
            this.drawText();
        }
        if (this._actions[this._history][this._currentAction].links) {
            this._currentLinks = this._actions[this._history][this._currentAction].links;
            this.drawLinks();
        }

        this.addNextAction();
    },

    addMusic: function(alias) {

        this._musicElements[alias] = document.createElement('audio');
        this._musicElements[alias].setAttribute('src', this._musicPath + alias + this._musicExt);
        this._musicElements[alias].load();
        this._musicElements[alias].loop = 1000;
        //@todo fix loop in FF
    },
    addSound: function(alias) {
        this._musicElements[alias] = document.createElement('audio');
        this._musicElements[alias].setAttribute('src', this._musicPath + alias/* + this._musicExt*/);
        this._musicElements[alias].load();
    },

    stopMusic: function() {
        if (this._currentMusic) {
            this._musicElements[this._currentMusic].pause();
            this._musicElements[this._currentMusic].volume = 0;
        }
    },

    playMusic: function() {
        if (this._currentMusic) {
            this._musicElements[this._currentMusic].play();
            this._musicElements[this._currentMusic].volume = this._musicVolume;
        }
    },
    playSound: function() {
        if (this._currentSound) {
            this._musicElements[this._currentSound].play();
            this._musicElements[this._currentSound].volume = this._musicVolume;
        }
    },

    setMusicVolume: function(volume) {
        this._musicVolume = volume;
        if (this._currentMusic) {
            this._musicElements[this._currentMusic].volume = this._musicVolume;
        }
    },

    addVoice: function(alias) {
        this._voiceElements[alias] = document.createElement('audio');
        this._voiceElements[alias].setAttribute('src', this._voicePath + alias/* + this._voiceExt*/);
        this._voiceElements[alias].load();
    },

    stopVoice: function() {
        if (this._currentVoice) {
            this._voiceElements[this._currentVoice].pause();
        }
    },

    playVoice: function(){
        if (this._currentVoice) {
            this._voiceElements[this._currentVoice].play();
            this._voiceElements[this._currentVoice].volume = this._voiceVolume;
        }
    },

    setVoiceVolume: function(volume){
        this._voiceVolume = volume;
        if (this._currentVoice) {
            this._voiceElements[this._currentVoice].volume = this._voiceVolume;
        }

    },

    addNextAction: function() {
        this._currentAction++;
        var tempAction = this._currentAction + 20;
        if (!this._actions[this._history][tempAction]) {
            return this;
        }

        if (this._actions[this._history][tempAction].music && this._actions[this._history][tempAction].music.length > 1) {
            this.addMusic(this._actions[this._history][tempAction].music);
        }
        if (this._actions[this._history][tempAction].sound && this._actions[this._history][tempAction].sound.length > 1) {
            this.addSound(this._actions[this._history][tempAction].sound);
        }
        if (this._actions[this._history][tempAction].voice && this._actions[this._history][tempAction].voice.length > 1) {
            this.addVoice(this._actions[this._history][tempAction].voice);
        }
        if (this._actions[this._history][tempAction].bg && this._actions[this._history][tempAction].bg.length > 1) {
            this.addBgImage(this._actions[this._history][tempAction].bg);
        }
        if (this._actions[this._history][tempAction].bgcolor && this._actions[this._history][tempAction].bgcolor.length > 1) {
            this.addBgColor(this._actions[this._history][tempAction].bgcolor);
        }
        if (this._actions[this._history][tempAction].sprites) {
            var sprites = JSON.parse(this._actions[this._history][tempAction].sprites);
            for (var sprite in sprites) {
                this.addSpriteImage(sprites[sprite].img);
                this._actions[this._history][tempAction].sprites = sprites;
            }
        }
    },

    addActions: function() {
        var actions = this._actions[this._history];
        var tempAction = this._currentAction;
        while (tempAction) {
            if(!actions[tempAction]) {
                break;
            }

            if (actions[tempAction].music && actions[tempAction].music.length > 1) {
                this.addMusic(actions[tempAction].music);
            }
            if (actions[tempAction].sound && actions[tempAction].sound.length > 1) {
                this.addSound(actions[tempAction].sound);
            }
            if (actions[tempAction].voice && actions[tempAction].voice.length > 1) {
                this.addVoice(actions[tempAction].voice);
            }
            if (actions[tempAction].bg && actions[tempAction].bg.length > 1) {
                this.addBgImage(actions[tempAction].bg);
            }
            if (actions[tempAction].bgcolor && actions[tempAction].bgcolor.length > 1) {
                this.addBgColor(actions[tempAction].bgcolor);
            }
            if (actions[tempAction].sprites) {
                var sprites = JSON.parse(actions[tempAction].sprites);
                for (var sprite in sprites) {
                    if (sprites[sprite].img) {
                        this.addSpriteImage(sprites[sprite].img);
                    }
                    actions[tempAction].sprites = sprites;
                }
            }

            tempAction++;
            if (tempAction > (20 + this._currentAction)) {
                break;
            }
        }
    },

    addBgImage: function(alias) {
        this._imageElements[alias] = document.createElement('img');
        this._imageElements[alias].loaded = false;
        /*this._imageElements[alias].onload = function () {
            this.loaded = true;
        };*/
        this._imageElements[alias].addEventListener('load', function () {
                    this.loaded = true;
                });
        this._imageElements[alias].src = this._imagePath + alias;
    },

    addSpriteImage: function(alias) {
        this._imageElements[alias] = new Image();
        this._imageElements[alias].src = this._imagePath + alias;// + this._spriteExt;
    },

    addBgColor: function(color) {
        this._bgcolor = color;
    },

    drawBg: function() {
        this.clearSprite();
        this._currentSprites = null;//@todo mojet peredelat na odin canvas
        this._bgCtx.drawImage(this._imageElements[this._currentBg], 0, 0);
    },

    drawBgColor: function() {
        this.clearSprite();
        this._bgCtx.fillStyle = this._bgcolor;
        this._bgCtx.fillRect(0, 0, this._widthScreen, this._heightScreen);
    },

    drawLoadingScreen: function() {
        this.drawBgColor();
        this.clearText();
        this._textRow = 0;
        this._interline = this.getFontHeight(this._textCtx.font);
        this._textCtx.fillStyle = 'rgba(255, 255, 255, 1)';
        this._textCtx.font = "italic 10pt Calibri ";//"italic 18pt Arial ";
        this.drawTextString('Novel Engine', 'top', 'left');

        this._textCtx.font = "30pt Calibri ";//"italic 18pt Arial ";
        this._interline = this.getFontHeight(this._textCtx.font);
        this._textRow = 0;
        this.drawTextString('Loading ...', 'center', 'center');
        this._interline = 28;
    },

    drawFirstScreen: function() {
        if (!this._bgCtx || !this._textCtx || !this._spriteCtx) {
            this.init();
        }
        this.drawBgColor();
        this._textCtx.fillStyle = 'rgba(255, 255, 255, 1)';
        this._textCtx.font = "30pt Calibri";//Arial || Calibri
        this._textRow = 0;
        this._interline = this.getFontHeight(this._textCtx.font);
        this.drawTextString('Novel Engine', 'center', 'center');

        this._textCtx.font = "italic 11pt Calibri ";
        this._textRow = 0;
        this._interline = this.getFontHeight(this._textCtx.font);
        this.drawTextString('Все права защищены и принадлежат их владельцам. Распространение и незаконное копирование исходников карается кармой! \n\r ', 520, 'right');
        this.drawTextString('Developed by Naxel 2012', 520, 'center');
        this._interline = 28;
    },

    drawTextString: function(string, top, align) {

        if (top == 'center') {
            top = this._heightScreen / 2 - this._interline / 2;
        } else if(top == 'bottom') {
            top = this._heightScreen - this._interline;
        } else if(top == 'top') {
            top = 0;
        }
        var left = this._leftMargin;
        var textMaxWidth = this._widthScreen - this._leftMarginDefault * 2;
        var tempString = '';
        var newTextArray = [];
        var i = 0;
        var tempStrArray = [];
        var length = 0;
            var textArray = string.split(' ');
            for (var text in textArray) {
                tempStrArray = textArray[text].split('\n', 2);
                //if new string
                if (tempStrArray[1]) {
                    if (this._textCtx.measureText(tempString + tempStrArray[0]).width > textMaxWidth) {
                        newTextArray.push(tempString);
                        tempString = '';
                        text--;
                    } else {
                        newTextArray.push(tempString + tempStrArray[0]);
                        if (tempString.length > 0) {
                            tempString += ' ';
                        }
                        tempString = tempStrArray[1];
                    }
                //if some string
                } else {
                    if (this._textCtx.measureText(tempString + textArray[text] + ' ').width > textMaxWidth) {
                        newTextArray.push(tempString);
                        tempString = '';
                    }
                    if (tempString.length > 0) {
                        tempString += ' ';
                    }
                    tempString += textArray[text];
                }
            }
            newTextArray.push(tempString);
            var newTextArrayEls = newTextArray.length;
            var newText = 0;

            while (newText < newTextArrayEls) {
                length = newTextArray[newText].length;
                var tempText = '';
                while (i < length) {
                    tempText += newTextArray[newText][i];
                    i++;
                }
                newText++;
                i = 0;
                if (align == 'center') {
                    left = this._widthScreen / 2 - this._textCtx.measureText(tempText).width / 2;
                } else if(align == 'right') {
                    left = this._widthScreen - this._textCtx.measureText(tempText).width - this._leftMarginDefault;
                }
                this._textCtx.fillText(tempText, left, (top + this._interline + (this._interline * this._textRow)));
                this._textRow++;
            }
    },

    drawSprites: function() {
        this.clearSprite();
        for (var sprite in this._currentSprites) {
            /*if (this._currentSprites[sprite].clear) {
                this.clearSprite();
            } else {*/
                var dx, dy;
                if (this._currentSprites[sprite].pos == 'center') {
                    dx = this._imageElements[this._currentSprites[sprite].img].width;
                    dy = this._imageElements[this._currentSprites[sprite].img].height;
                    this._spriteCtx.drawImage(this._imageElements[this._currentSprites[sprite].img], (this._widthScreen/2 - dx/2), this._heightScreen - dy);
                } else if (this._currentSprites[sprite].pos == 'right') {
                    dx = this._imageElements[this._currentSprites[sprite].img].width;
                    dy = this._imageElements[this._currentSprites[sprite].img].height;
                    this._spriteCtx.drawImage(this._imageElements[this._currentSprites[sprite].img], this._widthScreen - dx, this._heightScreen - dy);
                } else if (this._currentSprites[sprite].pos == 'left')  {
                    dy = this._imageElements[this._currentSprites[sprite].img].height;
                    this._spriteCtx.drawImage(this._imageElements[this._currentSprites[sprite].img], 0, this._heightScreen - dy);
                }
           // }
        }
    },

    clearText: function() {
        this._textCtx.clearRect(0, 0, this._widthScreen, this._heightScreen);
    },

    clearSprite: function() {
        this._spriteCtx.clearRect(0, 0, this._widthScreen, this._heightScreen);
    },

    drawText: function() {

        this._drawText = true;
        this._stop = true;
        var otstup = 28;

        if (this._textRow == 0) {
            var data = this._textCtx.getImageData(0 ,0, this._widthScreen, this._heightScreen);
            if (data) {

                this._historyCtx.putImageData(data, 0, 0);
            }

            this._textCtx.clearRect(0, 0, this._widthScreen, this._heightScreen);

            this._textCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this._textCtx.fillRect(20, 20, this._widthScreen-40, this._heightScreen-40);
        }


        this._textCtx.fillStyle = 'rgba(255, 255, 255, 1)';
        this._textCtx.font = "14pt Arial ";//"italic 18pt Arial ";
        //console.log(this._textCtx.measureText(this._currentText).width);
        var textMaxWidth = 720;
        var textFullWidth = this._textCtx.measureText(this._currentText).width;
        var string = '';
        var newTextArray = [];
        var i = 0;
        var length = 0;
        if (textFullWidth > textMaxWidth) {
            var textArray = this._currentText.split(' ');
            for (var text in textArray) {
                if (this._textCtx.measureText(string + textArray[text] + ' ').width > textMaxWidth) {
                    newTextArray.push(string);
                    string = '';
                }
                string += textArray[text] + ' ';
            }
            newTextArray.push(string);

            var newTextArrayEls = newTextArray.length;
            var newText = 0;

            this._leftMargin = this._leftMarginDefault;
            //this._textCtx.fillText(newTextArray[newText], 40, (40 + (otstup * this._textRow)));
            this._drawTextInterval = setInterval(function() {
                //console.log(length, i);
                length = newTextArray[newText].length;
                if (!novelEngine._drawText) {

                    while (newText < newTextArrayEls) {
                        length = newTextArray[newText].length;
                        var tempText = '';
                        while (i < length) {
                            tempText += newTextArray[newText][i];
                            i++;

                        }
                        newText++;
                        i = 0;
                        novelEngine._textCtx.fillText(tempText, novelEngine._leftMargin, (40 + (otstup * novelEngine._textRow)));
                        novelEngine._textRow++;
                        novelEngine._leftMargin = novelEngine._leftMarginDefault;
                    }
                    clearInterval(novelEngine._drawTextInterval);
                    novelEngine._stop = false;
                    novelEngine._drawText = false;

                    if (novelEngine._autoPlay) {
                        novelEngine.next();
                    }


                } else {
                    if (i < length) {
                         novelEngine._textCtx.fillText(newTextArray[newText][i], novelEngine._leftMargin, (40 + (otstup * novelEngine._textRow)));
                         novelEngine._leftMargin += novelEngine._textCtx.measureText(newTextArray[newText][i]).width;
                         i++;
                    } else {
                         newText++;
                         novelEngine._textRow++;
                         i = 0;

                         if (newText >= newTextArrayEls) {
                             clearInterval(novelEngine._drawTextInterval);
                             novelEngine._stop = false;
                             novelEngine._drawText = false;
                             if (novelEngine._autoPlay) {
                                 novelEngine.next();
                             }
                         }

                         novelEngine._leftMargin = novelEngine._leftMarginDefault;
                    }
                }
            }, this.textSpeed);

        } else {
            length = this._currentText.length;
            this._leftMargin = this._leftMarginDefault;
            this._drawTextInterval = setInterval(function() {
                if (!novelEngine._drawText) {
                    var tempText = '';
                    while (i < length) {
                        tempText += novelEngine._currentText[i];
                        i++;
                    }
                    novelEngine._textCtx.fillText(tempText, novelEngine._leftMargin, (40 + (otstup * novelEngine._textRow)));
                }
                if (i < length) {
                    novelEngine._textCtx.fillText(novelEngine._currentText[i], novelEngine._leftMargin, (40 + (otstup * novelEngine._textRow)));
                    novelEngine._leftMargin += novelEngine._textCtx.measureText(novelEngine._currentText[i]).width;
                    i++;
                } else {
                    novelEngine._textRow++;
                    clearInterval(novelEngine._drawTextInterval);
                    novelEngine._leftMargin = novelEngine._leftMarginDefault;
                    novelEngine._stop = false;
                    novelEngine._drawText = false;
                    if (novelEngine._autoPlay) {
                        novelEngine.next();
                    }
                }
            }, this.textSpeed);
        }


    },

    historyText: function() {
        this._historyCanvas.style.display = 'block';
        this._textCanvas.style.display = 'none';
        this._stop = true;
        this._historyView = true;
    },

    drawLinks: function() {
        //Example
        //[{"history": 1,"text": "left", "key":"n1"},{"history": 2,"text": "right", "key":"n2"}]

        var linksCanvas = document.createElement('canvas');
        linksCanvas.height = this._heightScreen;
        linksCanvas.width = this._widthScreen;
        //linksCanvas.style.display = 'none';
        document.getElementById('canvas').appendChild(linksCanvas);

        var otstup = 40;
        //console.log(this._currentLinks);
        var links = JSON.parse(this._currentLinks);
        //@todo create listen mouse
        novelEngine._textRow += 2;
        var row = 0;
        for (var link in links) {
            //novelEngine._textCtx.fillText(links[link].text, 40, (40 + (otstup * novelEngine._textRow)));
            row = novelEngine._textRow;
            var ctx = function(row, text) {
                var context = this;
                context.beginPath();
                context.fillStyle = "#ff0000";
                context.rect(40, (40 + (otstup * row)) - extensions.getFontHeight(novelEngine._textCtx.font), novelEngine._textCtx.measureText(text).width, extensions.getFontHeight(novelEngine._textCtx.font));
                context.fillText(text, 40, (40 + (otstup * row)));
                context.closePath();
            };
            var ctxH = function(row, text) {
                var context = this;
                context.beginPath();
                context.fillStyle = "#00ff00";
                context.rect(40, (40 + (otstup * row)) - extensions.getFontHeight(novelEngine._textCtx.font), novelEngine._textCtx.measureText(text).width, extensions.getFontHeight(novelEngine._textCtx.font));
                context.fillText(text, 40, (40 + (otstup * row)));
                context.closePath();
            };
            ctx.call(novelEngine._textCtx, row, links[link].text);
            this.listenMouse(linksCanvas, ctx, ctxH, links[link].text, links[link].history,  row);
            novelEngine._textRow++;
        }
        this._stop = true;
        this.listenKeyboard(true, links);


    },

    listenMouse: function(linksCanvas, ctx, ctxH, text, history, row) {

        var canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.height = 600;
        canvas.width = 800;
        var context = canvas.getContext('2d');

        ctx.call(context, row, text);
        //hover
        linksCanvas.addEventListener('mousemove', function(evt) {
            var mousePos = mousetron.getMousePos(novelEngine._textCanvas, evt);
            if (context.isPointInPath(mousePos.x , mousePos.y)) {
                ctxH.call(novelEngine._textCtx, row, text);
            } else {
                ctx.call(novelEngine._textCtx, row, text);
            }
        }, false);
        //click
        linksCanvas.addEventListener('click', function(evt) {
            var mousePos = mousetron.getMousePos(novelEngine._textCanvas, evt);
            if (context.isPointInPath(mousePos.x , mousePos.y)) {
                document.getElementById('canvas').removeChild(linksCanvas);
                novelEngine.listenKeyboard(false);
                novelEngine._stop = false;
                novelEngine._history = history;
                novelEngine._currentAction = 1;
                novelEngine.start();
            }
        }, false);
    },

    getFontHeight: function(fontStyle) {

        var dummy = document.createElement("div");
        var dummyText = document.createTextNode("M");
        dummy.appendChild(dummyText);
        dummy.setAttribute("style", 'font:' + fontStyle);
        document.body.appendChild(dummy);
        var result = dummy.offsetHeight;
        document.body.removeChild(dummy);
        return result;
    },

    listenKeyboard: function(otherKey, params) {

        document.onkeydown = function(e) {
            var keycode;
            if (window.event) {
                keycode = window.event.keyCode;
                e = window.event;
            } else if (e) {
                keycode = e.which;
            }
            if (otherKey) {
                for (var param in params) {
                    if (params[param].key && novelEngine.getKey(params[param].key) == keycode) {
                        novelEngine.listenKeyboard(false);
                        novelEngine._stop = false;
                        novelEngine._history = params[param].history;
                        novelEngine._currentAction = 1;
                        novelEngine.start();
                    }
                }
            } else {
                if (novelEngine.getKey('space') == keycode
                    || novelEngine.getKey('aright')  == keycode
                    || novelEngine.getKey('adown') == keycode ) {


                        novelEngine.next();


                }
                if (novelEngine.getKey('aleft') == keycode || novelEngine.getKey('aup')  == keycode) {
                    novelEngine.historyText();
                }
            }
        }

    },
    
    getKey: function(code){
        var keyCodes = {
        			// Alphabet
        			a:65, b:66, c:67, d:68, e:69,
        			f:70, g:71, h:72, i:73, j:74,
        			k:75, l:76, m:77, n:78, o:79,
        			p:80, q:81, r:82, s:83, t:84,
        			u:85, v:86, w:87, x:88, y:89, z:90,
        			// Numbers
        			n0:48, n1:49, n2:50, n3:51, n4:52,
        			n5:53, n6:54, n7:55, n8:56, n9:57,
        			// Controls
        			tab:  9, enter:13, shift:16, backspace:8,
        			ctrl:17, alt  :18, esc  :27, space    :32,
        			menu:93, pause:19, cmd  :91,
        			insert  :45, home:36, pageup  :33,
        			'delete':46, end :35, pagedown:34,
        			// F*
        			f1:112, f2:113, f3:114, f4 :115, f5 :116, f6 :117,
        			f7:118, f8:119, f9:120, f10:121, f11:122, f12:123,
        			// numpad
        			np0: 96, np1: 97, np2: 98, np3: 99, np4:100,
        			np5:101, np6:102, np7:103, np8:104, np9:105,
        			npslash:11,npstar:106,nphyphen:109,npplus:107,npdot:110,
        			// Lock
        			capslock:20, numlock:144, scrolllock:145,
        			// Symbols
        			equals: 61, hyphen   :109, coma  :188, dot:190,
        			gravis:192, backslash:220, sbopen:219, sbclose:221,
        			slash :191, semicolon: 59, apostrophe: 222,
        			// Arrows
        			aleft:37, aup:38, aright:39, adown:40
        };

        return keyCodes[code];
    },

    saveGame: function(slot) {
        storage.storageName = this._novelName + '_game';
        var strg = storage.getStorageData();
        if (!strg) {
            storage.setDefaultStorageData();
            strg = storage.getStorageData();
        }
        var action = this._currentAction;
        if (action < 0) {
            action = 0;
        }
        strg[slot] = {
                    history: this._history,
                    action: action
                };
        storage.setStorageData(strg);

    },
    loadGame: function(slot) {

        storage.storageName = this._novelName + '_game';
        var strg = storage.getStorageData();
        if (strg[slot].action) {
            this.destroyGame();
            this._history = strg[slot].history;
            this._currentAction = strg[slot].action;

            this.start();
        }
    },
    newGame: function() {
        this.destroyGame();
        this.start();
    },
    destroyGame: function(defoult) {
        clearInterval(this._drawTextInterval);
        this.stopMusic();
        this.clearSprite();
        this.clearText();
        this._stop = false;

        this._leftMargin = 40;
        this._interline = 28;
        this._leftMarginDefault = 40;
        this.textSpeed = 40;
        this._bgcolor = '#000000';
        this._textRow = 0;

        this._actions = null;
        this._imageElements = {};
        this._currentBg = null;
        this._currentSprites = null;
        this._voiceElements ={};
        this._currentVoice =null;
        this._musicElements = {};
        this._currentMusic = null;
        this._currentSound = null;
        this._currentLinks = null;
        if (!defoult) {
            this._currentAction = 1;
            this._history = 0;
        }
        this.drawFirstScreen();

    }

});


var storage = ({
	storageName: 'game',
	defaultData: [
            {
                history: 0,
                action: 0
            },
            {
                history: 0,
                action: 0
            },
            {
                history: 0,
                action: 0
            }
        ],
	getStorageData: function () {
		var storage = window.localStorage.getItem(this.storageName);
		if (storage) {
	        return JSON.parse(storage);
	    } else {
	    	return false;
	    }
	},
	setStorageData: function (data) {
		window.localStorage.setItem(this.storageName, JSON.stringify(data));
	},
	setDefaultStorageData: function () {
		this.setStorageData(this.defaultData);
	},
	removeStorageData: function () {
		window.localStorage.removeItem(this.storageName);
	}

});

var shape = ({

    canvas: null,

    hoverCount: 0,
    shapes: {},

    init: function() {
        this.createCanvas();

        var context = this.create('context', function() {
                var context = this;
                context.beginPath(); // begin custom shape
                context.moveTo(170, 80);
                context.bezierCurveTo(130, 100, 130, 150, 230, 150);
                context.bezierCurveTo(250, 180, 320, 180, 340, 150);
                context.bezierCurveTo(420, 150, 420, 120, 390, 100);
                context.bezierCurveTo(430, 40, 370, 30, 340, 50);
                context.bezierCurveTo(320, 5, 250, 20, 250, 50);
                context.bezierCurveTo(200, 5, 150, 20, 170, 80);
                //context.closePath(); // complete custom shape
                context.lineWidth = 5;
                context.fillStyle = "#8ED6FF";
                context.fill();
                context.strokeStyle = "#0000ff";
                context.stroke();

                context.font = '40pt Arial';
                // draw invisible detectable path for text
                //context.beginPath();
                context.rect(200, 200 - extensions.getFontHeight(context.font), context.measureText('Hello!-------------------').width, extensions.getFontHeight(context.font));
                context.fillText('Hello!-------------------', 200, 200);
                context.closePath();
            //shape.canvas.style.cursor = 'default';
            shape.hoverCount--;

        }).listen('context', 'click', function(){alert('context')}).draw('context').hover('context', function() {
                        //alert('context2');
        
                        var context = this;
                context.beginPath(); // begin custom shape
                context.moveTo(170, 80);
                context.bezierCurveTo(130, 100, 130, 150, 230, 150);
                context.bezierCurveTo(250, 180, 320, 180, 340, 150);
                context.bezierCurveTo(420, 150, 420, 120, 390, 100);
                context.bezierCurveTo(430, 40, 370, 30, 340, 50);
                context.bezierCurveTo(320, 5, 250, 20, 250, 50);
                context.bezierCurveTo(200, 5, 150, 20, 170, 80);
                //context.closePath(); // complete custom shape
                context.lineWidth = 5;
                context.fillStyle = "#8ED6FF";
                context.fill();
                context.strokeStyle = "#00ff00";
                context.stroke();

                context.font = '40pt Arial';
                // draw invisible detectable path for text
                //context.beginPath();
                context.rect(200, 200 - extensions.getFontHeight(context.font), context.measureText('Hello!-------------------').width, extensions.getFontHeight(context.font));
                context.fillText('Hello!-------------------', 200, 200);
                context.closePath();
                //shape.canvas.style.cursor = 'pointer';
                shape.hoverCount++;
                    });
        

        var context2 = this.create('context2', function() {
                this.beginPath();
                this.lineWidth = 3;
                this.strokeStyle = "#00ff00";
                this.fillStyle = "#FF3366";
                this.moveTo(200, 200);
                this.lineTo(300, 100);
                this.lineTo(300, 200);
                this.closePath();
                this.fill();
                this.stroke();
            shape.hoverCount--;
            //shape.canvas.style.cursor = 'default';
            }).listen('context2', 'click', function() {
                alert('context2');
            }).draw('context2').hover('context2', function() {
                //alert('context2');
                //shape.canvas.style.cursor = 'pointer';
                var context = this;
                context.beginPath();
                context.lineWidth = 3;
                context.strokeStyle = "#0000FF";
                context.fillStyle = "#FF3366";
                context.moveTo(200, 200);
                context.lineTo(300, 100);
                context.lineTo(300, 200);
                context.closePath();
                context.fill();
                context.stroke();
                shape.hoverCount++;
            });


        this.listener();

    },

    createCanvas: function() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.height = 600;
        this.canvas.width = 800;
        document.getElementById('canvas').appendChild(this.canvas);
    },
    getContext: function(type) {

        if (type) {
            return this.getContext(type);
        }
        return this.canvas.getContext('2d');
    },

    create: function(alias, ctx) {
        this.shapes[alias] = {
            context: ctx
        };
        return this;
    },

    listen: function(alias, list, handler) {

        if (this.shapes[alias]) {
            var canvas = document.createElement('canvas');
            canvas.style.position = 'absolute';
            canvas.height = 600;
            canvas.width = 800;
            var context = canvas.getContext('2d');
            var that = this;
            //console.log(alias, this.shapes);
            this.shapes[alias].context.call(context);

            this.canvas.addEventListener(list, function(evt) {
                //console.log(list);
                var mousePos = mousetron.getMousePos(that.canvas, evt);
                //console.log(that.shapeIndex);
                if (context.isPointInPath(mousePos.x , mousePos.y)) {
                    //console.log("Mouse position: " + mousePos.x + "," + mousePos.y);
                    handler.call(that);
                }
            }, false);
        } else {
            alert('Incorrect alias');
        }
        return this;
    },
    listener: function(){
        this.canvas.addEventListener('mousemove', function(evt) {
            var counter = 0;
            for (var alias in shape.shapes) {
                shape.shapes[alias].listen(evt);
                if(shape.shapes[alias].on){
                    counter++;
                }

            }

            if (counter > 0) {
                shape.isHover = true;
                shape.canvas.style.cursor = 'pointer';
            } else {
                shape.isHover = false;
                shape.canvas.style.cursor = 'default';
            }
        }, false);
    },

    hover: function(alias, ctx) {
        if (this.shapes[alias]) {

            var list = function(evt) {

                shape.shapes[alias].hover = ctx;
                var canvas = document.createElement('canvas');
                canvas.style.position = 'absolute';
                canvas.height = 600;
                canvas.width = 800;
                var context = canvas.getContext('2d');

                //console.log(alias, shape.shapes, shape.shapes[alias]);
                shape.shapes[alias].context.call(context);
                var mousePos = mousetron.getMousePos(shape.canvas, evt);
                if (context.isPointInPath(mousePos.x , mousePos.y)) {
                    //console.log("Mouse position: " + mousePos.x + "," + mousePos.y);
                    shape.shapes[alias].hover.call(shape.getContext());
                    shape.shapes[alias].on = true;
                } else {
                    shape.shapes[alias].context.call(shape.getContext());
                    shape.shapes[alias].on = false;
                }
            };

            this.shapes[alias].listen = list;
        } else {
            alert('Incorrect alias');
        }
        return this;
    },
    draw: function(alias) {
        if (this.shapes[alias]) {
            this.shapes[alias]['context'].call(this.getContext());
        } else {
            alert('Incorrect alias');
        }
        return this;
    }

});

var extensions = ({
    getFontHeight: function(fontStyle) {

        var dummy = document.createElement("div");
        var dummyText = document.createTextNode("M");
        dummy.appendChild(dummyText);
        dummy.setAttribute("style", 'font:' + fontStyle);
        document.body.appendChild(dummy);
        var result = dummy.offsetHeight;
        document.body.removeChild(dummy);
        return result;
    }
});

var mousetron = ({
    getMousePos : function(canvas, evt){
        // get canvas position
        var obj = canvas;
        var top = 0;
        var left = 0;
        while (obj && obj.tagName != 'BODY') {
            top += obj.offsetTop;
            left += obj.offsetLeft;
            obj = obj.offsetParent;
        }

        // return relative mouse position
        var mouseX = evt.clientX - left + window.pageXOffset;
        var mouseY = evt.clientY - top + window.pageYOffset;
        return {
            x: mouseX,
            y: mouseY
        };
    }
});