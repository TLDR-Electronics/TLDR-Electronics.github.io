function toggleDarkMode() {
    var element = document.body;
    element.dataset.bsTheme = element.dataset.bsTheme == "light" ? "dark" : "light";
}

function calculateSolutions(a, b, c) {
    const discriminant = b * b - 4 * a * c;

    if (a === 0) {
        return ["Not a valid quadratic equation"];
    }

    if (discriminant < 0) {
        const realPart = (-b / (2 * a)).toFixed(3);
        const imaginaryPart = (Math.sqrt(-discriminant) / (2 * a)).toFixed(3);
        return [`${realPart} + ${imaginaryPart}i`, `${realPart} - ${imaginaryPart}i`];
    }

    const sqrtDiscriminant = Math.sqrt(discriminant);
    const x1 = (-b + sqrtDiscriminant) / (2 * a);
    const x2 = (-b - sqrtDiscriminant) / (2 * a);

    return [x1, x2];
}

function formatNumber(number) {
    if (typeof number === "string") {
        return number;
    }
    return (number % 1 !== 0) ? number.toFixed(3) : number;
}

function updateMathJax() {
    const a = parseFloat(document.getElementById("a").value) || "a";
    const b = parseFloat(document.getElementById("b").value) || "b";
    const c = parseFloat(document.getElementById("c").value) || "c";

    const [x1, x2] = calculateSolutions(a, b, c);

    const formattedX1 = formatNumber(x1);
    const formattedX2 = formatNumber(x2);

    const mathJaxElement = document.getElementById("mathjax-equation");
    mathJaxElement.innerHTML = `When \\(a \\ne 0\\), there are two solutions to \\(${a}x^2 + ${b}x + ${c} = 0\\) and they are given by the quadratic formula:
    $$x = {-${b} \\pm \\sqrt{${b}^2-4(${a})(${c})} \\over 2(${a})}.$$
    The solutions for the given values are:
    $$x_1 = ${formattedX1}, x_2 = ${formattedX2}.$$`;
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, mathJaxElement]);

    if (typeof quadraticChart === "undefined") {
        createQuadraticChart(a, b, c, x1, x2);
    } else {
        updateQuadraticChart(a, b, c, x1, x2);
    }
}


function onEnterKey(event) {
    if (event.key === "Enter") {
        updateMathJax();
    }
}

window.onload = function() {
    updateMathJax();
};


let quadraticChart;

function generateChartData(a, b, c) {
    const xMin = -10;
    const xMax = 10;
    const step = (xMax - xMin) / 100;
    const data = [];

    for (let x = xMin; x <= xMax; x += step) {
        const y = a * x * x + b * x + c;
        data.push({ x, y });
    }

    return data;
}

function createQuadraticChart(a, b, c, x1, x2) {
    const ctx = document.getElementById("quadraticChart").getContext("2d");
    const chartData = generateChartData(a, b, c, x1, x2);
  

    quadraticChart = new Chart(ctx, {
        type: "line",
        data: {
            datasets: [{
                label: "Quadratic Function",
                data: chartData,
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 2,
                fill: false,
                pointRadius: 0
            }, {
                label: "Roots",
                data: [{ x: x1, y: 0 }, { x: x2, y: 0 }],
                borderColor: "rgba(255, 99, 132, 1)",
                backgroundColor: "rgba(255, 99, 132, 1)",
                borderWidth: 0,
                pointRadius: 5
            }]
        },
        options: {
            scales: {
                x: { type: "linear", display: true, title: { display: true, text: "x" } },
                y: {
                    title: { display: true, text: "y" },
                    type: "linear",
                    position: "bottom",
                    grid: {
                        lineWidth: (context) => {
                            if (context.tick.value === 0) {
                                return 2;
                            }
                            return 1;
                        },
                        color: (context) => {
                            if (context.tick.value === 0) {
                                return 'rgba(0, 0, 0, 1)';
                            }
                            return 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                },
            }
        }
    });
}

function updateQuadraticChart(a, b, c, x1, x2) {
    const chartData = generateChartData(a, b, c);
    quadraticChart.data.datasets[0].data = chartData;

    if (isNaN(x1) || isNaN(x2) || typeof x1 === "string" || typeof x2 === "string") {
        quadraticChart.data.datasets[1].data = [];
    } else {
        quadraticChart.data.datasets[1].data = [{ x: x1, y: 0 }, { x: x2, y: 0 }];
    }

    quadraticChart.update();
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("a").addEventListener("keyup", updateMathJax);
    document.getElementById("b").addEventListener("keyup", updateMathJax);
    document.getElementById("c").addEventListener("keyup", updateMathJax);
    
    const a = parseFloat(document.getElementById("a").value) || 0;
    const b = parseFloat(document.getElementById("b").value) || 0;
    const c = parseFloat(document.getElementById("c").value) || 0;

    updateMathJax();
});