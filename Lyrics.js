
class TimeTagElement
{
    static Create(text)
    {
        let match = text.match(/^\[(\d+):(\d+)[:.](\d+)\](.*)$/);
        if (match)
        {
            const second = parseFloat(match[2] + '.' + match[3]);
            const this_starttime = (match[1] * 60000 + second * 1000) | 0;
            return new TimeTagElement(this_starttime,match[4]);
        }
        return new TimeTagElement(-1,text);
    }
    constructor(starttime,text)
    {
        this.text = text;
        this.starttime = starttime;
    }
    toString()
    {
        return TimeTagElement.TimeString(this.starttime) + this.text;
    }
    static TimeString(time_ms)
    {
        return time_ms < 0 ? "" : '[' + String(Math.floor(time_ms / 60000)).padStart(2,'0') +
                                  ':' + ('0' + (time_ms % 60000 / 1000).toFixed(2)).slice(-5) + ']';
    }
}
class LyricsContainer
{
    constructor(lyticstext)
    {
        this.lines = [];
        lyticstext.split(/\r\n|\r|\n/).forEach(line => {
            this.lines.push(TimeTagElement.Create(line));
        });
    }
    toString()
    {
        let ret = "";
        this.lines.forEach(line =>
        {
            ret += line.toString() + "\n";
        });
        return ret;
    }
}


