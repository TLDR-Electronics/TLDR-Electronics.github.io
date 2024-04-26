function calculateNtcResistance() {
    const B = parseFloat(document.getElementById("B").value);
    const rated_resistance = parseFloat(document.getElementById("rated_resistance").value);
    const rated_temperature = parseFloat(document.getElementById("rated_temperature").value);
    const target_temperature = parseFloat(document.getElementById("target_temperature").value);
    const K = 273.15;

    var y = rated_resistance * Math.exp(B * (1/(target_temperature+K) - 1/(rated_temperature+K)));
    
    var container = document.getElementById("result");

    container.innerHTML = Math.round(y) + " Ω"
}

