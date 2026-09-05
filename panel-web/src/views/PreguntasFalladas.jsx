import ProgressBar from '../components/ProgressBar.jsx'
import styles from './PreguntasFalladas.module.css'

export default function PreguntasFalladas({ preguntas, kingdomsById }) {
  if (preguntas.length === 0) {
    return <div className={styles.empty}>Aún no hay respuestas registradas.</div>
  }

  return (
    <div className={styles.lista}>
      {preguntas.map(p => {
        const kingdom = kingdomsById[p.kingdomId]
        return (
          <div key={p.questionId} className={styles.item}>
            <div className={styles.info}>
              <div className={styles.tags}>
                {kingdom && (
                  <span className={`${styles.badge} ${kingdom.code === 'rojo' ? styles.rojo : styles.verde}`}>
                    {kingdom.name}
                  </span>
                )}
                <span className={styles.meta}>{p.total} respuesta{p.total === 1 ? '' : 's'}</span>
              </div>
              <p className={styles.prompt}>{p.prompt}</p>
            </div>
            <div className={styles.errorCell}>
              <ProgressBar pct={p.pctError} color="var(--color-rojo)" height={8} ariaLabel={`Porcentaje de error: ${p.pctError}%`} />
              <span className={styles.pctError}>{p.pctError}% de error</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
