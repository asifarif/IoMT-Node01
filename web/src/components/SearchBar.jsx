export default function SearchBar({ value, onChange }) {
  return (
    <input className="search" type="search"
           placeholder="Search name, node ID, or MRN\u2026"
           value={value} onChange={e => onChange(e.target.value)} />
  )
}
