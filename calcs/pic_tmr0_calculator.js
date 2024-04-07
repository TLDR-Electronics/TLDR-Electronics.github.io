var UINT8_MAX = 0xFF;
var UINT16_MAX = 0xFFFF;

function getInputFloat(id) {
    'use strict';
    return parseFloat(document.getElementById(id.toString()).value);
}

function setValue(id, value) {
    'use strict';
    document.getElementById(id).value = value;
}

function setInnerHTML(id, value) {
    'use strict';
    document.getElementById(id).innerHTML = value;
}

function minMaxValue(value, min, max) {
    'use strict';
    return Math.min(Math.max(value, min), max);
}

function calculateTMR0() {
    'use strict';

    var TMRx_MAX = UINT8_MAX;

    // Handles the tout of fout is updated, or vice versa
    if (document.activeElement.id === "fout") {
        document.getElementById("tout").value = 1 / document.getElementById("fout").value;
    } else if (document.activeElement.id === "tout") {
        document.getElementById("fout").value = 1 / document.getElementById("tout").value;
    }

    document.getElementById("tout").value = 1 / document.getElementById("fout").value;


    if (false) {
        TMRx_MAX = UINT16_MAX;
    }

    // Initialise Variables   
    var fosc = getInputFloat("fosc"),
        fout = getInputFloat("fout"),
        tout = getInputFloat("tout"),
        truePeriod2 = 0,
        truePeriod4 = 0,
        truePeriod8 = 0,
        truePeriod16 = 0,
        truePeriod32 = 0,
        truePeriod64 = 0,
        truePeriod128 = 0,
        truePeriod256 = 0,
        trueFrequency2 = 0,
        trueFrequency4 = 0,
        trueFrequency8 = 0,
        trueFrequency16 = 0,
        trueFrequency32 = 0,
        trueFrequency64 = 0,
        trueFrequency128 = 0,
        trueFrequency256 = 0,
        tmrx2 = (TMRx_MAX + 1) - (fosc / (4 * 2 * fout)),
        tmrx4 = (TMRx_MAX + 1) - (fosc / (4 * 4 * fout)),
        tmrx8 = (TMRx_MAX + 1) - (fosc / (4 * 8 * fout)),
        tmrx16 = (TMRx_MAX + 1) - (fosc / (4 * 16 * fout)),
        tmrx32 = (TMRx_MAX + 1) - (fosc / (4 * 32 * fout)),
        tmrx64 = (TMRx_MAX + 1) - (fosc / (4 * 64 * fout)),
        tmrx128 = (TMRx_MAX + 1) - (fosc / (4 * 128 * fout)),
        tmrx256 = (TMRx_MAX + 1) - (fosc / (4 * 256 * fout)),
        result2 = minMaxValue(Math.round(tmrx2), 0, TMRx_MAX),
        result4 = minMaxValue(Math.round(tmrx4), 0, TMRx_MAX),
        result8 = minMaxValue(Math.round(tmrx8), 0, TMRx_MAX),
        result16 = minMaxValue(Math.round(tmrx16), 0, TMRx_MAX),
        result32 = minMaxValue(Math.round(tmrx32), 0, TMRx_MAX),
        result64 = minMaxValue(Math.round(tmrx64), 0, TMRx_MAX),
        result128 = minMaxValue(Math.round(tmrx128), 0, TMRx_MAX),
        result256 = minMaxValue(Math.round(tmrx256), 0, TMRx_MAX);

    // Calculate actual delay
    trueFrequency2 = fosc / (4 * 2 * ((TMRx_MAX + 1) - result2));
    trueFrequency4 = fosc / (4 * 4 * ((TMRx_MAX + 1) - result4));
    trueFrequency8 = fosc / (4 * 8 * ((TMRx_MAX + 1) - result8));
    trueFrequency16 = fosc / (4 * 16 * ((TMRx_MAX + 1) - result16));
    trueFrequency32 = fosc / (4 * 32 * ((TMRx_MAX + 1) - result32));
    trueFrequency64 = fosc / (4 * 64 * ((TMRx_MAX + 1) - result64));
    trueFrequency128 = fosc / (4 * 128 * ((TMRx_MAX + 1) - result128));
    trueFrequency256 = fosc / (4 * 256 * ((TMRx_MAX + 1) - result256));

    truePeriod2 = 1 / trueFrequency2;
    truePeriod4 = 1 / trueFrequency4;
    truePeriod8 = 1 / trueFrequency8;
    truePeriod16 = 1 / trueFrequency16;
    truePeriod32 = 1 / trueFrequency32;
    truePeriod64 = 1 / trueFrequency64;
    truePeriod128 = 1 / trueFrequency128;
    truePeriod256 = 1 / trueFrequency256;

    setInnerHTML("trueFrequency2", trueFrequency2.toFixed(3));
    setInnerHTML("trueFrequency4", trueFrequency4.toFixed(3));
    setInnerHTML("trueFrequency8", trueFrequency8.toFixed(3));
    setInnerHTML("trueFrequency16", trueFrequency16.toFixed(3));
    setInnerHTML("trueFrequency32", trueFrequency32.toFixed(3));
    setInnerHTML("trueFrequency64", trueFrequency64.toFixed(3));
    setInnerHTML("trueFrequency128", trueFrequency128.toFixed(3));
    setInnerHTML("trueFrequency256", trueFrequency256.toFixed(3));

    setInnerHTML("truePeriod2", truePeriod2.toFixed(3));
    setInnerHTML("truePeriod4", truePeriod4.toFixed(3));
    setInnerHTML("truePeriod8", truePeriod8.toFixed(3));
    setInnerHTML("truePeriod16", truePeriod16.toFixed(3));
    setInnerHTML("truePeriod32", truePeriod32.toFixed(3));
    setInnerHTML("truePeriod64", truePeriod64.toFixed(3));
    setInnerHTML("truePeriod128", truePeriod128.toFixed(3));
    setInnerHTML("truePeriod256", truePeriod256.toFixed(3));
    //debugger;
    setInnerHTML("error2", (((trueFrequency2 - fout) / fout) * 100).toFixed(2));
    setInnerHTML("error4", (((trueFrequency4 - fout) / fout) * 100).toFixed(2));
    setInnerHTML("error8", (((trueFrequency8 - fout) / fout) * 100).toFixed(2));
    setInnerHTML("error16", (((trueFrequency16 - fout) / fout) * 100).toFixed(2));
    setInnerHTML("error32", (((trueFrequency32 - fout) / fout) * 100).toFixed(2));
    setInnerHTML("error64", (((trueFrequency64 - fout) / fout) * 100).toFixed(2));
    setInnerHTML("error128", (((trueFrequency128 - fout) / fout) * 100).toFixed(2));
    setInnerHTML("error256", (((trueFrequency256 - fout) / fout) * 100).toFixed(2));

    setInnerHTML("tmrx2", result2);
    setInnerHTML("tmrx4", result4);
    setInnerHTML("tmrx8", result8);
    setInnerHTML("tmrx16", result16);
    setInnerHTML("tmrx32", result32);
    setInnerHTML("tmrx64", result64);
    setInnerHTML("tmrx128", result128);
    setInnerHTML("tmrx256", result256);

}

function calculateUART() {
    'use strict';

    var fosc = getInputFloat("fosc"),
        baud = getInputFloat("baud"),
        spbrg4 = 0.0,
        spbrg16 = 0.0,
        spbrg16_brgh = 0.0,
        spbrg64 = 0.0,
        true_baud4 = 0.0,
        true_baud16 = 0.0,
        true_baud16_brgh = 0.0,
        true_baud64 = 0.0;

    spbrg4 = minMaxValue(((fosc / (baud * 4)) - 1), 0, UINT16_MAX);
    spbrg16 = minMaxValue(((fosc / (baud * 16)) - 1), 0, UINT8_MAX);
    spbrg16_brgh = minMaxValue(((fosc / (baud * 16)) - 1), 0, UINT16_MAX);
    spbrg64 = minMaxValue(((fosc / (baud * 64)) - 1), 0, UINT8_MAX);

    true_baud4 = fosc / (4 * (Math.round(spbrg4) + 1));
    true_baud16 = fosc / (16 * (Math.round(spbrg16) + 1));
    true_baud16_brgh = fosc / (16 * (Math.round(spbrg16_brgh) + 1));
    true_baud64 = fosc / (64 * (Math.round(spbrg64) + 1));

    //setInnerHTML("spbrg4", spbrg4.toFixed(2));
    //setInnerHTML("spbrg16", spbrg16.toFixed(2));
    //setInnerHTML("spbrg16_brgh", spbrg16_brgh.toFixed(2));
    //setInnerHTML("spbrg64", spbrg64.toFixed(2));

    setInnerHTML("spbrg_int4", Math.round(spbrg4));
    setInnerHTML("spbrg_int16", Math.round(spbrg16));
    setInnerHTML("spbrg_int16_brgh", Math.round(spbrg16_brgh));
    setInnerHTML("spbrg_int64", Math.round(spbrg64));

    setInnerHTML("true_baud4", true_baud4.toFixed(2));
    setInnerHTML("true_baud16", true_baud16.toFixed(2));
    setInnerHTML("true_baud16_brgh", true_baud16_brgh.toFixed(2));
    setInnerHTML("true_baud64", true_baud64.toFixed(2));

    setInnerHTML("baud_error4", (((baud - true_baud4) / true_baud4) * 100).toFixed(2));
    setInnerHTML("baud_error16", (((baud - true_baud16) / true_baud16) * 100).toFixed(2));
    setInnerHTML("baud_error16_brgh", (((baud - true_baud16_brgh) / true_baud16_brgh) * 100).toFixed(2));
    setInnerHTML("baud_error64", (((baud - true_baud64) / true_baud64) * 100).toFixed(2));

}
