import { useState } from 'react'
import AppHeader from '../components/AppHeader.jsx'
import Toast from '../components/Toast.jsx'
import Button from '../components/Button.jsx'
import PreguntaCard from './PreguntaCard.jsx'
import PreguntaFormModal from './PreguntaFormModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { usePreguntas } from '../hooks/usePreguntas.js'
import { useToast } from '../hooks/useToast.js'
import styles from './Preguntas.module.css'

export default function Preguntas() {
  const { user, isAuditor } = useAuth()
  const { preguntas, kingdoms, loading, error, createPregunta, updatePregunta, deletePregunta } = usePreguntas()
  const { toast, showToast } = useToast()
  const [filtro, setFiltro] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const kingdomsById = Object.fromEntries(kingdoms.map(k => [k.id, k]))

  const filtered = filtro === 'todos'
    ? preguntas
    : preguntas.filter(p => String(p.kingdomId) === String(filtro))

  function openCreate() {
    setEditing(null)
    setShowModal(true)
  }

  function openEdit(pregunta) {
    setEditing(pregunta)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
  }

  async function handleSave(datos) {
    if (editing) {
      await updatePregunta(editing.id, datos)
      showToast('Pregunta actualizada')
    } else {
      await createPregunta(user.id, datos)
      showToast('Pregunta creada')
    }
    closeModal()
  }

  async function handleDelete(pregunta) {
    try {
      await deletePregunta(pregunta.id)
      showToast('Pregunta eliminada')
    } catch (err) {
      showToast(err.message)
    }
  }

  function tabClass(key) {
    if (String(filtro) !== String(key)) return styles.tabInactive
    if (key === 'todos') return styles.tabTodos
    return kingdomsById[key]?.code === 'rojo' ? styles.tabRojo : styles.tabVerde
  }

  return (
    <div className={styles.page}>
      <AppHeader />

      <main className={styles.main}>
        <div className={styles.topRow}>
          <div>
            <h1 className={styles.heading}>Preguntas</h1>
            <p className={styles.subheading}>
              Crea y edita los puzzles de tus reinos. El contenido base es de solo lectura.
            </p>
          </div>
          {!isAuditor && (
            <Button variant="primarySm" onClick={openCreate}>
              <span aria-hidden>+</span> Nueva pregunta
            </Button>
          )}
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tabClass('todos')}`} onClick={() => setFiltro('todos')}>
            Todos
          </button>
          {kingdoms.map(k => (
            <button key={k.id} className={`${styles.tab} ${tabClass(k.id)}`} onClick={() => setFiltro(k.id)}>
              {k.name}
            </button>
          ))}
        </div>

        {loading ? (
          <p className={styles.loading}>Cargando preguntas…</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>No hay preguntas para este filtro.</p>
        ) : (
          <div className={styles.lista}>
            {filtered.map(p => (
              <PreguntaCard
                key={p.id}
                pregunta={p}
                kingdom={kingdomsById[p.kingdomId]}
                isOwn={p.authorId === user.id}
                isAuditor={isAuditor}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <Toast message={toast} />

      {showModal && (
        <PreguntaFormModal
          initial={editing}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
