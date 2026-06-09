import { useState } from 'react'
import NodeCard from './NodeCard'
import AddNodeForm from './AddNodeForm'

export default function Dashboard({ nodes, totalNodes, onOpen, iomt }) {
  const [adding, setAdding] = useState(false)
  return (
    <>
      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setAdding(true)} disabled={!iomt.ready}>
          + Add node
        </button>
      </div>
      {adding && <AddNodeForm onClose={() => setAdding(false)} onAdd={iomt.addPatient} />}
      <section className="cards">
        {nodes.length === 0 && (
          <p className="empty">
            {totalNodes === 0
              ? 'No nodes yet \u2014 power on a device or click "Add node".'
              : 'No nodes match your search.'}
          </p>
        )}
        {nodes.map(n => (
          <NodeCard key={n.device_id} node={n} onOpen={() => onOpen(n.device_id)} />
        ))}
      </section>
    </>
  )
}
