// DOM Elements
const graphContainer = document.getElementById('graphContainer');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const generateGraphBtn = document.getElementById('generateGraphBtn');
const nodeCountSlider = document.getElementById('nodeCount');
const nodeCountValue = document.getElementById('nodeCountValue');
const animationSpeedSlider = document.getElementById('animationSpeed');
const totalEdgesElement = document.getElementById('totalEdges');
const mstWeightElement = document.getElementById('mstWeight');
const stepCountElement = document.getElementById('stepCount');
const currentStepElement = document.getElementById('currentStep');

// Graph state
let nodes = [];
let edges = [];
let mst = [];
let visitedNodes = new Set();
let animationQueue = [];
let isRunning = false;
let stepCount = 0;
let totalMSTWeight = 0;

// Initialize the graph
function initializeGraph() {
    // Clear previous graph
    graphContainer.innerHTML = '';
    nodes = [];
    edges = [];
    mst = [];
    visitedNodes = new Set();
    animationQueue = [];
    isRunning = false;
    stepCount = 0;
    totalMSTWeight = 0;
    
    // Update UI
    stepCountElement.textContent = '0';
    mstWeightElement.textContent = '0';
    currentStepElement.textContent = 'Algorithm not started yet. Click "Start Algorithm" to begin.';
    
    // Get number of nodes from slider
    const nodeCount = parseInt(nodeCountSlider.value);
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
        const node = {
            id: i,
            x: Math.random() * (graphContainer.clientWidth - 60) + 30,
            y: Math.random() * (graphContainer.clientHeight - 60) + 30,
            element: null
        };
        nodes.push(node);
    }
    
    // Create edges (not fully connected, but enough to ensure connectivity)
    // First, ensure the graph is connected by creating a spanning tree
    for (let i = 1; i < nodeCount; i++) {
        const fromNode = nodes[i];
        const toNode = nodes[Math.floor(Math.random() * i)]; // Connect to a random previous node
        const weight = Math.floor(Math.random() * 20) + 1; // Random weight between 1 and 20
        
        edges.push({
            from: fromNode.id,
            to: toNode.id,
            weight: weight,
            element: null
        });
    }
    
    // Add some additional random edges
    const additionalEdges = Math.floor(nodeCount * 1.5);
    for (let i = 0; i < additionalEdges; i++) {
        const fromNode = nodes[Math.floor(Math.random() * nodeCount)];
        const toNode = nodes[Math.floor(Math.random() * nodeCount)];
        
        // Skip if trying to add an edge to itself or if edge already exists
        if (fromNode.id === toNode.id || edgeExists(fromNode.id, toNode.id)) {
            continue;
        }
        
        const weight = Math.floor(Math.random() * 20) + 1;
        edges.push({
            from: fromNode.id,
            to: toNode.id,
            weight: weight,
            element: null
        });
    }
    
    totalEdgesElement.textContent = edges.length;
    
    // Render the graph
    renderGraph();
}

// Check if an edge already exists
function edgeExists(fromId, toId) {
    return edges.some(edge => 
        (edge.from === fromId && edge.to === toId) || 
        (edge.from === toId && edge.to === fromId)
    );
}

// Render the graph on the canvas
function renderGraph() {
    // Clear the container
    graphContainer.innerHTML = '';
    
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    graphContainer.appendChild(svg);
    
    // Create edges
    edges.forEach(edge => {
        const fromNode = nodes[edge.from];
        const toNode = nodes[edge.to];
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromNode.x);
        line.setAttribute('y1', fromNode.y);
        line.setAttribute('x2', toNode.x);
        line.setAttribute('y2', toNode.y);
        line.setAttribute('stroke', '#CBD5E0');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
        
        // Add weight label
        const textX = (fromNode.x + toNode.x) / 2;
        const textY = (fromNode.y + toNode.y) / 2;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', textX);
        text.setAttribute('y', textY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', '#4A5568');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('stroke', 'white');
        text.setAttribute('stroke-width', '0.5');
        text.setAttribute('paint-order', 'stroke');
        text.textContent = edge.weight;
        svg.appendChild(text);
        
        edge.element = line;
    });
    
    // Create nodes
    nodes.forEach(node => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', 15);
        circle.setAttribute('fill', '#3B82F6');
        circle.setAttribute('class', 'node');
        svg.appendChild(circle);
        
        // Add node label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x);
        text.setAttribute('y', node.y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', 'bold');
        text.textContent = node.id;
        svg.appendChild(text);
        
        node.element = circle;
    });
}

// Run Prim's algorithm
async function runPrimsAlgorithm() {
    if (isRunning) return;
    isRunning = true;
    
    // Reset state
    mst = [];
    visitedNodes = new Set();
    animationQueue = [];
    stepCount = 0;
    totalMSTWeight = 0;
    
    stepCountElement.textContent = '0';
    mstWeightElement.textContent = '0';
    
    // Reset node and edge colors
    nodes.forEach(node => {
        node.element.setAttribute('fill', '#3B82F6');
    });
    
    edges.forEach(edge => {
        edge.element.setAttribute('stroke', '#CBD5E0');
        edge.element.setAttribute('stroke-width', '2');
    });
    
    // Start with the first node
    const startNodeId = 0;
    visitedNodes.add(startNodeId);
    
    // Update UI
    updateCurrentStep(`Starting Prim's algorithm from node ${startNodeId}`);
    nodes[startNodeId].element.setAttribute('fill', '#10B981'); // Mark as visited
    
    // Continue until all nodes are visited
    while (visitedNodes.size < nodes.length) {
        stepCount++;
        stepCountElement.textContent = stepCount;
        
        let minEdge = null;
        let minWeight = Infinity;
        
        // Find the minimum weight edge that connects a visited node to an unvisited node
        for (const edge of edges) {
            const fromVisited = visitedNodes.has(edge.from);
            const toVisited = visitedNodes.has(edge.to);
            
            // If one endpoint is visited and the other is not
            if ((fromVisited && !toVisited) || (!fromVisited && toVisited)) {
                if (edge.weight < minWeight) {
                    minWeight = edge.weight;
                    minEdge = edge;
                }
            }
        }
        
        if (!minEdge) {
            updateCurrentStep("No more edges to add. Graph might be disconnected.");
            break;
        }
        
        // Determine which node is being added to the MST
        const newNodeId = visitedNodes.has(minEdge.from) ? minEdge.to : minEdge.from;
        
        // Add the edge to MST
        mst.push(minEdge);
        visitedNodes.add(newNodeId);
        totalMSTWeight += minEdge.weight;
        
        // Update UI
        updateCurrentStep(`Adding edge (${minEdge.from} - ${minEdge.to}) with weight ${minEdge.weight} to MST`);
        mstWeightElement.textContent = totalMSTWeight;
        
        // Highlight the current node being processed
        nodes.forEach(node => {
            if (node.id === newNodeId) {
                node.element.setAttribute('fill', '#EF4444'); // Current node
                node.element.classList.add('highlight');
            }
        });
        
        // Highlight the edge being added to MST
        minEdge.element.setAttribute('stroke', '#10B981');
        minEdge.element.setAttribute('stroke-width', '4');
        
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, getAnimationDelay()));
        
        // Update node color to visited
        nodes[newNodeId].element.setAttribute('fill', '#10B981');
        nodes[newNodeId].element.classList.remove('highlight');
    }
    
    updateCurrentStep(`Prim's algorithm completed. MST weight: ${totalMSTWeight}`);
    isRunning = false;
}

// Get animation delay based on slider value
function getAnimationDelay() {
    const speed = parseInt(animationSpeedSlider.value);
    return 1100 - (speed * 100); // 1000ms to 100ms
}

// Update the current step text
function updateCurrentStep(text) {
    currentStepElement.innerHTML = `<p class="mb-1">${text}</p>` + currentStepElement.innerHTML;
}

// Event listeners
startBtn.addEventListener('click', runPrimsAlgorithm);
resetBtn.addEventListener('click', initializeGraph);
generateGraphBtn.addEventListener('click', initializeGraph);

nodeCountSlider.addEventListener('input', () => {
    nodeCountValue.textContent = nodeCountSlider.value;
});

// Initialize on load
window.addEventListener('load', initializeGraph);

// Handle window resize
window.addEventListener('resize', () => {
    if (!isRunning) {
        initializeGraph();
    }
});