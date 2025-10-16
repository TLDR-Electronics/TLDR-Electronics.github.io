
let nodeCounter = 0;
let currentMode = 'normal';
let connectingFrom = null;
let selectedNode = null;
let cy;
let nodeManager;

// Button references
let addNodeBtn, connectModeBtn, deleteModeBtn, clearBtn, layoutBtn, showPropertiesBtn;
let saveURLBtn, loadURLBtn, copyURLBtn;

// Property panel elements
let noSelectionDiv, propertyForm, componentInfo;
let propName, propVoltage, propLoad, propEfficiency;
let categoryChoice1, categoryChoice2, regulatorLinear, regulatorSwitching;
let supplyOptions, loadOptions, regulatorOptions;
let applyChangesBtn, clearSelectionBtn;

// Context menu elements
let contextMenu, contextEdit, contextDelete;
let contextMenuTarget = null;
let contextMenuType = null; // 'node' or 'edge'

document.addEventListener('DOMContentLoaded', function() {
  // Initialize button references
  addNodeBtn = document.getElementById('add-node-btn');
  connectModeBtn = document.getElementById('connect-mode-btn');
  deleteModeBtn = document.getElementById('delete-mode-btn');
  clearBtn = document.getElementById('clear-btn');
  layoutBtn = document.getElementById('layout-btn');
  showPropertiesBtn = document.getElementById('show-properties-btn');
  saveURLBtn = document.getElementById('save-url-btn');
  loadURLBtn = document.getElementById('load-url-btn');
  copyURLBtn = document.getElementById('copy-url-btn');

  // Initialize property panel elements
  noSelectionDiv = document.getElementById('no-selection');
  propertyForm = document.getElementById('property-form');
  componentInfo = document.getElementById('component-info');
  
  propName = document.getElementById('prop-name');
  propVoltage = document.getElementById('prop-voltage');
  propLoad = document.getElementById('prop-load');
  propEfficiency = document.getElementById('prop-efficiency');
  
  categoryChoice1 = document.getElementById('categoryChoice1');
  categoryChoice2 = document.getElementById('categoryChoice2');
  regulatorLinear = document.getElementById('regulatorLinear');
  regulatorSwitching = document.getElementById('regulatorSwitching');
  
  supplyOptions = document.getElementById('supply-options');
  loadOptions = document.getElementById('load-options');
  regulatorOptions = document.getElementById('regulator-options');
  
  applyChangesBtn = document.getElementById('apply-changes');
  clearSelectionBtn = document.getElementById('clear-selection');

  // Initialize context menu
  contextMenu = document.getElementById('context-menu');
  contextEdit = document.getElementById('context-edit');
  contextDelete = document.getElementById('context-delete');

  // Initialize Cytoscape with updated elements
  const vehicleSupply = ComponentFactory.createSupply('a', 'Vehicle Supply', 16);
  const reg5V = ComponentFactory.createSupply('b', '5V Regulator', 5);
  
  reg5V.setRegulatorType('switching');
  reg5V.setEfficiency(0.90);
  
  const load1 = ComponentFactory.createResistiveLoad('c', 'Load 1', 2.5);
  const load2 = ComponentFactory.createResistiveLoad('d', 'Load 2', 100);
  const load3 = ComponentFactory.createResistiveLoad('e', 'Load 3', 50);

  cy = cytoscape({
    container: document.getElementById('cy'),
    
    elements: [
      vehicleSupply.toCytoscapeNode(),
      reg5V.toCytoscapeNode(),
      load1.toCytoscapeNode(),
      load2.toCytoscapeNode(),
      load3.toCytoscapeNode(),
      {
        data: {
          id: 'ab',
          source: 'a',
          target: 'b'
        }
      },
      {
        data: {
          id: 'ac',
          source: 'a',
          target: 'c'
        }
      },
      {
        data: {
          id: 'bd',
          source: 'b',
          target: 'd'
        }
      },      
      {
        data: {
          id: 'be',
          source: 'b',
          target: 'e'
        }
      },
    ],

    style: [
      {
        selector: 'node',
        style: {
          'background-color': function(node) {
            const component = Component.fromCytoscapeNode(node);
            return component.category === 'supply' ? '#e74c3c' : '#4a90e2';
          },
          'label': function(node) {
            const component = Component.fromCytoscapeNode(node);
            return component.getDisplayLabel();
          },
          'text-valign': 'center',
          'text-halign': 'center',
          'color': 'white',
          'font-size': '12px',
          'width': '150',
          'height': '100',
          'shape': 'rectangle',
          'border-width': 2,
          'border-color': '#2c5aa0',
          'text-wrap': 'wrap',
          'text-max-width': '80px'
        }
      },
      {
        selector: 'node.connecting',
        style: {
          'border-color': '#f39c12',
          'border-width': 4
        }
      },
      {
        selector: 'node.selected',
        style: {
          'border-color': '#27ae60',
          'border-width': 4
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#666',
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'target-arrow-color': '#666',
          'target-arrow-size': 10
        }
      }
    ],

    layout: {
      'name': 'breadthfirst',
      'roots': '[id = "a"]'
    }
  });

  // Initialize node manager
  nodeManager = new ComponentManager(cy);

  // Calculate initial currents
  calculatePowerAnalysis();

  // Button event listeners
  addNodeBtn.addEventListener('click', () => {
    setMode(currentMode === 'add-node' ? 'normal' : 'add-node');
  });

  connectModeBtn.addEventListener('click', () => {
    setMode(currentMode === 'connect' ? 'normal' : 'connect');
  });

  deleteModeBtn.addEventListener('click', () => {
    setMode(currentMode === 'delete' ? 'normal' : 'delete');
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all nodes and edges?')) {
      cy.elements().remove();
      nodeCounter = 0;
      setMode('normal');
    }
  });

  layoutBtn.addEventListener('click', () => {
    cy.layout({
      name: 'breadthfirst'
    }).run();
  });

  // Apply changes button listener
  applyChangesBtn.addEventListener('click', saveNodeProperties);

  // Clear selection button listener
  clearSelectionBtn.addEventListener('click', clearNodeSelection);

  // Category choice listeners
  categoryChoice1.addEventListener('change', updateFormVisibility);
  categoryChoice2.addEventListener('change', updateFormVisibility);

  // Canvas click handler
  cy.on('tap', function(evt) {
    if (currentMode === 'add-node' && evt.target === cy) {
      const pos = evt.position;
      const newComponent = ComponentFactory.createDefaultNode(++nodeCounter);
      
      const cyNode = nodeManager.addNode(newComponent, pos);
      
      // Immediately select and open property form for new node
      setTimeout(() => {
        selectNode(cyNode);
        openPropertyForm();
      }, 100);
    }
  });

  // Node interactions
  cy.on('tap', 'node', function(evt) {
    const node = evt.target;
    
    if (currentMode === 'connect') {
      if (!connectingFrom) {
        connectingFrom = node;
        node.addClass('connecting');
        showConnectionHint(true);
      } else if (connectingFrom.id() !== node.id()) {
        // Get components to check their types
        const sourceComponent = Component.fromCytoscapeNode(connectingFrom);
        const targetComponent = Component.fromCytoscapeNode(node);
        
        // Determine correct connection direction
        let actualSource, actualTarget;
        
        if (sourceComponent instanceof Supply && targetComponent instanceof Load) {
          // Supply to Load - correct direction
          actualSource = connectingFrom;
          actualTarget = node;
        } else if (sourceComponent instanceof Load && targetComponent instanceof Supply) {
          // Load to Supply - reverse the connection
          actualSource = node;
          actualTarget = connectingFrom;
          alert('Connection reversed: Supplies must connect TO loads, not from them.');
        } else if (sourceComponent instanceof Supply && targetComponent instanceof Supply) {
          // Supply to Supply - allowed (for cascaded regulators)
          actualSource = connectingFrom;
          actualTarget = node;
        } else if (sourceComponent instanceof Load && targetComponent instanceof Load) {
          // Load to Load - not allowed
          alert('Cannot connect load to load. Loads must be connected from supplies.');
          connectingFrom.removeClass('connecting');
          connectingFrom = null;
          showConnectionHint(false);
          return;
        }
        
        const edgeId = actualSource.id() + '_to_' + actualTarget.id();
        
        // Check if connection already exists
        if (cy.getElementById(edgeId).length === 0) {
          cy.add({
            data: {
              id: edgeId,
              source: actualSource.id(),
              target: actualTarget.id()
            }
          });
          
          // Show feedback about the connection
          const sourceComp = Component.fromCytoscapeNode(actualSource);
          const targetComp = Component.fromCytoscapeNode(actualTarget);
          console.log(`Connected: ${sourceComp.label} → ${targetComp.label}`);
        } else {
          alert('Connection already exists between these nodes.');
        }
        
        connectingFrom.removeClass('connecting');
        connectingFrom = null;
        showConnectionHint(false);
        
        // Automatically calculate currents after connecting nodes
        calculatePowerAnalysis();
      } else {
        connectingFrom.removeClass('connecting');
        connectingFrom = null;
        showConnectionHint(false);
      }
    } else if (currentMode === 'delete') {
      if (confirm('Delete this node and all its connections?')) {
        node.remove();
        calculatePowerAnalysis();
      }
    } else if (currentMode === 'normal') {
      // Select node for property editing
      selectNode(node);
    }
  });

  // Right-click to edit properties
  cy.on('cxttap', 'node', function(evt) {
    evt.preventDefault();
    if (currentMode === 'normal') {
      contextMenuTarget = evt.target;
      contextMenuType = 'node';
      const pos = evt.position;
      contextMenu.style.left = pos.x + 'px';
      contextMenu.style.top = pos.y + 'px';
      contextMenu.style.display = 'block';
    }
  });

  // Right-click to show context menu for edges
  cy.on('cxttap', 'edge', function(evt) {
    evt.preventDefault();
    showContextMenu(evt.originalEvent, evt.target, 'edge');
  });

  // Edge click handler
  cy.on('tap', 'edge', function(evt) {
    if (currentMode === 'delete') {
      if (confirm('Delete this connection?')) {
        evt.target.remove();
        calculatePowerAnalysis();
      }
    }
  });

  // Context menu event listeners
  contextEdit.addEventListener('click', () => {
    if (contextMenuTarget && contextMenuType === 'node') {
      selectNode(contextMenuTarget);
      openPropertyForm();
    }
    hideContextMenu();
  });

  contextDelete.addEventListener('click', () => {
    if (contextMenuTarget) {
      let confirmMessage;
      if (contextMenuType === 'edge') {
        confirmMessage = 'Delete this connection?';
      } else {
        confirmMessage = 'Delete this node and all its connections?';
      }
      
      if (confirm(confirmMessage)) {
        contextMenuTarget.remove();
        calculatePowerAnalysis();
      }
    }
    hideContextMenu();
  });

  // Hide context menu when clicking elsewhere
  document.addEventListener('click', (event) => {
    if (!contextMenu.contains(event.target)) {
      hideContextMenu();
    }
  });

  // Prevent context menu on canvas
  document.getElementById('cy').addEventListener('contextmenu', function(e) {
    e.preventDefault();
  });
  
  // New button event listeners
  saveURLBtn.addEventListener('click', saveToURL);
  loadURLBtn.addEventListener('click', loadFromURL);
  copyURLBtn.addEventListener('click', copyURLToClipboard);
  
  // Try to load from URL on page load
  if (!loadFromURL()) {
    // If no URL data, show default message
    document.getElementById('status-text').textContent = 'Ready - Click a mode button to get started';
  }
  
  // Setup auto-save functionality
  setupAutoSave();
});

// Mode switching functions
function setMode(mode) {
  [addNodeBtn, connectModeBtn, deleteModeBtn].forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (connectingFrom) {
    connectingFrom.removeClass('connecting');
    connectingFrom = null;
  }
  
  currentMode = mode;
  
  // Update status bar instead of modal
  const statusText = document.getElementById('status-text');
  
  if (mode === 'add-node') {
    addNodeBtn.classList.add('active');
    statusText.textContent = 'Add Node Mode: Click anywhere on the canvas to add a new component';
  } else if (mode === 'connect') {
    connectModeBtn.classList.add('active');
    statusText.textContent = 'Connect Mode: Click two nodes to connect them (Supplies → Loads ✓, Supplies → Supplies ✓, Loads → Loads ✗)';
  } else if (mode === 'delete') {
    deleteModeBtn.classList.add('active');
    statusText.textContent = 'Delete Mode: Click any node or edge to delete it';
  } else {
    statusText.textContent = 'Normal Mode: Click nodes to edit properties, drag to move';
  }
  
  const container = document.getElementById('cy');
  container.style.cursor = mode === 'add-node' ? 'crosshair' : 
                          mode === 'delete' ? 'not-allowed' : 'default';
}

// Add this function after the setMode function
function showConnectionHint(show = false) {
  let hintDiv = document.getElementById('connection-hint');
  
  if (!hintDiv) {
    hintDiv = document.createElement('div');
    hintDiv.id = 'connection-hint';
    hintDiv.className = 'connection-hint';
    hintDiv.innerHTML = `
      <strong>Connection Rules:</strong><br>
      • Supplies → Loads ✓<br>
      • Supplies → Supplies ✓<br>
      • Loads → Loads ✗<br>
      • Click first node, then second node
    `;
    document.body.appendChild(hintDiv);
  }
  
  if (show) {
    hintDiv.classList.add('active');
  } else {
    hintDiv.classList.remove('active');
  }
}

// Node selection functions
function selectNode(node) {
  // Remove previous selection
  if (selectedNode) {
    selectedNode.removeClass('selected');
  }
  
  // Select new node
  selectedNode = node;
  node.addClass('selected');
  
  // Show property form
  openPropertyForm();
}

function clearNodeSelection() {
  if (selectedNode) {
    selectedNode.removeClass('selected');
    selectedNode = null;
  }
  noSelectionDiv.style.display = 'block';
  propertyForm.style.display = 'none';
}

function openPropertyForm() {
  if (!selectedNode) {
    noSelectionDiv.style.display = 'block';
    propertyForm.style.display = 'none';
    return;
  }
  
  noSelectionDiv.style.display = 'none';
  propertyForm.style.display = 'block';
  
  const component = Component.fromCytoscapeNode(selectedNode);
  
  // Set form values
  propName.value = component.label || '';
  
  // Set value based on component type
  if (component instanceof Supply) {
    propVoltage.value = component.getVoltage() || '';
    propEfficiency.value = component.getEfficiency() * 100 || '';
    categoryChoice1.checked = true;
    supplyOptions.style.display = 'block';
    loadOptions.style.display = 'none';
    regulatorOptions.style.display = 'block';
    
    // Set regulator type
    if (component.getRegulatorType() === 'linear') {
      regulatorLinear.checked = true;
      regulatorSwitching.checked = false;
    } else {
      regulatorLinear.checked = false;
      regulatorSwitching.checked = true;
    }
  } else if (component instanceof Load) {
    propLoad.value = component.getLoad() || '';
    categoryChoice2.checked = true;
    supplyOptions.style.display = 'none';
    loadOptions.style.display = 'block';
    regulatorOptions.style.display = 'none';
  }
  
  // Update component info display
  componentInfo.textContent = `Editing: ${component.label} (${component.constructor.name})`;
}

function saveNodeProperties() {
  if (!selectedNode) return;
  
  const name = propName.value;
  const category = document.querySelector('input[name="category"]:checked')?.value || 'load';
  
  // Get values based on category
  let voltage = 0;
  let load = 0;
  let efficiency = 0;
  let regulatorType = 'linear';
  
  if (category === 'supply') {
    voltage = parseFloat(propVoltage.value) || 0;
    efficiency = parseFloat(propEfficiency.value) || 0;
    regulatorType = regulatorSwitching.checked ? 'switching' : 'linear';
  } else {
    load = parseFloat(propLoad.value) || 0;
  }
  
  // Create new component based on category
  let component;
  if (category === 'supply') {
    component = new Supply(selectedNode.id(), name);
    component.setVoltage(voltage);
    component.setEfficiency(efficiency / 100);
    component.setRegulatorType(regulatorType);
  } else {
    component = new Load(selectedNode.id(), name);
    component.setLoad(load);
  }
  
  // Update the Cytoscape node
  nodeManager.updateNode(component);
  
  // Trigger recalculation
  setTimeout(() => {
    calculatePowerAnalysis();
  }, 10);
  
  // Refresh form to show updated values
  openPropertyForm();
}

function updateFormVisibility() {
  const isSupply = categoryChoice1.checked;
  
  if (isSupply) {
    supplyOptions.style.display = 'block';
    loadOptions.style.display = 'none';
    regulatorOptions.classList.add('active');
  } else {
    supplyOptions.style.display = 'none';
    loadOptions.style.display = 'block';
    regulatorOptions.classList.remove('active');
  }
}

// Simplified power analysis function
function calculatePowerAnalysis() {
  // Clear previous calculations
  nodeManager.clearAllCalculations();
  
  // Calculate in proper order: loads first, then supplies from leaves to roots
  calculateLoadsFirst();
  calculateSuppliesBottomUp();
}

// Simplified power calculation functions
function calculateLoadsFirst() {
  // Calculate all loads first
  cy.nodes().forEach(cyNode => {
    const component = Component.fromCytoscapeNode(cyNode);
    if (component instanceof Load) {
      if (component.calculatePower(cy)) {
        nodeManager.updateNode(component);
      }
    }
  });
}

function calculateSuppliesBottomUp() {
  // Get all supply nodes and sort them by their distance from root
  const supplyNodes = cy.nodes().filter(node => {
    const component = Component.fromCytoscapeNode(node);
    return component instanceof Supply;
  });
  
  // Sort supplies by depth (leaf supplies first, root supplies last)
  const sortedSupplies = supplyNodes.sort((a, b) => {
    const depthA = getNodeDepthFromRoot(a);
    const depthB = getNodeDepthFromRoot(b);
    return depthB - depthA; // Higher depth first (leaves before roots)
  });
  
  // Calculate each supply in order
  sortedSupplies.forEach(cyNode => {
    const component = Component.fromCytoscapeNode(cyNode);
    if (component.calculatePower(cy)) {
      nodeManager.updateNode(component);
    }
  });
}

function getNodeDepthFromRoot(node) {
  // Find the shortest path to any root node (node with no incoming edges)
  const visited = new Set();
  const queue = [{node: node, depth: 0}];
  
  while (queue.length > 0) {
    const {node: currentNode, depth} = queue.shift();
    
    if (visited.has(currentNode.id())) continue;
    visited.add(currentNode.id());
    
    const incomingEdges = currentNode.incomers('edge');
    if (incomingEdges.length === 0) {
      // This is a root node
      return depth;
    }
    
    // Add parent nodes to queue
    incomingEdges.forEach(edge => {
      const parentNode = edge.source();
      if (!visited.has(parentNode.id())) {
        queue.push({node: parentNode, depth: depth + 1});
      }
    });
  }
  
  return 0; // Fallback for isolated nodes
}

// Simplified component manager
class ComponentManager {
  constructor(cy) {
    this.cy = cy;
  }

  addNode(component, position = null) {
    const nodeData = component.toCytoscapeNode();
    if (position) {
      nodeData.position = position;
    }
    return this.cy.add(nodeData);
  }

  updateNode(component) {
    const cyNode = this.cy.getElementById(component.id);
    if (cyNode.length > 0) {
      cyNode.data(component.toCytoscapeNode().data);
      // Force a style update to refresh the label
      cyNode.style();
    }
  }

  clearAllCalculations() {
    this.cy.nodes().forEach(cyNode => {
      const component = Component.fromCytoscapeNode(cyNode);
      component.clearCalculations();
      this.updateNode(component);
    });
  }
}

// Context menu functions
function showContextMenu(event, target, type) {
  contextMenuTarget = target;
  contextMenuType = type;
  
  // Update menu items based on type
  if (type === 'edge') {
    contextEdit.style.display = 'none'; // Hide edit for edges
    contextDelete.textContent = 'Delete Connection';
  } else {
    contextEdit.style.display = 'block'; // Show edit for nodes
    contextDelete.textContent = 'Delete Node';
  }
  
  contextMenu.style.display = 'block';
  contextMenu.style.left = event.pageX + 'px';
  contextMenu.style.top = event.pageY + 'px';
}

function hideContextMenu() {
  contextMenu.style.display = 'none';
  contextMenuTarget = null;
  contextMenuType = null;
}

// Add these functions after the existing functions

function saveToURL() {
  const graphData = {
    nodes: [],
    edges: []
  };

  // Collect all nodes
  cy.nodes().forEach(node => {
    const data = node.data();
    const position = node.position();
    const component = Component.fromCytoscapeNode(node);
    
    const nodeData = {
      id: data.id,
      label: data.label,
      category: data.category,
      power: data.power,
      position: position
    };
    
    // Add component-specific properties based on actual component type
    if (component instanceof Supply) {
      nodeData.voltage = component.getVoltage();
      nodeData.efficiency = component.getEfficiency();
      nodeData.regulator_type = component.getRegulatorType();
    } else if (component instanceof Load) {
      nodeData.load = component.getLoad();
    }
    
    graphData.nodes.push(nodeData);
  });

  // Collect all edges
  cy.edges().forEach(edge => {
    const data = edge.data();
    graphData.edges.push({
      id: data.id,
      source: data.source,
      target: data.target
    });
  });

  // Convert to JSON and then to base64
  const jsonString = JSON.stringify(graphData);
  // debug, print the json string to console
  console.log(jsonString);
  const base64Data = btoa(jsonString);
  
  // Update URL
  const url = new URL(window.location);
  url.searchParams.set('data', base64Data);
  window.history.pushState({}, '', url);
  
  // Update status
  document.getElementById('status-text').textContent = 'Graph saved to URL - you can bookmark or share this link';
  
  return url.toString();
}

function loadFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const base64Data = urlParams.get('data');
  
  if (!base64Data) {
    return false;
  }
  
  try {
    // Decode base64 and parse JSON
    const jsonString = atob(base64Data);
    const graphData = JSON.parse(jsonString);
    
    // debug, print the json string to console
    console.log(graphData);
    
    // Clear existing graph
    cy.elements().remove();
    nodeCounter = 0;
    
    // Add nodes
    graphData.nodes.forEach(nodeData => {
      let component;
      
      // Create the correct component type based on category
      if (nodeData.category === 'supply') {
        component = new Supply(nodeData.id, nodeData.label || `Supply ${nodeData.id}`);
        
        // Set supply-specific properties
        if (nodeData.voltage !== undefined) {
          component.setVoltage(nodeData.voltage);
        }
        if (nodeData.efficiency !== undefined) {
          component.setEfficiency(nodeData.efficiency);
        }
        if (nodeData.regulator_type !== undefined) {
          component.setRegulatorType(nodeData.regulator_type);
        }
      } else {
        component = new Load(nodeData.id, nodeData.label || `Load ${nodeData.id}`);
        
        // Set load-specific properties
        if (nodeData.load !== undefined) {
          component.setLoad(nodeData.load);
        }
      }
      
      // Set common properties
      if (nodeData.power !== undefined) {
        component.power_dissipation = nodeData.power;
      }
      
      // Set position
      if (nodeData.position) {
        component.position = nodeData.position;
      }
      
      nodeManager.addNode(component);
      
      // Update counter to avoid ID conflicts
      const numericId = parseInt(nodeData.id.replace('node', ''));
      if (!isNaN(numericId) && numericId >= nodeCounter) {
        nodeCounter = numericId + 1;
      }
    });
    
    // Add edges
    graphData.edges.forEach(edgeData => {
      cy.add({
        group: 'edges',
        data: {
          id: edgeData.id,
          source: edgeData.source,
          target: edgeData.target
        }
      });
    });
    
    // Run layout
    cy.layout({
      name: 'breadthfirst',
      directed: true,
      roots: cy.nodes().filter(node => node.indegree() === 0),
      padding: 50,
      spacingFactor: 1.5
    }).run();
    
    // Recalculate power analysis after loading
    setTimeout(() => {
      calculatePowerAnalysis();
    }, 100);
    
    document.getElementById('status-text').textContent = 'Graph loaded from URL successfully';
    return true;
    
  } catch (error) {
    console.error('Error loading from URL:', error);
    document.getElementById('status-text').textContent = 'Error loading graph from URL';
    return false;
  }
}

function copyURLToClipboard() {
  const url = saveToURL();
  navigator.clipboard.writeText(url).then(() => {
    document.getElementById('status-text').textContent = 'URL copied to clipboard!';
  }).catch(() => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    document.getElementById('status-text').textContent = 'URL copied to clipboard!';
  });
}

// Auto-save to URL whenever the graph changes
function autoSaveToURL() {
  // Debounce the save operation to avoid too frequent updates
  clearTimeout(window.autoSaveTimeout);
  window.autoSaveTimeout = setTimeout(() => {
    if (cy.nodes().length > 0) {
      saveToURL();
    }
  }, 1000); // Save 1 second after last change
}

// Add auto-save listeners (add these after cy is initialized)
function setupAutoSave() {
  cy.on('add remove', autoSaveToURL);
  cy.on('position', autoSaveToURL);
  cy.on('data', autoSaveToURL);
}
