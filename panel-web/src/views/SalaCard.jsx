import { useNavigate } from 'react-router-dom'
import RoomCodeChip from '../components/RoomCodeChip.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import Button from '../components/Button.jsx'
import styles from './SalaCard.module.css'

export default function SalaCard({ sala, onCopy }) {
  const navigate = useNavigate()

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div>
          <h3 className={styles.nombre}>{sala.nombre}</h3>
          <span className={styles.grado}>{sala.grado}</span>
        </div>
        <div className={styles.reinos}>
          {sala.reinoVerde && <span className={`${styles.badge} ${styles.verde}`}>Reino Verde</span>}
          {sala.reinoRojo  && <span className={`${styles.badge} ${styles.rojo}`}>Reino Rojo</span>}
        </div>
      </div>

      <RoomCodeChip
        codigo={sala.codigo}
        onCopy={() => onCopy(sala.codigo)}
      />

      <div className={styles.progreso}>
        <div className={styles.progresoMeta}>
          <span>{sala.alumnos} alumnos</span>
          <span>{sala.progreso}% avance</span>
        </div>
        <ProgressBar
          pct={sala.progreso}
          ariaLabel={`Avance de ${sala.nombre}: ${sala.progreso}%`}
        />
      </div>

      <Button variant="outline" onClick={() => navigate(`/salas/${sala.id}`)}>
        Ver detalle
      </Button>
    </div>
  )
}
