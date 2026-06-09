import { useState } from 'react'
import NodeCard from './NodeCard'
import AddNodeForm from './AddNodeForm'

export default function Dashboard({ nodes, totalNodes, now, canDrag, onReorder, onOpen, iomt }) {
  const [adding, setAdding] = useState(false)
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)

  function handleDrop(targetId) {
    if (dragId && dragId !== targetId) {
      const ids = nodes.map(n => n.device_id)
      const from = ids.indexOf(dragId), to = ids.indexOf(targetId)
      if (from > -1 && to > -1) {
        ids.splice(to, 0, ids.splice(from, 1)[0])
        onReorder(ids)
      }
    }
    setDragId(null); setOverId(null)
  }

  return (
    <>
      <div className="toolbar">
        {!canDrag && <span className="toolbar-hint">Clear search to drag-reorder</span>}
        <button className="btn btn-primary" onClick={() => setAdding(true)} disabled={!iomt.ready}>
          + Add node
        </button>
      </div>
      {adding && <AddNodeForm onClose={() => setAdding(false)} onAdd={iomt.addPatient} />}
      <section className="cards">
        {nodes.length === 0 && (
          <p className="empty">
            {totalNodes === 0
              ? 'No nodes yet — power on a device or click "Add node".'
              : 'No nodes match your search.'}
          </p>
        )}
        {nodes.map(n => (
          <NodeCard
            key={n.device_id} node={n} now={now} onOpen={() => onOpen(n.device_id)}
            canDrag={canDrag}
            dragging={dragId === n.device_id} over={overId === n.device_id}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move'
              e.dataTransfer.setData('text/plain', n.device_id)   // required or drag won't start
              setDragId(n.device_id)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              if (overId !== n.device_id) setOverId(n.device_id)
            }}
            onDrop={(e) => { e.preventDefault(); handleDrop(n.device_id) }}
            onDragEnd={() => { setDragId(null); setOverId(null) }}
          />
        ))}
      </section>
    </>
  )
}
