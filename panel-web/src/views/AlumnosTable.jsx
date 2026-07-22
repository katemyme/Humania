import ProgressBar from '../components/ProgressBar.jsx'
import styles from './AlumnosTable.module.css'

function initials(nombre) {
  return nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

export default function AlumnosTable({ alumnos }) {
  if (alumnos.length === 0) {
    return <div className={styles.empty}>No se encontraron alumnos.</div>
  }

  return (
    <div className={styles.table}>
      <div className={styles.thead}>
        <span>Alumno</span>
        <span>Reino Verde</span>
        <span>Reino Rojo</span>
        <span>Últ. actividad</span>
      </div>
      {alumnos.map(st => (
        <div key={st.id} className={styles.row}>
          <div className={styles.alumno}>
            <div className={styles.avatar}>{initials(st.nombre)}</div>
            <span className={styles.nombre}>{st.nombre}</span>
          </div>
          <div className={styles.progresoCell}>
            <ProgressBar
              pct={st.verde}
              color="var(--color-verde)"
              height={8}
              ariaLabel={`${st.nombre} - Reino Verde: ${st.verde}%`}
            />
            <span className={styles.pct}>{st.verde}%</span>
          </div>
          <div className={styles.progresoCell}>
            <ProgressBar
              pct={st.rojo}
              color="var(--color-rojo)"
              height={8}
              ariaLabel={`${st.nombre} - Reino Rojo: ${st.rojo}%`}
            />
            <span className={styles.pct}>{st.rojo}%</span>
          </div>
          <span className={styles.actividad}>{st.ultimaActividad}</span>
        </div>
      ))}
    </div>
  )
}
