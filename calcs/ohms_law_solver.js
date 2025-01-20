"use strict";

const VOLTAGE_ID = "V";
const RES_ID = "Z";
const POWER_ID = "P";
const CUR_ID = "I";

// Class to keep track of recent elements
class RecentElementsTracker {
  constructor() {
    this.maxSize = 2;
    this.elements = [];
  }

  // Function to track unique element changes
  track(elementId) {
    if (this.elements[this.elements.length - 1] !== elementId) {
      this.elements.push(elementId);
    }

    if (this.elements.length > this.maxSize) {
      this.elements.shift();
    }
  }
}

// Create a tracker that keeps track of the last 2 unique edited elements
const tracker = new RecentElementsTracker();

function calculate(elementId) {
  tracker.track(elementId);

  // const v_multiplier = parseFloat(document.getElementById("Vm").value) || 0;
  // const i_multiplier = parseFloat(document.getElementById("Im").value) || 0;
  // const z_multiplier = parseFloat(document.getElementById("Zm").value) || 0;
  // const p_multiplier = parseFloat(document.getElementById("Pm").value) || 0;

  const v_original = parseFloat(document.getElementById(VOLTAGE_ID).value) || 0;
  const i_original = parseFloat(document.getElementById(CUR_ID).value) || 0;
  const z_original = parseFloat(document.getElementById(RES_ID).value) || 0;
  const p_original = parseFloat(document.getElementById(POWER_ID).value) || 0;

  if (tracker.elements.length <= 1) return;

  const [this_change, prev_change] = tracker.elements;
  const changes = [this_change, prev_change].sort().join();

  // Variables for calculation
  let v = v_original,
    i = i_original,
    z = z_original,
    p = p_original;

  // Calculate the parameters based on the last two changes
  if (changes === [VOLTAGE_ID, CUR_ID].sort().join()) {
    z = v / i;
    p = Math.abs(i * v);
  } else if (changes === [VOLTAGE_ID, RES_ID].sort().join()) {
    i = v / z;
    p = Math.abs((v * v) / z);
  } else if (changes === [VOLTAGE_ID, POWER_ID].sort().join()) {
    i = p / v;
    z = (v * v) / p;
  } else if (changes === [CUR_ID, RES_ID].sort().join()) {
    v = i * z;
    p = Math.abs(i * i * z);
  } else if (changes === [CUR_ID, POWER_ID].sort().join()) {
    z = p / (i * i);
    v = p / i;
  } else if (changes === [RES_ID, POWER_ID].sort().join()) {
    v = Math.sqrt(p * z);
    i = Math.sqrt(p / z);
  }

  // Only update the input fields if the value has actually changed
  if (v !== v_original) document.getElementById(VOLTAGE_ID).value = v;
  if (i !== i_original) document.getElementById(CUR_ID).value = i;
  if (z !== z_original) document.getElementById(RES_ID).value = z;
  if (p !== p_original) document.getElementById(POWER_ID).value = p;
}

[VOLTAGE_ID, CUR_ID, RES_ID, POWER_ID].forEach((id) => {
  document.getElementById(id).addEventListener("input", () => calculate(id));
});
