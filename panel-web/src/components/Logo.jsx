const SIZES = {
  lg: { outer: 72, outerBg: '#2563EB', outerRadius: 20, inner: 30, innerRadius: 8 },
  sm: { outer: 44, outerBg: '#1E3A8A', outerRadius: 14, inner: 18, innerRadius: 6 },
}

export default function Logo({ size = 'lg' }) {
  const c = SIZES[size]
  return (
    <div style={{
      width: c.outer, height: c.outer,
      borderRadius: c.outerRadius,
      background: c.outerBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{ width: c.inner, height: c.inner, borderRadius: c.innerRadius, background: '#FDCD10' }} />
    </div>
  )
}
