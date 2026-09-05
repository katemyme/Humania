import { useState, useEffect } from 'react'
import Modal from '../components/Modal.jsx'
import Button from '../components/Button.jsx'
import { getKingdoms, getSalas } from '../data/api.js'
import styles from './PreguntaFormModal.module.css'

const TIPOS = [
  { value: 'dilema', label: 'Dilema' },
  { value: 'cronologia', label: 'Cronología' },
  { value: 'decision', label: 'Decisión' },
  { value: 'palabra_clave', label: 'Palabra clave' },
]

function toFormOpcion(o) {
  return { content: o.content, isCorrect: o.isCorrect, correctOrder: o.correctOrder }
}

function emptyOpcion() {
  return { content: '', isCorrect: false, correctOrder: null }
}

export default function PreguntaFormModal({ initial, onClose, onSave }) {
  const [kingdoms, setKingdoms] = useState([])
  const [kingdomsLoading, setKingdomsLoading] = useState(true)
  const [salas, setSalas] = useState([])
  const [salasLoading, setSalasLoading] = useState(true)
  const [kingdomId, setKingdomId] = useState(initial?.kingdomId ?? '')
  const [groupId, setGroupId] = useState(initial?.groupId ?? '')
  const [tipo, setTipo] = useState(initial?.tipo ?? 'dilema')
  const [prompt, setPrompt] = useState(initial?.prompt ?? '')
  const [opciones, setOpciones] = useState(
    initial?.opciones?.length ? initial.opciones.map(toFormOpcion) : [emptyOpcion(), emptyOpcion()]
  )
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    getKingdoms()
      .then(data => {
        if (!active) return
        setKingdoms(data)
        setKingdomId(prev => prev || data[0]?.id || '')
      })
      .catch(() => { if (active) setError('No se pudieron cargar los reinos.') })
      .finally(() => { if (active) setKingdomsLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    getSalas()
      .then(data => {
        if (!active) return
        setSalas(data)
        setGroupId(prev => prev || data[0]?.id || '')
      })
      .catch(() => { if (active) setError('No se pudieron cargar tus salas.') })
      .finally(() => { if (active) setSalasLoading(false) })
    return () => { active = false }
  }, [])

  const esCronologia = tipo === 'cronologia'

  function updateOpcion(i, patch) {
    setOpciones(prev => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)))
  }

  function addOpcion() {
    setOpciones(prev => [...prev, emptyOpcion()])
  }

  function removeOpcion(i) {
    setOpciones(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    const trimmedPrompt = prompt.trim()
    const validOpciones = opciones
      .map(o => ({ ...o, content: o.content.trim() }))
      .filter(o => o.content)

    if (!trimmedPrompt) { setError('El enunciado no puede estar vacío.'); return }
    if (validOpciones.length < 2) { setError('Agrega al menos dos opciones.'); return }
    if (esCronologia && validOpciones.some(o => !o.correctOrder)) {
      setError('Asigna el orden correcto a cada opción.')
      return
    }
    if (!kingdomId) { setError('Selecciona un reino.'); return }
    if (!groupId) { setError('Selecciona una sala.'); return }

    setError('')
    setSubmitting(true)
    try {
      await onSave({ kingdomId, groupId, tipo, prompt: trimmedPrompt, opciones: validOpciones })
    } catch (err) {
      setError(err.message || 'No se pudo guardar la pregunta. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className={styles.heading}>{initial ? 'Editar pregunta' : 'Nueva pregunta'}</h2>

      <label className={styles.field}>
        <span className={styles.label}>Reino</span>
        {kingdomsLoading ? (
          <p className={styles.hint}>Cargando reinos…</p>
        ) : (
          <select
            className={styles.input}
            value={kingdomId}
            onChange={e => setKingdomId(Number(e.target.value))}
          >
            {kingdoms.map(k => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </select>
        )}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Sala</span>
        {salasLoading ? (
          <p className={styles.hint}>Cargando tus salas…</p>
        ) : salas.length === 0 ? (
          <p className={styles.hint}>Primero crea una sala en "Mis salas" para poder agregarle preguntas.</p>
        ) : (
          <select
            className={styles.input}
            value={groupId}
            onChange={e => setGroupId(e.target.value)}
          >
            {salas.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        )}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Tipo</span>
        <select className={styles.input} value={tipo} onChange={e => setTipo(e.target.value)}>
          {TIPOS.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Enunciado</span>
        <textarea
          className={styles.textarea}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
          placeholder="Ej: ¿Cocinar y ser valiente se excluyen?"
        />
      </label>

      <div className={styles.field}>
        <span className={styles.label}>
          Opciones{esCronologia ? ' — indica el orden correcto de cada una' : ''}
        </span>
        <div className={styles.opcionesList}>
          {opciones.map((o, i) => (
            <div key={i} className={styles.opcionRow}>
              <input
                className={styles.opcionInput}
                placeholder={`Opción ${i + 1}`}
                value={o.content}
                onChange={e => updateOpcion(i, { content: e.target.value })}
              />
              {esCronologia ? (
                <input
                  type="number"
                  min="1"
                  className={styles.ordenInput}
                  placeholder="Orden"
                  value={o.correctOrder ?? ''}
                  onChange={e => updateOpcion(i, { correctOrder: e.target.value ? Number(e.target.value) : null })}
                />
              ) : (
                <label className={styles.correctaCheck}>
                  <input
                    type="checkbox"
                    checked={o.isCorrect}
                    onChange={() => updateOpcion(i, { isCorrect: !o.isCorrect })}
                  />
                  Correcta
                </label>
              )}
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeOpcion(i)}
                aria-label={`Quitar opción ${i + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <Button variant="ghost" onClick={addOpcion} type="button">+ Agregar opción</Button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancelar</Button>
        <Button variant="confirm" onClick={handleSubmit} disabled={submitting || salas.length === 0}>
          {submitting ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </Modal>
  )
}
