class Node:
    __slots__ = "element"

    def __init__(self, x):
        self._element = x

    def element(self):
        return self._element

    def __hash__(self):
        return hash(id(self))


class Edge:
    def __init__(self, orig, dest):
        self._origin = orig
        self._destination = dest

    def endpoints(self):
        return (self._origin, self._destination)

    def opposite(self, node):
        return self._destination if node is self._origin else self._origin

    def __hash__(self):
        return hash((self._origin, self._destination))


class DirectedGraph:
    def __init__(self):
        self._outgoing = {}
        self._incoming = {}

    def insert_node(self, value=None):
        nd = Node(value)
        self._outgoing[nd] = {}
        self._incoming[nd] = {}
        return nd

    def insert_edge(self, orig, dest):
        edge = Edge(orig, dest)
        self._outgoing[orig][dest] = edge
        self._incoming[dest][orig] = edge
