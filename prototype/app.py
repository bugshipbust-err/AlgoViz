from flask import Flask, render_template, request, jsonify
from collections import deque
import heapq
app = Flask(__name__)


# Graph representation and utility functions
def build_graph(edges_str, is_directed=False):
    """Build graph from edge string"""
    graph = {}
    edges = edges_str.split(',')
    for edge in edges:
        if '-' in edge:
            u, v = edge.strip().split('-')
            if u not in graph: graph[u] = []
            if v not in graph: graph[v] = []
            graph[u].append(v)
            if not is_directed:
                graph[v].append(u)  # Undirected graph
    return graph

def build_weighted_graph(edges_str, costs, is_directed=False):
    """Build weighted graph from edge string and costs"""
    graph = {}
    edges = edges_str.split(',')
    for edge in edges:
        if '-' in edge:
            u, v = edge.strip().split('-')
            if u not in graph: graph[u] = []
            if v not in graph: graph[v] = []
            cost = costs.get(f"{u}-{v}", costs.get(f"{v}-{u}", 1))
            graph[u].append((v, cost))
            if not is_directed:
                graph[v].append((u, cost))  # Undirected graph
    return graph

# Search Algorithms Implementation

def depth_first_search(graph, start, target):
    """Depth First Search with visited order tracking"""
    if start not in graph:
        return [], []
    
    visited = set()
    visited_order = []  # Track order of visited nodes
    stack = [start]
    path = []
    steps = []
    
    while stack:
        current = stack.pop()
        
        if current in visited:
            steps.append({
                'action': f"Backtracking from {current} (already visited)",
                'current_node': current,
                'stack': list(stack),
                'path': list(path),
                'visited': visited_order.copy(),
                'backtrack': True
            })
            continue
        
        # Add to visited order when first visiting
        visited_order.append(current)
        visited.add(current)
        
        steps.append({
            'action': f"Popping {current} from stack",
            'current_node': current,
            'stack': list(stack),
            'path': list(path),
            'visited': visited_order.copy(),
            'operation': 'pop'
        })
        
        if current == target:
            path.append(current)
            steps.append({
                'action': f"Target {target} found!",
                'current_node': current,
                'stack': list(stack),
                'path': list(path),
                'visited': visited_order.copy(),
                'target_found': True
            })
            return steps, path
        
        path.append(current)
        
        # Add unvisited neighbors to stack
        neighbors = graph.get(current, [])
        for neighbor in reversed(neighbors):
            if neighbor not in visited:
                stack.append(neighbor)
                steps.append({
                    'action': f"Pushing {neighbor} to stack",
                    'current_node': current,
                    'stack': list(stack),
                    'path': list(path),
                    'visited': visited_order.copy(),
                    'operation': 'push',
                    'pushed_node': neighbor
                })
        
        # Backtrack if no unvisited neighbors
        if not any(n not in visited for n in neighbors):
            steps.append({
                'action': f"Backtracking from {current} (no unvisited neighbors)",
                'current_node': current,
                'stack': list(stack),
                'path': list(path),
                'visited': visited_order.copy(),
                'backtrack': True
            })
            path.pop()
    
    return steps, None

def breadth_first_search(graph, start, target):
    """Breadth First Search with visited order tracking"""
    if start not in graph:
        return [], []
    
    visited = set()
    visited_order = []  # Track order of visited nodes
    queue = deque([start])
    parent = {start: None}
    steps = []
    
    while queue:
        current = queue.popleft()
        
        # Add to visited order when first visiting
        visited_order.append(current)
        visited.add(current)
        
        steps.append({
            'action': f"Dequeuing {current}",
            'current_node': current,
            'queue_stack': list(queue),
            'visited': visited_order.copy(),
            'operation': 'dequeue'
        })
        
        if current == target:
            # Reconstruct path
            path = []
            while current:
                path.append(current)
                current = parent[current]
            path.reverse()
            steps.append({
                'action': f"Target {target} found!",
                'current_node': current,
                'queue_stack': list(queue),
                'path': path,
                'visited': visited_order.copy(),
                'target_found': True
            })
            return steps, path
        
        # Add unvisited neighbors to queue
        neighbors = graph.get(current, [])
        for neighbor in neighbors:
            if neighbor not in visited and neighbor not in queue:
                queue.append(neighbor)
                parent[neighbor] = current
                steps.append({
                    'action': f"Enqueuing {neighbor}",
                    'current_node': current,
                    'queue_stack': list(queue),
                    'visited': visited_order.copy(),
                    'operation': 'enqueue',
                    'pushed_node': neighbor
                })
    
    return steps, None

def uniform_cost_search(graph, start, target):
    """Uniform Cost Search with visited order tracking"""
    if start not in graph:
        return [], [], 0
    
    visited = set()
    visited_order = []  # Track order of visited nodes
    pq = [(0, start, [start])]  # (cost, node, path)
    steps = []
    
    while pq:
        cost, current, path = heapq.heappop(pq)
        
        if current in visited:
            continue
        
        # Add to visited order when first visiting
        visited_order.append(current)
        visited.add(current)
        
        steps.append({
            'action': f"Dequeuing {current} (cost: {cost})",
            'current_node': current,
            'queue_stack': [f"{n}({c})" for c, n, _ in pq],
            'path': path,
            'visited': visited_order.copy(),
            'cost': cost,
            'operation': 'dequeue'
        })
        
        if current == target:
            steps.append({
                'action': f"Target {target} found!",
                'current_node': current,
                'queue_stack': [f"{n}({c})" for c, n, _ in pq],
                'path': path,
                'visited': visited_order.copy(),
                'cost': cost,
                'target_found': True
            })
            return steps, path, cost
        
        # Add neighbors to priority queue
        neighbors = graph.get(current, [])
        for neighbor, edge_cost in neighbors:
            if neighbor not in visited:
                new_cost = cost + edge_cost
                new_path = path + [neighbor]
                heapq.heappush(pq, (new_cost, neighbor, new_path))
                steps.append({
                    'action': f"Enqueuing {neighbor} (cost: {new_cost})",
                    'current_node': current,
                    'queue_stack': [f"{n}({c})" for c, n, _ in pq],
                    'path': path,
                    'visited': visited_order.copy(),
                    'cost': cost,
                    'operation': 'enqueue',
                    'pushed_node': neighbor
                })
    
    return steps, None, None

def depth_limited_search(graph, start, target, limit):
    """Depth Limited Search implementation"""
    def dls_recursive(node, depth, visited, path):
        if depth > limit:
            return None, []
        
        if node == target:
            return path + [node], []
        
        if depth == limit:
            return None, []
        
        visited.add(node)
        steps = [{
            'action': f"Visiting {node} at depth {depth}",
            'current_node': node,
            'path': path + [node],
            'visited': list(visited),
            'depth': depth
        }]
        
        neighbors = graph.get(node, [])
        for neighbor in neighbors:
            if neighbor not in visited:
                result, child_steps = dls_recursive(neighbor, depth + 1, visited, path + [node])
                steps.extend(child_steps)
                if result:
                    return result, steps
        
        return None, steps
    
    visited = set()
    result, steps = dls_recursive(start, 0, visited, [])
    
    if result:
        steps.append({
            'action': f"Target {target} found!",
            'current_node': target,
            'path': result,
            'visited': list(visited),
            'target_found': True
        })
        return steps, result
    else:
        steps.append({
            'action': f"Target not found within depth limit {limit}",
            'current_node': start,
            'path': [],
            'visited': list(visited),
            'target_found': False
        })
        return steps, None

def iterative_deepening_dfs(graph, start, target):
    """Iterative Deepening Depth First Search implementation"""
    max_depth = len(graph)  # Maximum reasonable depth
    all_steps = []
    
    for depth in range(max_depth):
        steps, result = depth_limited_search(graph, start, target, depth)
        all_steps.extend(steps)
        
        if result:
            return all_steps, result
    
    return all_steps, None

def best_first_search(graph, start, target, heuristics):
    """Best First Search implementation"""
    visited = set()
    pq = [(heuristics.get(start, 0), start, [start])]
    steps = []
    
    while pq:
        heuristic_val, current, path = heapq.heappop(pq)
        
        steps.append({
            'action': f"Dequeuing {current} (h={heuristic_val})",
            'current_node': current,
            'queue_stack': [f"{n}(h={h})" for h, n, _ in pq],
            'path': path,
            'visited': list(visited),
            'operation': 'dequeue'
        })
        
        if current == target:
            steps.append({
                'action': f"Target {target} found!",
                'current_node': current,
                'queue_stack': [f"{n}(h={h})" for h, n, _ in pq],
                'path': path,
                'visited': list(visited),
                'target_found': True
            })
            return steps, path
        
        if current in visited:
            continue
            
        visited.add(current)
        
        # Add neighbors to priority queue
        neighbors = graph.get(current, [])
        for neighbor in neighbors:
            if neighbor not in visited:
                h_val = heuristics.get(neighbor, 0)
                new_path = path + [neighbor]
                heapq.heappush(pq, (h_val, neighbor, new_path))
                steps.append({
                    'action': f"Enqueuing {neighbor} (h={h_val})",
                    'current_node': current,
                    'queue_stack': [f"{n}(h={h})" for h, n, _ in pq],
                    'path': path,
                    'visited': list(visited),
                    'operation': 'enqueue',
                    'pushed_node': neighbor
                })
    
    return steps, None

def a_star_search(graph, start, target, heuristics):
    """A* Search implementation"""
    visited = set()
    pq = [(heuristics.get(start, 0), 0, start, [start])]  # (f, g, node, path)
    steps = []
    
    while pq:
        f_val, g_val, current, path = heapq.heappop(pq)
        
        steps.append({
            'action': f"Dequeuing {current} (f={f_val}, g={g_val})",
            'current_node': current,
            'queue_stack': [f"{n}(f={f},g={g})" for f, g, n, _ in pq],
            'path': path,
            'visited': list(visited),
            'cost': g_val,
            'operation': 'dequeue'
        })
        
        if current == target:
            steps.append({
                'action': f"Target {target} found!",
                'current_node': current,
                'queue_stack': [f"{n}(f={f},g={g})" for f, g, n, _ in pq],
                'path': path,
                'visited': list(visited),
                'cost': g_val,
                'target_found': True
            })
            return steps, path, g_val
        
        if current in visited:
            continue
            
        visited.add(current)
        
        # Add neighbors to priority queue
        neighbors = graph.get(current, [])
        for neighbor, edge_cost in neighbors:
            if neighbor not in visited:
                new_g = g_val + edge_cost
                new_f = new_g + heuristics.get(neighbor, 0)
                new_path = path + [neighbor]
                heapq.heappush(pq, (new_f, new_g, neighbor, new_path))
                steps.append({
                    'action': f"Enqueuing {neighbor} (f={new_f}, g={new_g})",
                    'current_node': current,
                    'queue_stack': [f"{n}(f={f},g={g})" for f, g, n, _ in pq],
                    'path': path,
                    'visited': list(visited),
                    'cost': g_val,
                    'operation': 'enqueue',
                    'pushed_node': neighbor
                })
    
    return steps, None, None

# Tree Building and Visualization
def build_tree_from_edges(edges_str, root_node):
    """Build tree structure with parent-child relationships"""
    tree = {}
    edges = edges_str.split(',')
    
    for edge in edges:
        if '-' in edge:
            parent, child = edge.strip().split('-')
            if parent not in tree:
                tree[parent] = {'children': []}
            tree[parent]['children'].append(child)
            if child not in tree:
                tree[child] = {'children': []}
    
    return tree

def generate_tree_visualization(tree, root_node, start_node, target_node, path):
    """Generate hierarchical tree structure for visualization"""
    def build_node_hierarchy(node, depth=0):
        return {
            'name': node,
            'depth': depth,
            'children': [build_node_hierarchy(child, depth + 1) for child in tree.get(node, {}).get('children', [])],
            'is_start': node == start_node,
            'is_target': node == target_node,
            'in_path': node in (path or [])
        }
    
    return build_node_hierarchy(root_node)

# Flask routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run_algorithm', methods=['POST'])
def run_algorithm():
    data = request.json
    algorithm = data.get('algorithm', 'dfs')
    graph_str = data.get('graph_input', '')
    start_node = data.get('start_node', '')
    target_node = data.get('target_node', '')
    root_node = data.get('root_node', start_node)  # Root for tree visualization
    costs = data.get('costs', {})
    heuristics = data.get('heuristics', {})
    depth_limit = data.get('depth_limit', 3)
    is_directed = data.get('is_directed', False)
    
    # Build appropriate graph based on algorithm
    if algorithm in ['ucs', 'astar']:
        graph = build_weighted_graph(graph_str, costs, is_directed)
    else:
        graph = build_graph(graph_str, is_directed)
    
    # Build tree visualization
    tree = build_tree_from_edges(graph_str, root_node)
    
    # Run selected algorithm
    if algorithm == 'dfs':
        steps, path = depth_first_search(graph, start_node, target_node)
        total_cost = None
    elif algorithm == 'bfs':
        steps, path = breadth_first_search(graph, start_node, target_node)
        total_cost = None
    elif algorithm == 'ucs':
        steps, path, total_cost = uniform_cost_search(graph, start_node, target_node)
    elif algorithm == 'dls':
        steps, path = depth_limited_search(graph, start_node, target_node, depth_limit)
        total_cost = None
    elif algorithm == 'ids':
        steps, path = iterative_deepening_dfs(graph, start_node, target_node)
        total_cost = None
    elif algorithm == 'best':
        steps, path = best_first_search(graph, start_node, target_node, heuristics)
        total_cost = None
    elif algorithm == 'astar':
        steps, path, total_cost = a_star_search(graph, start_node, target_node, heuristics)
    else:
        return jsonify({'error': 'Unknown algorithm'}), 400
    
    tree_viz = generate_tree_visualization(tree, root_node, start_node, target_node, path)
    
    return jsonify({
        'steps': steps,
        'path': path,
        'total_cost': total_cost,
        'tree_visualization': tree_viz
    })

if __name__ == '__main__':
    app.run(debug=True)