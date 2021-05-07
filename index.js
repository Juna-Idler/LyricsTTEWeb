
(function LrCDownload(){
    document.getElementById('Download').addEventListener('click', (e)=>{
        e.preventDefault();
        const text = document.getElementById('TextArea').value;
        const blob = new Blob([text], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);

        const now = new Date();
        const y = now.getFullYear();
        const m = ('00' + (now.getMonth()+1)).slice(-2);
        const d = ('00' + now.getDate()).slice(-2);
        const h = ('00' + now.getHours()).slice(-2);
        const mi = ('00' + (now.getMinutes()+1)).slice(-2);

        if (audioFilename !== "")
        {
            const period = audioFilename.lastIndexOf(".");
            if (period <= 0)
                a.download = audioFilename + ".lrc";
            else
                a.download = audioFilename.substring(0,period) + ".lrc";
        }
        else
            y + "-" + m + d + "-" + h + mi + '.lrc';
        a.href = url;

//    if (window.confirm('Download:"' + a.download + '"' ))
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });
}());



const audio = document.getElementById("AudioPlayer");
const canvas = document.getElementById( 'WaveCanvas' );
const textarea = document.getElementById('TextArea');
const magnification_selector = document.getElementById('MagnificationSelector');
const playbackRate = document.getElementById('PlaybackRate');


var audioFilename = "";

var waveViewer;
var Magnification = Number(magnification_selector.value);
var WaveViewTime = 0;
var TuneModeDraw = null;

var fragmentPlayer = null;

var EditModeInitializer;
var StampModeInitializer;
var TuneModeInitializer;
var TestModeInitializer;

function DrawWaveView()
{
    if (!waveViewer)
        return;

    if (TuneModeDraw)
    {
        TuneModeDraw();
        return;
    }

    const width  = canvas.width;
    const height = canvas.height;
    const nowpoint = Math.floor(width * 0.3)
    waveViewer.DrawCanvas(canvas,WaveViewTime - (nowpoint * 1000/Magnification),1000/Magnification);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(nowpoint,0,1,height);
}



(function AudioEvent(){

    function Tick(timestamp)
    {
        WaveViewTime = audio.currentTime * 1000;
        DrawWaveView();
        if (!audio.paused)
            window.requestAnimationFrame(Tick);
    }
    audio.addEventListener("timeupdate",()=>{
        if (TuneModeDraw == null)
            WaveViewTime = audio.currentTime * 1000;
        DrawWaveView();
    });
    audio.addEventListener("play",()=>{
        if (TuneModeDraw == null)
            window.requestAnimationFrame(Tick);
    });
    audio.addEventListener("pause", ()=>{
    });
    audio.addEventListener("ended",()=>{
    });


    magnification_selector.oninput = (e)=>{
        Magnification = Number(magnification_selector.value);
        DrawWaveView();
    };

    playbackRate.oninput = (e)=>{
        audio.playbackRate = playbackRate.value;
        const text = document.getElementById('PlaybackRateText');
        text.textContent = "再生速度 ×" + (audio.playbackRate).toFixed(2);
    }

}());


/*
*/

var SetDefaultCanvaMouseEvent;
(function WaveViewerMouseEvent(){
    var x;
    var playing;
    canvas.ondragstart = (e)=>{return false;}

    function onMouseMove(e) {
        WaveViewTime -=  (e.pageX - x) * (1000 / Magnification);
        if (WaveViewTime < 0)
            WaveViewTime = 0;
        x = e.pageX;
        DrawWaveView();
    }
    function onMouseUp(e){
        audio.currentTime = WaveViewTime / 1000;
        if (playing)
            audio.play();
        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('mouseup', onMouseUp, false);
    }   
    
    function onMouseDown(e){
        playing = !audio.paused;
        audio.pause();
        x = e.pageX;
        document.addEventListener("mousemove",onMouseMove, false);
        document.addEventListener("mouseup",onMouseUp, false);
    }

    SetDefaultCanvaMouseEvent = (enable)=>{
        if (enable)
        {
            canvas.addEventListener("mousedown",onMouseDown, false);
        }
        else
        {
            canvas.removeEventListener("mousedown",onMouseDown,false);
        }

    };
    SetDefaultCanvaMouseEvent(true);

}());

(function CanvasResize(){
    const container = document.getElementById( 'WaveDisplay' );
    var queue = null;
    const wait = 300;

    //これがない（＝CSS指定のresizeで一度リサイズしない）と、何故かwindowのリサイズの度に7pxずつ増えていく
    container.style.height = container.offsetHeight + "px";

    setCanvasSize();

    window.addEventListener( 'resize', function() {
        clearTimeout( queue );
        queue = setTimeout(function() {setCanvasSize();}, wait );
    }, false );

    const observer = new MutationObserver(() => {
        clearTimeout( queue );
        queue = setTimeout(function() {
            setCanvasSize();
        }, wait );
    });
    observer.observe(container, {
        attriblutes: true,
        attributeFilter: ["style"]
    });
    // Canvasサイズをコンテナの100%に 
    function setCanvasSize() {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0,0,canvas.width,canvas.height);

        if (waveViewer)
            waveViewer.DrawCanvas(canvas,audio.currentTime*1000,1000/500);

    }
}());


(function ModeShifter(){

    const tab_edit = document.getElementById("TabEdit");
    const tab_stamp = document.getElementById("TabStamp");
    const tab_tune = document.getElementById("TabTune");
    const tab_test = document.getElementById("TabTest");

    var LastMode = "edit";

    function TabChange(e)
    {
        switch (LastMode)
        {
            case "edit":
                if (tab_edit.checked) return;
                EditModeInitializer.Terminalize();
            break;
            case "stamp":
                if (tab_stamp.checked) return;
                StampModeInitializer.Terminalize();
            break;
            case "tune":
                if (tab_tune.checked) return;
                TuneModeInitializer.Terminalize();
            break;
            case "test":
                if (tab_test.checked) return;
                TestModeInitializer.Terminalize();
            break;        }
        if (document.getElementById("AutoSave").checked)
        {
            localStorage.setItem("autosave_lyrics",textarea.value);
            localStorage.setItem("autosave_enable","true");
        }
        else
        {
            localStorage.removeItem("autosave_enable");
            const aslyrics = localStorage.getItem("autosave_lyrics");
            if (aslyrics !== null && aslyrics === "")
                localStorage.removeItem("autosave_lyrics");
        }

        if (tab_edit.checked)
        {
            EditModeInitializer.Initialize();
            LastMode = "edit";
        }
        else if (tab_stamp.checked)
        {
            StampModeInitializer.Initialize();
            LastMode = "stamp";
        }
        else if (tab_tune.checked)
        {
            TuneModeInitializer.Initialize();
            LastMode = "tune";
        }
        else if (tab_test.checked)
        {
            TestModeInitializer.Initialize();
            LastMode = "test";
        }
    }
    const aslyrics = localStorage.getItem("autosave_lyrics");
    textarea.value = aslyrics === null ? "" : aslyrics;
    if (localStorage.getItem("autosave_enable"))
        document.getElementById("AutoSave").checked = true;

    tab_edit.addEventListener("change",TabChange);
    tab_stamp.addEventListener("change",TabChange);
    tab_tune.addEventListener("change",TabChange);
    tab_test.addEventListener("change",TabChange);

}());


(function TagStamper(){

    const list = document.getElementById('StamperList');

    function keydown(e)
    {
        e.preventDefault();

        const input = list.querySelector("input:checked");
        const label = input ? input.parentElement : null;
        const item = label ? label.parentElement : null;

        switch (e.code)
        {
            case "KeyA":case "ArrowLeft":
                if (item)
                {
                    let i = item
                    while (i.previousElementSibling)
                    {
                        i = i.previousElementSibling;
                        const time = i.querySelector("label").dataset.starttime;
                        if (time >= 0)
                        {
                            audio.currentTime = time / 1000;
                            i.querySelector("input").checked = true;
                            i.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"})
                            break;
                        }
                    }
                }
            break;
            case "KeyD":case "ArrowRight":
                if (item)
                {
                    let i = item
                    while (i.nextElementSibling)
                    {
                        i = i.nextElementSibling;
                        const time = i.querySelector("label").dataset.starttime;
                        if (time >= 0)
                        {
                            audio.currentTime = time / 1000;
                            i.querySelector("input").checked = true;
                            i.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"})
                            break;
                        }
                    }
                }
            break;
            case "KeyW":case "ArrowUp":
                if (item && item.previousElementSibling)
                {
                    item.previousElementSibling.querySelector("input").checked = true;
                    item.previousElementSibling.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"})
                }
            break;
            case "KeyS":case "ArrowDown":
                if (item && item.nextElementSibling)
                {
                    item.nextElementSibling.querySelector("input").checked = true;
                    item.nextElementSibling.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"})
                }
            break;

            case "Space":
            case "Enter":
                if (item)
                {
                    label.dataset.starttime = audio.currentTime * 1000;
                    const time_span = item.querySelector(".list_time");
                    time_span.textContent = TimeTagElement.TimeString(audio.currentTime * 1000);

                    if (item.nextElementSibling)
                    {
                        item.nextElementSibling.querySelector("input").checked = true;
                        item.nextElementSibling.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"})
                    }
                }
            break;
            case "Delete":
                if (item)
                {
                    const time_span = item.querySelector(".list_time");
                    time_span.textContent = ""
                }
            break;
            
            case "KeyZ":
                audio.currentTime = (audio.currentTime - 1 < 0) ? 0 : audio.currentTime - 1;
            break;
            case "KeyX":
                if (audio.paused)
                    audio.play();
                else
                    audio.pause();
            break;
            case "KeyC":
                audio.currentTime = audio.currentTime + 1;
            break;
        }
    }

    function Initialize()
    {
        const TimeTagList = new LyricsContainer(textarea.value);
        selected = 0;

        TimeTagList.lines.forEach(line => {
            const li = document.createElement("li");

            const label = document.createElement("label");
            label.classList.add("list_label");
            label.textContent = "　";
            label.dataset.starttime = line.starttime;
            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "stamp_line";
            label.appendChild(radio);

            const starttime = document.createElement("span");
            starttime.textContent = TimeTagElement.TimeString(line.starttime);
            starttime.classList.add("list_time");

            const text = document.createElement("span");
            text.textContent = line.text;
            text.classList.add("list_text");

            label.appendChild(starttime);
            label.appendChild(text);
            li.appendChild(label);
            list.appendChild(li);
        });
        list.querySelector("input").checked = true;

        document.addEventListener("keydown",keydown,false);
    }

    function Terminalize()
    {
        let text = "";
        for (let i = 0; i < list.children.length;i++)
        {
            const item = list.children[i];
            const time_span = item.querySelector(".list_time");
            const text_span = item.querySelector(".list_text");
            text += time_span.textContent + text_span.textContent + "\n";
        }
        textarea.value = text.slice(0,-1);
        while (list.firstChild)
            list.firstChild.remove();
        document.removeEventListener("keydown",keydown,false);
    }

    StampModeInitializer = {Initialize:Initialize,Terminalize:Terminalize};

}());

(function TextEditor(){

    function Initialize()
    {
    }
    function Terminalize()
    {

    }
    EditModeInitializer = {Initialize:Initialize,Terminalize:Terminalize};
}());

(function TimeTuner(){

    const list = document.getElementById('TunerList');
    var currentListItem;
    function playFragment(startpoint_ms,duration_ms)
    {
        fragmentPlayer.playOnly(startpoint_ms / 1000,duration_ms / 1000);
    }
    function getNextTime(li_element)
    {
        let i = li_element;
        while (i.nextElementSibling)
        {
            i = i.nextElementSibling;
            const time = i.querySelector("label").dataset.starttime;
            if (time >= 0)
            {
                return time;
            }
        }
        return 99*6000+5999;
    }

    function keydown(e)
    {
        e.preventDefault();

        const item = currentListItem;
        const label = item.firstChild;

        switch (e.code)
        {
            case "KeyA":case "ArrowLeft":
                if (label)
                {
                    const time = label.dataset.starttime;
                    if (time < 0)
                        break;
                    let starttime = time - 1000;
                    let duration = 1000;
                    if (starttime < 0)
                    {
                        duration -= -starttime;
                        starttime = 0;
                    }
                    playFragment(starttime,duration);
                }
            break;
            case "KeyD":case "ArrowRight":
                if (label)
                {
                    const time = label.dataset.starttime;
                    if (time < 0)
                        break;
                    playFragment(time,1000);
                }
            break;
            case "KeyW":case "ArrowUp":
                if (item && item.previousElementSibling)
                {
                    const i = item.previousElementSibling;
                    currentListItem = i;
                    i.querySelector("input").checked = true;
                    i.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"})
                    const time = i.querySelector("label").dataset.starttime;
                    if (time >= 0)
                    {
                        WaveViewTime = time;
                    }
                    DrawWaveView();
                }
            break;
            case "KeyS":case "ArrowDown":
                if (item && item.nextElementSibling)
                {
                    const i = item.nextElementSibling;
                    currentListItem = i;
                    i.querySelector("input").checked = true;
                    i.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"})
                    const time = i.querySelector("label").dataset.starttime;
                    if (time >= 0)
                    {
                        WaveViewTime = time;
                    }
                    DrawWaveView();
                }
            break;

            case "Space":
            case "Enter":
                if (item)
                {
                    if (label.dataset.starttime >= 0)
                    {
                        const duration = getNextTime(item) - label.dataset.starttime;
                        WaveViewTime = label.dataset.starttime;
                        playFragment(WaveViewTime,duration);
                        DrawWaveView();
                    }
                }
            break;
            case "Delete":
                if (item)
                {
                }
            break;
            
            case "KeyZ":
            break;
            case "KeyX":
            break;
            case "KeyC":
            break;
        }
    }


    var x;
    var grap;
    function onDragMouseMove(e) {
        const move_x = (e.pageX - x);
        if (grap)
        {
            const label = currentListItem.firstChild;
            let time = Number(label.dataset.starttime);
            time += (move_x * (1000 / Magnification));
            time = time < 0 ? 0 : time;
            label.dataset.starttime = time;
            const time_span = label.querySelector(".list_time");
            time_span.textContent = TimeTagElement.TimeString(time);
        }
        else
        {
            WaveViewTime -=  (e.pageX - x) * (1000 / Magnification);
            if (WaveViewTime < 0)
                WaveViewTime = 0;
        }
        x = e.pageX;
        DrawWaveView();
    }
    function onDragMouseUp(e){
        document.removeEventListener('mousemove', onDragMouseMove, false);
        document.removeEventListener('mouseup', onDragMouseUp, false);
    }
    function onMouseDown(e){
        grap =(canvas.style.cursor == "pointer");
        x = e.pageX;
        document.addEventListener("mousemove",onDragMouseMove, false);
        document.addEventListener("mouseup",onDragMouseUp, false);
    }
    function onMouseMove(e){
        const time = currentListItem.firstChild.dataset.starttime;
        if (time < 0)
            return;

        const nowpoint = Math.floor(canvas.width * 0.3)
        const time_x = (time - WaveViewTime) * Magnification/1000 + nowpoint;
        if (time_x - 16 < e.offsetX && e.offsetX < time_x + 16)
        {
            canvas.style.cursor = "pointer";
        }
        else
        {
            canvas.style.cursor = null;
        }
    }
    function onDblClick(e){
        const time = currentListItem.firstChild.dataset.starttime;
        if (time < 0)
            return;

        const nowpoint = Math.floor(canvas.width * 0.3)
        const time_x = (time - WaveViewTime) * Magnification/1000 + nowpoint;
        if (time_x < e.offsetX)
        {
            const duration = getNextTime(currentListItem) - time;
            playFragment(time,duration);
        }
        if (e.offsetX < time_x)
        {
            let starttime = time - 1000;
            let duration = 1000;
            if (starttime < 0)
            {
                duration -= -starttime;
                starttime = 0;
            }
            playFragment(starttime,duration);
        }
    }


    function TimeTunerDraw()
    {
        const nowpoint = Math.floor(canvas.width * 0.3)
        const view_start_ms = WaveViewTime - (nowpoint * 1000/Magnification);
        waveViewer.DrawCanvas(canvas,view_start_ms,1000/Magnification);
        const ctx = canvas.getContext("2d");
        ctx.font = canvas.height / 8 + "px sans-serif";
        ctx.textBaseline = "ideographic";


        const view_end_ms = view_start_ms + (canvas.width * 1000/Magnification);
        let i = 0;
        for (i = 0; i < list.children.length;i++)
        {
            if (list.children[i].firstChild.dataset.starttime >= 0 && view_start_ms < list.children[i].firstChild.dataset.starttime)
                break;
        }
        for (; i < list.children.length;i++)
        {
            const label = list.children[i].firstChild;
            const time = label.dataset.starttime;
            if (time >= 0 && time >= view_end_ms)
                break;
            if (time < 0)
                continue;

    //        const time_span = label.querySelector(".list_time");
            const text_span = label.querySelector(".list_text");
            const current = label.querySelector("input").checked;

            ctx.fillStyle = current ? "lime" : "red";
            const x = (time - view_start_ms) * Magnification/1000;
            ctx.fillRect(x,0,1,canvas.height);
            ctx.fillText(text_span.textContent, x + 1, canvas.height);
        }
    }


    function Initialize()
    {
        const TimeTagList = new LyricsContainer(textarea.value);
        selected = 0;

        TimeTagList.lines.forEach(line => {
            const li = document.createElement("li");

            const label = document.createElement("label");
            label.classList.add("list_label");
            label.textContent = "　";
            label.dataset.starttime = line.starttime;
            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "tune_line";
            radio.onclick = (e) =>{
                TimeTunerDraw();
                currentListItem = e.currentTarget.parentElement.parentElement;
            };
            label.appendChild(radio);

            const starttime = document.createElement("span");
            starttime.textContent = TimeTagElement.TimeString(line.starttime);
            starttime.classList.add("list_time");

            const text = document.createElement("span");
            text.textContent = line.text;
            text.classList.add("list_text");

            label.ondblclick = (e)=>{
                const l = e.currentTarget;

                if (l.dataset.starttime >= 0)
                {
                    const duration = getNextTime(l.parentElement) - l.dataset.starttime;
                    WaveViewTime = l.dataset.starttime;
                    playFragment(WaveViewTime,duration);
                    DrawWaveView();
                }
                l.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"})
            };

            label.appendChild(starttime);
            label.appendChild(text);
            li.appendChild(label);
            list.appendChild(li);
        });
        const input = list.querySelector("input");
        input.checked = true;
        currentListItem = input.parentElement.parentElement;

        audio.pause();

        document.addEventListener("keydown",keydown,false);
        TuneModeDraw = TimeTunerDraw;
        SetDefaultCanvaMouseEvent(false);
        canvas.addEventListener("mousedown",onMouseDown, false);
        canvas.addEventListener("mousemove",onMouseMove, false);
        canvas.addEventListener("dblclick",onDblClick,false);
        DrawWaveView();
    }

    function Terminalize()
    {
        TuneModeDraw = null;
        let text = "";
        for (let i = 0; i < list.children.length;i++)
        {
            const item = list.children[i];
            const time_span = item.querySelector(".list_time");
            const text_span = item.querySelector(".list_text");
            text += time_span.textContent + text_span.textContent + "\n";
        }
        textarea.value = text.slice(0,-1);
        while (list.firstChild)
            list.firstChild.remove();
        document.removeEventListener("keydown",keydown,false);
        canvas.removeEventListener("dblclick",onDblClick,false);
        canvas.removeEventListener("mousemove",onMouseMove, false);
        canvas.removeEventListener("mousedown",onMouseDown, false);
        SetDefaultCanvaMouseEvent(true);
    }

    TuneModeInitializer = {Initialize:Initialize,Terminalize:Terminalize};

}());

(function TTTester(){
    const list = document.getElementById('TesterList');


    function Tick(timestamp)
    {
        const now = audio.currentTime * 1000;

        const lists = list.querySelectorAll("li");
        for (let i = 0;i < lists.length-1;i++)
        {
            if (lists[i].dataset.starttime <= now  && now < lists[i+1].dataset.starttime)
            {
                if (lists[i].classList.contains("Stanby"))
                {
                    lists[i].classList.replace("Stanby","Active");
                    lists[i].scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"})
                }
            }
            else
            {
                if (lists[i].classList.contains("Active"))
                    lists[i].classList.replace("Active","Stanby");
            }
        }
        if (!audio.paused)
            window.requestAnimationFrame(Tick);
    }

    function onPlay()
    {
        window.requestAnimationFrame(Tick);
    }
    function onTimeupdate()
    {
        Tick();
    }

    function Initialize()
    {
        const TimeTagList = new LyricsContainer(textarea.value);

        TimeTagList.lines.forEach(line => {
            if (line.starttime >= 0)
            {
                const li = document.createElement("li");
                li.dataset.starttime = line.starttime;
                li.textContent = line.text === "" ? "　" : line.text;
                li.classList.add("Stanby");
                list.appendChild(li);
            }
        });
        const li = document.createElement("li");
        li.dataset.starttime = 99 * 60000 + 59990;
        li.textContent = "";
        list.appendChild(li);

        audio.addEventListener("play",onPlay);
        audio.addEventListener("timeupdate",onPlay);
    }
    function Terminalize()
    {
        while (list.firstChild)
            list.firstChild.remove();

        audio.removeEventListener("play",onPlay);
        audio.removeEventListener("timeupdate",onPlay);
    }
    TestModeInitializer = {Initialize:Initialize,Terminalize:Terminalize};

}());

(function FilesDrop(){
var droparea = document.createElement("div")
	
	function showDroparea(){
        droparea.style.cssText = "all: initial;\
                                  position: fixed;\
                                  top:0;left:0;\
                                  z-index: 1000;\
                                  width: 100%;\
                                  height: 100%;\
                                  box-sizing: border-box;\
                                  display: block;\
                                  border: 8px dashed #333333;\
                                  background-color:rgba(0,0,0,0.5);"
	}
	
	function hideDroparea(){
        droparea.style.cssText = "all: initial;\
                                  position: fixed;\
                                  top:0;left:0;\
                                  z-index: 1000;\
                                  width: 100%;\
                                  height: 100%;\
                                  box-sizing: border-box;\
                                  display: none;";
    }
	
	droparea.ondragleave = e => {
		e.preventDefault();
		hideDroparea();
	};
	
	window.addEventListener("dragover", e => e.preventDefault(), false)
	window.addEventListener("dragenter", e => {
		e.preventDefault();
		showDroparea();
	}, false);
	window.addEventListener("drop", e => {
		e.preventDefault();
		hideDroparea();

        DropFiles(e.dataTransfer.files);
	}, false);
	
	document.body.appendChild(droparea);


function DropFiles(files)
{
    let audioread = false;
    let textread = false;
    for (let i = 0;i < files.length;i++)
    {
        const file = files[i]
        if (file.type.indexOf("audio/") == 0)
        {
            console.log("drop audio file:" + file.name);
            if (audioread)
                continue;
            audio.src = window.URL.createObjectURL(file);
            const ctx = canvas.getContext("2d");
            ctx.font = canvas.height / 2 + "px sans-serif";
            ctx.fillStyle = "white";
            ctx.fillText("Now Loading...", 0, canvas.height * 3 / 4);
            audioread = true;
            audioFilename = file.name;

            if (fragmentPlayer === null)
                fragmentPlayer  = new AudioFragmentPlayer();
            fragmentPlayer.loadFile(file).then(()=>{
                waveViewer = new WaveViewer(fragmentPlayer.audioBuffer);
                WaveViewTime = 0;
                playbackRate.value = 1;
                DrawWaveView();
            });
        }
        else if (file.type.indexOf("text/") == 0 || file.name.match(/\.lrc$/i))
        {
            console.log("drop text file:" + file.name);
            const editmode = document.getElementById( 'TabEdit' ).checked;
            if (editmode && !textread)
            {
                file.text().then(text=>{
                    textarea.value = text;
                })
                textread = true;
            }
        }
        else
        {
            console.log("ignore drop file:" + file.name);
        }
    }
}
})();
