// Global variables for graph data and algorithm state
let graphData = {
    nodes: new Set(),
    edges: [],
    costs: {},
    heuristics: {},
    startNode: '',
    targetNode: '',
    isDirected: false // Added for undirected graph handling
};

let currentAlgorithm = 'dfs';
let graphVisualization = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    
    // Set up main graph SVG
    const mainSvg = d3.select("#main-graph-svg");
    mainSvg.attr("width", 800).attr("height", 500);
    
    // Initialize with default graph
    parseTextInput();
    
    // Set up event listeners
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    // Node selection dropdowns
    document.getElementById('start-node').addEventListener('change', function() {
        graphData.startNode = this.value;
    });
    
    document.getElementById('target-node').addEventListener('change', function() {
        graphData.targetNode = this.value;
    });
    
    // Cost and heuristic inputs
    document.getElementById('cost-input').addEventListener('input', function() {
        parseCosts();
    });
    
    document.getElementById('heuristic-input').addEventListener('input', function() {
        parseHeuristics();
    });
}

// Algorithm selection
function selectAlgorithm(algorithm) {
    currentAlgorithm = algorithm;
    
    // Update active button
    document.querySelectorAll('.algo-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update algorithm type display
    document.getElementById('algorithm-type').textContent = `Algorithm: ${getAlgorithmName(algorithm)}`;
    
    // Show/hide relevant input fields
    const costInputs = document.getElementById('cost-inputs');
    const heuristicInputs = document.getElementById('heuristic-inputs');
    const depthLimitInput = document.getElementById('depth-limit-input');
    const costPanel = document.getElementById('cost-panel');
    
    // Reset all to hidden
    costInputs.style.display = 'none';
    heuristicInputs.style.display = 'none';
    depthLimitInput.style.display = 'none';
    costPanel.style.display = 'none';
    
    // Show relevant inputs based on algorithm
    switch(algorithm) {
        case 'ucs':
        case 'astar':
            costInputs.style.display = 'flex';
            costPanel.style.display = 'block';
            break;
        case 'best':
        case 'astar':
            heuristicInputs.style.display = 'flex';
            break;
        case 'dls':
            depthLimitInput.style.display = 'flex';
            break;
    }
    
    // Update queue/stack title
    const title = document.getElementById('queue-stack-title');
    if (algorithm === 'bfs' || algorithm === 'ucs' || algorithm === 'best' || algorithm === 'astar') {
        title.textContent = 'Queue';
    } else {
        title.textContent = 'Stack';
    }
    
    // Re-render graph with new algorithm
    updateGraphVisualization();
}

// Get algorithm display name
function getAlgorithmName(algorithm) {
    const names = {
        'dfs': 'Depth First Search',
        'bfs': 'Breadth First Search',
        'ucs': 'Uniform Cost Search',
        'dls': 'Depth Limited Search',
        'ids': 'Iterative Deepening DFS',
        'best': 'Best First Search',
        'astar': 'A* Search'
    };
    return names[algorithm] || algorithm.toUpperCase();
}

// Tab switching functionality
function showTab(tabName) {
    // Hide all input methods
    document.querySelectorAll('.input-method').forEach(method => {
        method.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected method and activate tab button
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Text Input Method
function parseTextInput() {
    const graphInput = document.getElementById('graph-input').value.trim();
    if (!graphInput) return;
    
    // Clear existing data
    graphData.nodes.clear();
    graphData.edges = [];
    graphData.costs = {};
    
    // Parse edges
    const edgeStrings = graphInput.split(',').map(s => s.trim());
    for (const edgeStr of edgeStrings) {
        if (edgeStr.includes('-')) {
            const [from, to] = edgeStr.split('-').map(s => s.trim());
            if (from && to) {
                graphData.nodes.add(from);
                graphData.nodes.add(to);
                graphData.edges.push({from, to});
            }
        }
    }
    
    updateGraphVisualization();
    updateNodeSelects();
}

// Interactive Input Method
function addNode() {
    const nodeName = document.getElementById('node-name').value.trim();
    if (nodeName && !graphData.nodes.has(nodeName)) {
        graphData.nodes.add(nodeName);
        updateGraphVisualization();
        updateNodeSelects();
        document.getElementById('node-name').value = '';
    }
}

function addEdge() {
    const fromNode = document.getElementById('from-node').value;
    const toNode = document.getElementById('to-node').value;
    
    if (fromNode && toNode && fromNode !== toNode) {
        // Check if edge already exists
        const edgeExists = graphData.edges.some(edge => 
            edge.from === fromNode && edge.to === toNode
        );
        
        if (!edgeExists) {
            graphData.edges.push({from: fromNode, to: toNode});
            
            // For undirected graphs, add reverse edge automatically
            if (!graphData.isDirected) {
                const reverseExists = graphData.edges.some(edge => 
                    edge.from === toNode && edge.to === fromNode
                );
                if (!reverseExists) {
                    graphData.edges.push({from: toNode, to: fromNode});
                }
            }
            
            updateGraphVisualization();
        }
    }
}

function clearGraph() {
    graphData.nodes.clear();
    graphData.edges = [];
    graphData.costs = {};
    graphData.heuristics = {};
    graphData.startNode = '';
    graphData.targetNode = '';
    graphData.isDirected = false;
    
    // Reset graph type selector
    document.getElementById('graph-type-select').value = 'undirected';
    document.getElementById('graph-type').textContent = 'Type: Undirected';
    
    updateGraphVisualization();
    updateNodeSelects();
}

// File Upload Method
function parseFileInput() {
    const fileInput = document.getElementById('graph-file');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const lines = content.split('\n').filter(line => line.trim());
        
        // Clear existing data
        graphData.nodes.clear();
        graphData.edges = [];
        graphData.costs = {};
        
        // Determine file format and parse
        const firstLine = lines[0];
        if (firstLine.includes(',')) {
            // CSV format
            for (const line of lines) {
                const [from, to] = line.split(',').map(s => s.trim());
                if (from && to) {
                    graphData.nodes.add(from);
                    graphData.nodes.add(to);
                    graphData.edges.push({from, to});
                }
            }
        } else if (firstLine.includes('-')) {
            // TXT format with dashes
            for (const line of lines) {
                if (line.includes('-')) {
                    const [from, to] = line.split('-').map(s => s.trim());
                    if (from && to) {
                        graphData.nodes.add(from);
                        graphData.nodes.add(to);
                        graphData.edges.push({from, to});
                    }
                }
            }
        }
        
        updateGraphVisualization();
        updateNodeSelects();
    };
    
    reader.readAsText(file);
}

// Parse costs for weighted algorithms
function parseCosts() {
    const costInput = document.getElementById('cost-input').value.trim();
    graphData.costs = {};
    
    if (costInput) {
        const costStrings = costInput.split(',').map(s => s.trim());
        for (const costStr of costStrings) {
            if (costStr.includes(':')) {
                const [edge, cost] = costStr.split(':').map(s => s.trim());
                const numCost = parseFloat(cost);
                if (!isNaN(numCost)) {
                    graphData.costs[edge] = numCost;
                }
            }
        }
    }
}

// Parse heuristics for informed search
function parseHeuristics() {
    const heuristicInput = document.getElementById('heuristic-input').value.trim();
    graphData.heuristics = {};
    
    if (heuristicInput) {
        const heuristicStrings = heuristicInput.split(',').map(s => s.trim());
        for (const heuristicStr of heuristicStrings) {
            if (heuristicStr.includes(':')) {
                const [node, heuristic] = heuristicStr.split(':').map(s => s.trim());
                const numHeuristic = parseFloat(heuristic);
                if (!isNaN(numHeuristic)) {
                    graphData.heuristics[node] = numHeuristic;
                }
            }
        }
    }
}

// Update graph visualization with consistent force-directed layout
function updateGraphVisualization() {
    const svg = d3.select("#main-graph-svg");
    svg.selectAll("*").remove();
    
    if (graphData.nodes.size === 0) {
        document.getElementById('node-count').textContent = 'Nodes: 0';
        document.getElementById('edge-count').textContent = 'Edges: 0';
        return;
    }
    
    // Create force simulation for layout
    const nodes = Array.from(graphData.nodes).map(id => ({id}));
    const links = graphData.edges.map(edge => ({
        source: edge.from,
        target: edge.to,
        cost: graphData.costs[`${edge.from}-${edge.to}`] || graphData.costs[`${edge.to}-${edge.from}`] || 1
    }));
    
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(400, 250))
        .force("collision", d3.forceCollide().radius(30));
    
    // Draw links
    const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "#999")
        .attr("stroke-width", 2);
    
    // Add arrows for directed edges
    if (graphData.isDirected) {
        // Define arrow marker
        svg.append("defs").append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 25)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#999");
        
        // Add arrow marker to directed edges
        link.attr("marker-end", "url(#arrowhead)");
    }
    
    // Add cost labels to links if available
    const linkLabels = svg.append("g")
        .selectAll("text")
        .data(links.filter(d => d.cost !== 1))
        .join("text")
        .attr("font-size", "12px")
        .attr("fill", "#666")
        .attr("text-anchor", "middle");
    
    // Draw nodes
    const node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 20)
        .attr("fill", "#69b3a2")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("class", d => `node-${d.id}`);
    
    // Add node labels
    const label = svg.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .text(d => d.id)
        .attr("font-size", "14px")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .attr("pointer-events", "none");
    
    // Add heuristic labels if available
    const heuristicLabels = svg.append("g")
        .selectAll("text")
        .data(nodes.filter(d => graphData.heuristics[d.id]))
        .join("text")
        .text(d => `h=${graphData.heuristics[d.id]}`)
        .attr("font-size", "10px")
        .attr("fill", "#e74c3c")
        .attr("text-anchor", "middle")
        .attr("dy", "25");
    
    // Update positions on simulation tick
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        
        linkLabels
            .attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2)
            .text(d => d.cost);
        
        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
        
        label
            .attr("x", d => d.x)
            .attr("y", d => d.y);
        
        heuristicLabels
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });
    
    // Store visualization reference
    graphVisualization = {simulation, nodes, links, node, link, label};
    
    // Update info
    document.getElementById('node-count').textContent = `Nodes: ${graphData.nodes.size}`;
    document.getElementById('edge-count').textContent = `Edges: ${graphData.edges.length}`;
}

// Update node selection dropdowns
function updateNodeSelects() {
    const nodeArray = Array.from(graphData.nodes).sort();
    const startSelect = document.getElementById('start-node');
    const targetSelect = document.getElementById('target-node');
    const fromSelect = document.getElementById('from-node');
    const toSelect = document.getElementById('to-node');
    
    // Clear existing options
    startSelect.innerHTML = '<option value="">Select start node</option>';
    targetSelect.innerHTML = '<option value="">Select target node</option>';
    fromSelect.innerHTML = '<option value="">Select from node</option>';
    toSelect.innerHTML = '<option value="">Select to node</option>';
    
    // Add options
    nodeArray.forEach(node => {
        startSelect.innerHTML += `<option value="${node}">${node}</option>`;
        targetSelect.innerHTML += `<option value="${node}">${node}</option>`;
        fromSelect.innerHTML += `<option value="${node}">${node}</option>`;
        toSelect.innerHTML += `<option value="${node}">${node}</option>`;
    });
    
    // Set default values if available
    if (nodeArray.length > 0) {
        if (!graphData.startNode || !graphData.nodes.has(graphData.startNode)) {
            graphData.startNode = nodeArray[0];
            startSelect.value = graphData.startNode;
        }
        if (!graphData.targetNode || !graphData.nodes.has(graphData.targetNode)) {
            graphData.targetNode = nodeArray[nodeArray.length - 1];
            targetSelect.value = graphData.targetNode;
        }
    }
}

// Main visualization function
function runVisualization() {
    console.log('runVisualization called');
    console.log('Algorithm:', currentAlgorithm);
    console.log('Graph data:', graphData);
    
    if (graphData.nodes.size === 0) {
        alert('Please add some nodes to the graph first!');
        return;
    }
    
    if (!graphData.startNode || !graphData.targetNode) {
        alert('Please select both start and target nodes!');
        return;
    }
    
    // Parse costs and heuristics if needed
    parseCosts();
    parseHeuristics();
    
    // Clear previous execution
    const logList = document.getElementById('log-list');
    logList.innerHTML = '';
    
    // Reset graph colors
    if (graphVisualization) {
        graphVisualization.node.attr("fill", "#69b3a2");
    }
    
    // Prepare data for backend
    const requestData = {
        algorithm: currentAlgorithm,
        graph_input: graphData.edges.map(edge => `${edge.from}-${edge.to}`).join(','),
        start_node: graphData.startNode,
        target_node: graphData.targetNode,
        costs: graphData.costs,
        heuristics: graphData.heuristics,
        is_directed: graphData.isDirected
    };
    
    if (currentAlgorithm === 'dls') {
        requestData.depth_limit = parseInt(document.getElementById('depth-limit').value);
    }
    
    console.log('Sending request to backend:', requestData);
    
    // Run algorithm on backend
    fetch('/run_algorithm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    }).then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Backend response:', data);
        animateSteps(data.steps, data.path, data.total_cost);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error running algorithm. Please check your input and try again.');
    });
}

// Animate algorithm steps
async function animateSteps(steps, path, totalCost) {
    const logList = document.getElementById('log-list');
    const queueStackDisplay = document.getElementById('queue-stack-display');
    const pathDisplay = document.getElementById('path-display');
    const costDisplay = document.getElementById('cost-display');
    const visitedDisplay = document.getElementById('visited-display');
    
    for (const step of steps) {
        const logItem = document.createElement('li');
        logItem.textContent = step.action;
        logList.appendChild(logItem);
        logList.scrollTop = logList.scrollHeight;
        
        // Update displays
        if (step.queue_stack) {
            queueStackDisplay.innerHTML = step.queue_stack.join(' → ');
        } else if (step.stack) {
            queueStackDisplay.innerHTML = step.stack.join(' → ');
        }
        
        if (step.path) {
            pathDisplay.innerHTML = step.path.join(' → ');
        }
        
        if (step.cost !== undefined) {
            costDisplay.innerHTML = step.cost.toFixed(2);
        }
        
        // Update visited order display
        if (step.visited) {
            visitedDisplay.innerHTML = step.visited.join(' → ');
        }
        
        // Update node colors
        if (graphVisualization) {
            graphVisualization.node.attr("fill", d => {
                if (step.current_node && d.id === step.current_node) {
                    return "#ff6b6b"; // Currently processing
                }
                if (step.queue_stack && step.queue_stack.includes(d.id)) {
                    return "#ffa726"; // In queue/stack
                }
                if (step.stack && step.stack.includes(d.id)) {
                    return "#ffa726"; // In stack
                }
                if (step.visited && step.visited.includes(d.id)) {
                    return "#66bb6a"; // Visited
                }
                if (path && path.includes(d.id)) {
                    return "#ab47bc"; // Final path
                }
                return "#69b3a2"; // Unvisited
            });
            
            // Enlarge current node
            if (step.current_node) {
                graphVisualization.node.filter(d => d.id === step.current_node)
                    .attr("r", 25);
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Reset node sizes
        if (graphVisualization) {
            graphVisualization.node.attr("r", 20);
        }
    }
    
    // Final result
    if (path) {
        logList.innerHTML += `<li style="color: #ab47bc; font-weight: bold;">Target found! Path: ${path.join(' → ')}</li>`;
        if (totalCost !== undefined) {
            logList.innerHTML += `<li style="color: #ab47bc; font-weight: bold;">Total Cost: ${totalCost.toFixed(2)}</li>`;
        }
    } else {
        logList.innerHTML += `<li style="color: #e74c3c; font-weight: bold;"> Target not found.</li>`;
    }
}