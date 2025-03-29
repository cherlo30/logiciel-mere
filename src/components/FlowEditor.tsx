// FlowEditor.tsx
'use client'

import React, { useCallback, useEffect, useState, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  Node,
  Edge,
  Position,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow'
import 'reactflow/dist/style.css'
import { v4 as uuidv4 } from 'uuid'
import { Operation } from '../types/operation'

const useKeyPress = (targetKeys: string[], callback: () => void) => {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (targetKeys.includes(e.key)) callback()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [targetKeys, callback])
}

type CustomNodeData = {
  label: string
  isAddButton?: boolean
  duree?: number
  type?: string
}

function FlowEditorContent() {
  const [operations, setOperations] = useState<Operation[]>([])
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [editNode, setEditNode] = useState<Node<CustomNodeData> | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null)
  const [contextTargetId, setContextTargetId] = useState<string | null>(null)
  const { screenToFlowPosition } = useReactFlow()

  const typesDisponibles = ['Tournage numérique', 'Fraisage', 'Tournage conventionnel', 'Réception matière']

  const menuRef = useRef<HTMLDivElement>(null)
  const offset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    const initialNode: Node<CustomNodeData> = {
      id: 'plus',
      position: { x: 200, y: 200 },
      data: { label: '+', isAddButton: true },
      type: 'default',
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        width: 40,
        height: 40,
        fontSize: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: selectedNodeId === 'plus' ? '#dbeafe' : 'white'
      },
    }
    setNodes([initialNode])
  }, [setNodes])

  useKeyPress(['Delete', 'Backspace'], () => {
    if (selectedNodeId) {
      setNodes((nds) => nds.filter(n => n.id !== selectedNodeId))
      setEdges((eds) => eds.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId))
      setSelectedNodeId(null)
      setEditNode(null)
    }
  })

  const createAddButtonNode = (position: { x: number, y: number }) => {
    return {
      id: uuidv4(),
      data: { label: '+', isAddButton: true },
      position,
      type: 'default',
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        width: 40,
        height: 40,
        fontSize: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: '#fff'
      },
    }
  }

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    const newPlusNode = createAddButtonNode(flowPos)
    setNodes((nds) => [...nds, newPlusNode])
    setSelectedNodeId(newPlusNode.id)
    setContextTargetId(newPlusNode.id)
    setMenuPosition({ x: event.clientX, y: event.clientY })
    setEditNode({
      id: newPlusNode.id,
      position: flowPos,
      data: { label: '+', type: '', duree: 60, isAddButton: true },
      type: 'default',
      width: 100,
      height: 100,
    })
  }, [screenToFlowPosition, setNodes])

  const addOperation = (type: string, plusNodeId: string) => {
    const plusNode = nodes.find((n) => n.id === plusNodeId)
    if (!plusNode) return

    const newOpId = uuidv4()
    const newPlusId = uuidv4()
    const nodeHeight = 100
    const nodeWidth = 100
    const horizontalSpacing = 200
    const verticalOffset = -30

    const newNode: Node<CustomNodeData> = {
      id: newOpId,
      data: { label: `${type}\n⏱ 60min`, type, duree: 60 },
      position: {
        x: plusNode.position.x,
        y: plusNode.position.y + verticalOffset,
      },
      type: 'default',
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        width: nodeWidth,
        height: nodeHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        whiteSpace: 'pre-line',
        backgroundColor: selectedNodeId === newOpId ? '#dbeafe' : 'white'
      }
    }

    const newPlusNode: Node<CustomNodeData> = createAddButtonNode({
      x: plusNode.position.x + horizontalSpacing,
      y: plusNode.position.y
    })

    const newEdges: Edge[] = []
    const parentEdge = edges.find(e => e.target === plusNodeId)
    if (parentEdge) {
      newEdges.push({
        id: `e${parentEdge.source}-${newOpId}`,
        source: parentEdge.source,
        target: newOpId,
        markerEnd: { type: MarkerType.ArrowClosed },
      })
    }

    newEdges.push({
      id: `e${newOpId}-${newPlusNode.id}`,
      source: newOpId,
      target: newPlusNode.id,
      markerEnd: { type: MarkerType.ArrowClosed },
    })

    const filteredEdges = edges.filter(e => e.target !== plusNodeId)

    setNodes((nds) => [...nds.filter((n) => n.id !== plusNodeId), newNode, newPlusNode])
    setEdges([...filteredEdges, ...newEdges])
    setSelectedNodeId(null)
    setEditNode(null)
    setMenuPosition(null)
  }

  const handleBackgroundClick = () => {
    setEditNode(null)
    setMenuPosition(null)
  }

  const onNodeClick = (_: any, node: Node<CustomNodeData>) => {
    setSelectedNodeId(node.id)
    if (node.data.isAddButton) {
      setMenuPosition({ x: node.position.x + 50, y: node.position.y })
      setEditNode({
        ...node,
        data: { ...node.data, type: '', duree: 60 }
      })
      setContextTargetId(node.id)
    }
  }

  const onNodeDoubleClick = (_: any, node: Node<CustomNodeData>) => {
    if (!node.data.isAddButton) {
      setEditNode(node)
      setMenuPosition({ x: node.position.x + 50, y: node.position.y })
    }
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.stopPropagation()
    if (!editNode) return
    const { name, value } = e.target
    setEditNode({
      ...editNode,
      data: {
        ...editNode.data,
        [name]: name === 'duree' ? parseInt(value) : value,
        label: `${name === 'type' ? value : editNode.data.type}\n⏱ ${name === 'duree' ? value : editNode.data.duree}min`
      }
    })
  }

  const saveEdit = () => {
    if (editNode) {
      setNodes((nds) => nds.map(n => n.id === editNode.id ? editNode : n))
      setEditNode(null)
      setMenuPosition(null)
    }
  }

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed } }, eds))
  }, [])

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation()
    setEdges((eds) => eds.filter(e => e.id !== edge.id))
  }, [])

  const handleDrag = (e: MouseEvent) => {
    if (!menuRef.current || !isDraggingRef.current) return
    const newX = e.clientX - offset.current.x
    const newY = e.clientY - offset.current.y
    setMenuPosition({ x: newX, y: newY })
  }

  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.closest('input') || target.closest('select')) return
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    isDraggingRef.current = true
    window.addEventListener('mousemove', handleDrag)
    window.addEventListener('mouseup', stopDrag)
  }

  const stopDrag = () => {
    isDraggingRef.current = false
    window.removeEventListener('mousemove', handleDrag)
    window.removeEventListener('mouseup', stopDrag)
  }

  return (
    <div className="relative h-[600px] border rounded-md select-none">
      {editNode && menuPosition && (
        <div
          ref={menuRef}
          className="absolute z-50 bg-white border p-4 shadow-md w-64 select-none"
          style={{ left: menuPosition.x, top: menuPosition.y }}
        >
          <div onMouseDown={startDrag} className="cursor-move">
            <h2 className="text-lg font-bold mb-2">
              {editNode.data.isAddButton ? 'Créer une opération' : 'Modifier l\'opération'}
            </h2>
          </div>
          <label>Opération:
            <select name="type" value={editNode.data.type} onChange={handleEditChange} className="block w-full mb-2">
              {typesDisponibles.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>Durée:
            <input name="duree" type="number" value={editNode.data.duree} onChange={handleEditChange} className="block w-full mb-2" />
          </label>
          <button onClick={() => addOperation(editNode.data.type || '', editNode.id)} className="bg-blue-500 text-white px-3 py-1 rounded mr-2">
            {editNode.data.isAddButton ? 'Créer' : 'Sauvegarder'}
          </button>
          {!editNode.data.isAddButton && (
            <button onClick={saveEdit} className="bg-gray-400 text-white px-3 py-1 rounded">Fermer</button>
          )}
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={handleBackgroundClick}
        onEdgeClick={onEdgeClick}
        onPaneContextMenu={onPaneContextMenu}
        snapToGrid={true}
        snapGrid={[15, 15]}
        fitView
      >
        <Controls />
        <Background gap={15} size={1} />
      </ReactFlow>
    </div>
  )
}

export default function FlowEditor() {
  return (
    <ReactFlowProvider>
      <FlowEditorContent />
    </ReactFlowProvider>
  )
}
