function getFloatFromID(element) {
    return parseFloat(document.getElementById(element).value);
}

function eng(num, decimal_places=3) {
    if (num === 0) return '0';
  
    const units = ['p', 'n', 'µ', 'm', '', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
    var exponent = Math.floor(Math.log10(Math.abs(num)) / 3);
    var unitIndex = exponent + 4;
  
    if (unitIndex < 0 || unitIndex >= units.length) {
      return num.toExponential(2);
    }
  
    var absNum = num / Math.pow(10, exponent * 3);
  
    const sign = num < 0 ? '-' : '';
    const formattedNumber = absNum.toFixed(decimal_places);
  
    return `${sign}${formattedNumber}${units[unitIndex]}`;
  }

function calculate_capacitance() {
    const v_on = getFloatFromID("supply_voltage");
    const v_min = getFloatFromID("minimum_voltage");
    const t = getFloatFromID("time") * getFloatFromID("time_multiplier");
    const load = getFloatFromID("load") * getFloatFromID("load_multiplier");
    const type = document.querySelector('input[name="load_type"]:checked').value;
    
    var image = document.getElementById('discharge_image');
    var container = document.getElementById("output");
    var result = 0.0
    
    switch (type) {
        case "R":
            result = t/(load*Math.log(v_on/v_min));
            image.src = "/calcs/capacitor_holdup_solver/images/rc_discharge.svg";
            break;
        case "A":
            result = t*(load/(v_on-v_min))
            image.src = "/calcs/capacitor_holdup_solver/images/cc_discharge.svg";
            break;
        case "W":
            result = 2*load*(t/(v_on**2 - v_min**2))
            image.src = "/calcs/capacitor_holdup_solver/images/cp_discharge.svg";
            break;
    
        default:
            break;
    }
    
    
    container.innerHTML = eng(result)+"F";
    
}