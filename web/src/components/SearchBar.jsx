export default function SearchBar({ value, onChange }) {
  return (
    <input className="search" type="search"
           placeholder="Search name, node ID, or MRN…"
           value={value} onChange={e => onChange(e.target.value)} />
  )
}
