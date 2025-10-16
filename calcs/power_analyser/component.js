// Base class for all electrical components
class Component {
  constructor(id, label, category, position = null) {
    this.id = id;
    this.label = label;
    this.category = category;
    this.power_dissipation = 0;
    this.position = position;
  }

  // Common methods
  getFormattedPower() {
    return this.power_dissipation > 0 ? `${this.power_dissipation.toFixed(2)}W` : '';
  }

  setPower(powerValue) {
    this.power_dissipation = parseFloat(powerValue) || 0;
  }

  addPower(powerValue) {
    this.power_dissipation += parseFloat(powerValue) || 0;
  }

  clearCalculations() {
    this.power_dissipation = 0;
  }

  // Abstract methods - to be implemented by subclasses
  getUnitSuffix() {
    throw new Error('getUnitSuffix() must be implemented by subclass');
  }

  isValidForCalculation() {
    throw new Error('isValidForCalculation() must be implemented by subclass');
  }

  // Common Cytoscape methods
  getBaseCytoscapeData() {
    return {
      id: this.id,
      label: this.label,
      category: this.category,
      power: this.power_dissipation
    };
  }

  toCytoscapeNode() {
    const nodeData = {
      data: this.getBaseCytoscapeData()
    };

    if (this.position) {
      nodeData.position = this.position;
    }

    return nodeData;
  }

  // Abstract method for display - each subclass implements its own logic
  getDisplayLabel() {
    throw new Error('getDisplayLabel() must be implemented by subclass');
  }

  // Common graph traversal methods
  static getParentSupplyVoltage(componentId, cy) {
    const cyNode = cy.getElementById(componentId);
    if (!cyNode.length) return null;
    
    const incomingEdges = cyNode.incomers('edge');
    
    for (let i = 0; i < incomingEdges.length; i++) {
      const edge = incomingEdges[i];
      const sourceNode = edge.source();
      const sourceData = sourceNode.data();
      
      if (sourceData.category === 'supply') {
        return sourceData.output_voltage;
      }
    }
    
    return null;
  }

  // Factory method
  static fromCytoscapeNode(cyNode) {
    const data = cyNode.data();
    
    switch(data.category) {
      case 'supply':
        return Supply.fromCytoscapeNode(cyNode);
      case 'load':
        return Load.fromCytoscapeNode(cyNode);
      default:
        throw new Error(`Unknown component category: ${data.category}`);
    }
  }

  // Calculate total downstream current from this component
  getDownstreamCurrent(cy) {
    const cyNode = cy.getElementById(this.id);
    if (!cyNode.length) return 0;
    
    let totalCurrent = 0;
    const outgoingEdges = cyNode.outgoers('edge');
    
    outgoingEdges.forEach(edge => {
      const targetNode = edge.target();
      const targetData = targetNode.data();
      
      if (targetData.category === 'supply') {
        // For downstream supplies, use their input_current
        totalCurrent += parseFloat(targetData.input_current) || 0;
      } else if (targetData.category === 'load') {
        // For downstream loads, use their current
        totalCurrent += parseFloat(targetData.current) || 0;
      }
    });
    
    return totalCurrent;
  }

}

// Supply class for voltage sources and regulators
class Supply extends Component {
  constructor(id, label, position = null) {
    super(id, label, 'supply', position);
    this.output_voltage = 0;
    this.output_current = 0;
    this.input_current = 0;
    this.efficiency = 0.85; // Default efficiency for switching regulators (85%)
    this.regulator_type = 'linear'; // 'linear' or 'switching'
  }

  // Voltage methods
  getVoltage() {
    return this.output_voltage;
  }

  setVoltage(voltage) {
    this.output_voltage = parseFloat(voltage) || 0;
  }

  // Efficiency methods
  getEfficiency() {
    return this.efficiency;
  }

  setEfficiency(efficiency) {
    const effValue = parseFloat(efficiency) || 0;
    // Clamp efficiency between 0.1 and 1.0 (10% to 100%)
    this.efficiency = Math.max(0.1, Math.min(1.0, effValue));
  }

  // Regulator type methods
  getRegulatorType() {
    return this.regulator_type;
  }

  setRegulatorType(type) {
    if (type === 'linear' || type === 'switching') {
      this.regulator_type = type;
    }
  }

  isLinearRegulator() {
    return this.regulator_type === 'linear';
  }

  isSwitchingRegulator() {
    return this.regulator_type === 'switching';
  }

  getUnitSuffix() {
    return 'V';
  }

  isValidForCalculation() {
    return this.output_voltage > 0;
  }

  // Supply-specific methods
  getFormattedCurrent() {
    return this.output_current > 0 ? `${this.output_current.toFixed(2)}A` : '';
  }

  getFormattedInputCurrent() {
    return this.input_current > 0 ? `${this.input_current.toFixed(2)}A` : '';
  }

  getFormattedEfficiency() {
    if (this.isSwitchingRegulator()) {
      return `${(this.efficiency * 100).toFixed(0)}%`;
    } else if (this.isLinearRegulator()) {
      // Calculate effective efficiency for linear regulators
      const cyNode = cy?.getElementById(this.id);
      if (cyNode && cyNode.length > 0) {
        const incomingEdges = cyNode.incomers('edge');
        if (incomingEdges.length > 0) {
          const inputSupplyNode = incomingEdges[0].source();
          const inputSupply = Component.fromCytoscapeNode(inputSupplyNode);
          
          if (inputSupply instanceof Supply) {
            const inputVoltage = inputSupply.getVoltage();
            const outputVoltage = this.getVoltage();
            
            if (inputVoltage > 0 && outputVoltage > 0) {
              const effectiveEfficiency = (outputVoltage / inputVoltage) * 100;
              return `${effectiveEfficiency.toFixed(0)}%`;
            }
          }
        }
      }
    }
    return '';
  }

  setCurrent(currentValue) {
    this.output_current = parseFloat(currentValue) || 0;
  }

  setInputCurrent(currentValue) {
    this.input_current = parseFloat(currentValue) || 0;
  }

  addCurrent(currentValue) {
    this.output_current += parseFloat(currentValue) || 0;
  }

  clearCalculations() {
    super.clearCalculations();
    this.output_current = 0;
    this.input_current = 0;
  }

  getDisplayLabel() {
    let label = this.output_voltage > 0 ? 
      `${this.label}\n${this.output_voltage} ${this.getUnitSuffix()}` : this.label;
    
    // Add regulator type indicator and efficiency for both types
    if (this.isSwitchingRegulator()) {
      label += ' (SW)';
    } else if (this.isLinearRegulator()) {
      label += ' (LIN)';
    }
    
    // Show efficiency for both switching and linear regulators
    const effText = this.getFormattedEfficiency();
    if (effText) {
      label += `\nEff: ${effText}`;
    }
    
    const currentText = this.getFormattedCurrent();
    if (currentText) {
      label += `\nI: ${currentText}`;
    }

    const powerText = this.getFormattedPower();
    if (powerText) {
      label += `\nP: ${powerText}`;
    }
    
    return label;
  }

  toCytoscapeNode() {
    const nodeData = super.toCytoscapeNode();
    nodeData.data = {
      ...nodeData.data,
      output_voltage: this.output_voltage,
      output_current: this.output_current,
      input_current: this.input_current,
      efficiency: this.efficiency,
      regulator_type: this.regulator_type
    };
    return nodeData;
  }

  static fromCytoscapeNode(cyNode) {
    const data = cyNode.data();
    const supply = new Supply(data.id, data.label, cyNode.position());
    
    supply.output_voltage = parseFloat(data.output_voltage) || 0;
    supply.output_current = parseFloat(data.output_current) || 0;
    supply.input_current = parseFloat(data.input_current) || 0;
    supply.power_dissipation = parseFloat(data.power) || 0;
    supply.efficiency = parseFloat(data.efficiency) || 0.85;
    supply.regulator_type = data.regulator_type || 'linear';
    
    return supply;
  }
  
  // Updated calculatePower method to handle both linear and switching regulators
  calculatePower(cy) {
    // Calculate total downstream current
    const totalCurrent = this.getDownstreamCurrent(cy);
    
    if (totalCurrent > 0) {
      this.setCurrent(totalCurrent);
      
      // For regulators (not primary supplies), calculate power dissipation and input current
      const cyNode = cy.getElementById(this.id);
      const incomingEdges = cyNode.incomers('edge');
      if (incomingEdges.length > 0) {
        const inputSupplyNode = incomingEdges[0].source();
        const inputSupply = Component.fromCytoscapeNode(inputSupplyNode);
        
        if (inputSupply instanceof Supply) {
          const inputVoltage = inputSupply.getVoltage();
          const outputVoltage = this.getVoltage();
          const outputPower = outputVoltage * totalCurrent;
          
          if (this.isSwitchingRegulator()) {
            // Switching regulator: pd = (powerOut / efficiency) - powerOut
            const inputPower = outputPower / this.efficiency;
            const powerDissipation = inputPower - outputPower;
            const inputCurrent = inputPower / inputVoltage;
            
            this.setPower(powerDissipation);
            this.setInputCurrent(inputCurrent);
          } else {
            // Linear regulator: pd = (inputVoltage - outputVoltage) * current
            const powerDissipation = (inputVoltage - outputVoltage) * totalCurrent;
            
            this.setPower(powerDissipation);
            this.setInputCurrent(totalCurrent); // Input current = output current for linear
          }
        }
      } else {
        // Primary supply - no input current calculation needed
        this.setInputCurrent(0);
      }
      
      return true; // Successfully calculated
    }
    return false; // No calculation performed
  }

}

// Load class for resistive and constant current loads
class Load extends Component {
  constructor(id, label, loadType = 'resistive', position = null) {
    super(id, label, 'load', position);
    this.load = 0;
    this.load_type = loadType;
    this.current = 0;
  }

  // Load methods
  getLoad() {
    return this.load;
  }

  setLoad(loadValue) {
    this.load = parseFloat(loadValue) || 0;
  }

  getResistance() {
    if (this.isResistiveLoad()) {
      return this.load;
    }
    throw new Error('Cannot get resistance from non-resistive load');
  }

  setResistance(resistance) {
    if (this.isResistiveLoad()) {
      this.load = parseFloat(resistance) || 0;
    } else {
      throw new Error('Cannot set resistance on non-resistive load');
    }
  }

  getCurrent() {
    if (this.isConstantCurrentLoad()) {
      return this.load;
    }
    throw new Error('Cannot get current from non-constant-current load');
  }

  setCurrent(current) {
    if (this.isConstantCurrentLoad()) {
      this.load = parseFloat(current) || 0;
    } else {
      throw new Error('Cannot set current on non-constant-current load');
    }
  }

  getUnitSuffix() {
    return this.load_type === 'constant-current' ? 'A' : 'Ω';
  }

  isValidForCalculation() {
    return this.load > 0;
  }

  // Load-specific methods
  isResistiveLoad() {
    return this.load_type === 'resistive' || this.load_type === '';
  }

  isConstantCurrentLoad() {
    return this.load_type === 'constant-current';
  }

  setLoadType(type) {
    this.load_type = type;
  }

  // Current methods
  getCalculatedCurrent() {
    return this.current;
  }

  setCalculatedCurrent(currentValue) {
    this.current = parseFloat(currentValue) || 0;
  }

  getFormattedCurrent() {
    return this.current > 0 ? `${this.current.toFixed(2)}A` : '';
  }

  getDisplayLabel() {
    let label = this.label;
    
    if (this.load > 0) {
      label += `\n${this.load}${this.getUnitSuffix()}`;
    }
    
    // Add current if it exists
    if (this.current > 0) {
      label += `\n${this.current.toFixed(2)}A`;
    }
    
    // Add power if it exists
    const powerText = this.getFormattedPower();
    if (powerText) {
      label += `\n${powerText}`;
    }
    
    return label;
  }

  toCytoscapeNode() {
    const nodeData = super.toCytoscapeNode();
    nodeData.data = {
      ...nodeData.data,
      load: this.load,
      load_type: this.load_type,
      current: this.current
    };
    return nodeData;
  }

  static fromCytoscapeNode(cyNode) {
    const data = cyNode.data();
    const load = new Load(data.id, data.label, data.load_type || 'resistive', cyNode.position());
    
    load.load = parseFloat(data.load) || 0;
    load.current = parseFloat(data.current) || 0;
    load.power_dissipation = parseFloat(data.power) || 0;
    
    return load;
  }
  
  // Add this method to the Load class
  calculatePower(cy) {
    // Find connected supply voltage
    const cyNode = cy.getElementById(this.id);
    const incomingEdges = cyNode.incomers('edge');
    
    for (let edge of incomingEdges) {
      const sourceNode = edge.source();
      const sourceComponent = Component.fromCytoscapeNode(sourceNode);
      
      if (sourceComponent instanceof Supply && sourceComponent.isValidForCalculation()) {
        const voltage = sourceComponent.getVoltage();
        const resistance = this.getLoad();
        
        if (resistance > 0) {
          const current = voltage / resistance;
          const power = voltage * current;
          
          this.setCalculatedCurrent(current);
          this.setPower(power);
          return true; // Successfully calculated
        }
      }
    }
    return false; // No valid calculation found
  }
  
}

// Factory class for creating components
class ComponentFactory {
  static createSupply(id, label, voltage = 0, position = null) {
    const supply = new Supply(id, label, position);
    supply.setVoltage(voltage);
    return supply;
  }

  static createResistiveLoad(id, label, resistance = 0, position = null) {
    const load = new Load(id, label, 'resistive', position);
    load.setResistance(resistance);
    return load;
  }

  static createConstantCurrentLoad(id, label, current = 0, position = null) {
    const load = new Load(id, label, 'constant-current', position);
    load.setCurrent(current);
    return load;
  }

  static createDefaultNode(nodeCounter) {
    return new Supply(`node${nodeCounter}`, `Node ${nodeCounter}`);
  }
}
