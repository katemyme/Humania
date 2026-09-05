import styles from './AlumnosTable.module.css'

function initials(nombre) {
  return nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

function formatFecha(iso) {
  if (!iso) return 'Sin actividad'
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AlumnosTable({ alumnos, kingdoms, onSelect }) {
  if (alumnos.length === 0) {
    return <div className={styles.empty}>No se encontraron alumnos.</div>
  }

  const gridTemplateColumns = `2fr ${kingdoms.map(() => '1.3fr').join(' ')} 0.9fr 0.9fr 1fr`

  return (
    <div className={styles.table}>
      <div className={styles.thead} style={{ gridTemplateColumns }}>
        <span>Alumno</span>
        {kingdoms.map(k => <span key={k.id}>{k.name}</span>)}
        <span>Preguntas</span>
        <span>Aciertos</span>
        <span>Últ. actividad</span>
      </div>
      {alumnos.map(st => (
        <div
          key={st.id}
          className={styles.row}
          style={{ gridTemplateColumns }}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(st.id)}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSelect(st.id)}
        >
          <div className={styles.alumno}>
            <div className={styles.avatar}>{initials(st.nombre)}</div>
            <span className={styles.nombre}>{st.nombre}</span>
          </div>
          {kingdoms.map(k => {
            const info = st.porReino[k.id] ?? { crystalEarned: false, levelsDone: 0, totalLevels: 0, score: 0 }
            return (
              <div key={k.id} className={styles.reinoCell}>
                <span className={`${styles.crystal} ${info.crystalEarned ? styles.crystalOn : ''}`}>★</span>
                <div className={styles.reinoDatos}>
                  <span className={styles.reinoNiveles}>{info.levelsDone}/{info.totalLevels || '–'} niveles</span>
                  <span className={styles.reinoScore}>{info.score} pts</span>
                </div>
              </div>
            )
          })}
          <span className={styles.numero}>{st.totalRespuestas}</span>
          <span className={styles.numero}>{st.pctAciertos}%</span>
          <span className={styles.actividad}>{formatFecha(st.ultimaActividad)}</span>
        </div>
      ))}
    </div>
  )
}
