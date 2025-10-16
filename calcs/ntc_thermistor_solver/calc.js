let ntcChart = null;

function calculateNTCSheet() {
    const B = parseFloat(document.getElementById("B").value);
    const R_0 = parseFloat(document.getElementById("rated_resistance").value);
    const T_0 = parseFloat(document.getElementById("rated_temperature").value);
    const target_temperature = parseFloat(document.getElementById("target_temperature").value);
    const K = 273.15;

    var y = get_ntc_resistance(R_0, B, target_temperature, K, T_0);

    var container = document.getElementById("result");

    container.innerHTML = "Target Resistance = " + Math.round(y) + " Ω"

    updateNtcGraph(target_temperature, R_0, B, K, T_0);

    updateVoltageDividerSection(R_0, B, K, T_0)

}

function updateVoltageDividerSection(R_0, B, K, T_0) {
    const vin = parseFloat(document.getElementById("rail_voltage").value);
    const vout = parseFloat(document.getElementById("trigger_voltage").value);
    const trigger_temperature = parseFloat(document.getElementById("trigger_temperature").value);
    const ntc_checked = document.getElementById('ntc_on_top').checked;
    var container = document.getElementById("target_resistance");

    ntc = get_ntc_resistance(R_0, B, trigger_temperature, K, T_0)

    // R2 = (Vout * R1) / (Vin - Vout)
    // R1 = (R2*(Vin-Vout))/Vout
    
    if(ntc_checked) {
        checked_string = "above "
        result = ntc * (vin-vout) / vout
    } else {
        checked_string = "below "
        result = (vout * ntc) / (vin - vout)
    }

    //result = "ntc= " + ntc + "<p>" + "test"

    container.innerHTML = "R = " + Math.round(result) + " Ω" 
    + "<p><p>Note: The trigger voltage will be <b>" + checked_string + "</b>" + vout 
    + "V when the temperature is above the trigger (" + trigger_temperature + "°C) threshold"

    var image = document.getElementById('ntc_image');

    if (ntc_checked) {
        image.src = `/calcs/ntc_thermistor_solver/images/ntc_top.svg`
        
    } else {
        image.src = `/calcs/ntc_thermistor_solver/images/ntc_bottom.svg`
    }

}

function updateNtcGraph(target_temperature, R_0, B, K, T_0) {
    const temperatures = [];
    const resistances = [];

    const TMIN = Math.min(-40, target_temperature * 1.1);
    const TMAX = Math.max(85, target_temperature * 1.1);

    for (let t = TMIN; t <= TMAX; t += 1) {
        temperatures.push(t);
        resistances.push(get_ntc_resistance(R_0, B, t, K, T_0));
    }

    // Calculate highlighted points
    const pointT0 = {
        x: T_0,
        y: get_ntc_resistance(R_0, B, T_0, K, T_0)
    };

    const pointTarget = {
        x: target_temperature,
        y: get_ntc_resistance(R_0, B, target_temperature, K, T_0)
    };

    // Get min/max from data
    const minResistance = Math.min(...resistances);
    const maxResistance = Math.max(...resistances);

    const ctx = document.getElementById('ntcChart').getContext('2d');

    if (ntcChart) {
        ntcChart.data.labels = temperatures;
        ntcChart.data.datasets[0].data = resistances;

        ntcChart.data.datasets[1] = {
            type: 'scatter',
            label: 'Rated Point (T₀)',
            data: [pointT0],
            backgroundColor: 'red',
            pointRadius: 5,
            pointHoverRadius: 6
        };

        ntcChart.data.datasets[2] = {
            type: 'scatter',
            label: 'Target Point',
            data: [pointTarget],
            backgroundColor: 'green',
            pointRadius: 5,
            pointHoverRadius: 6
        };

        ntcChart.options.scales.y.min = minResistance * 0.9;
        ntcChart.options.scales.y.max = maxResistance * 1.1;

        ntcChart.update();
    } else {
        ntcChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: temperatures,
                datasets: [
                    {
                        label: 'NTC Resistance (Ω)',
                        data: resistances,
                        borderColor: 'blue',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0,
                        tension: 0.1
                    },
                    {
                        type: 'scatter',
                        label: 'Rated Point (T₀)',
                        data: [pointT0],
                        backgroundColor: 'red',
                        pointRadius: 5,
                        pointHoverRadius: 6
                    },
                    {
                        type: 'scatter',
                        label: 'Target Point',
                        data: [pointTarget],
                        backgroundColor: 'green',
                        pointRadius: 5,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Resistance (Ω)'
                        },
                        type: 'logarithmic',
                        min: minResistance * 0.9,
                        max: maxResistance * 1.1
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
    }
}

function get_ntc_resistance(R_0, B, target_temperature, K, T_0) {
    return R_0 * Math.exp(B * (1 / (target_temperature + K) - 1 / (T_0 + K)));
}

