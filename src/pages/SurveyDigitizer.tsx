import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type Row = {
  id: string
  values: string[]
}

const STORAGE_KEY = 'phytoboard-survey-digitizer'
const DEFAULT_ROW_COUNT = 3

function createId() {
  return Math.random().toString(36).slice(2, 10)
}

function buildEmptyRows(questionCount: number, rowCount = DEFAULT_ROW_COUNT): Row[] {
  return Array.from({ length: rowCount }, () => ({
    id: createId(),
    values: Array.from({ length: questionCount }, () => ''),
  }))
}

function escapeCsv(value: string) {
  const normalized = value.replace(/\r?\n/g, ' ').trim()
  if (/[",\n;]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`
  }
  return normalized
}

function parseQuestions(text: string) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
}

function loadDraft() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as { questionsText?: string; rows?: Row[] }
    return {
      questionsText: typeof parsed.questionsText === 'string' ? parsed.questionsText : '',
      rows: Array.isArray(parsed.rows)
        ? parsed.rows
            .filter(row => row && typeof row.id === 'string' && Array.isArray(row.values))
            .map(row => ({ id: row.id, values: row.values.map(value => String(value ?? '')) }))
        : null,
    }
  } catch {
    return null
  }
}

export function SurveyDigitizer() {
  const draft = useMemo(loadDraft, [])
  const [questionsText, setQuestionsText] = useState(
    draft?.questionsText ?? 'Pregunta 1\nPregunta 2\nPregunta 3',
  )
  const questions = useMemo(() => parseQuestions(questionsText), [questionsText])
  const [rows, setRows] = useState<Row[]>(() => {
    if (draft?.rows?.length) return draft.rows
    return buildEmptyRows(parseQuestions(draft?.questionsText ?? questionsText).length)
  })
  const [status, setStatus] = useState('Listo para capturar respuestas')

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ questionsText, rows }))
  }, [questionsText, rows])

  useEffect(() => {
    setRows(currentRows =>
      currentRows.map(row => ({
        ...row,
        values: Array.from({ length: questions.length }, (_, index) => row.values[index] ?? ''),
      })),
    )
  }, [questions.length])

  const completion = useMemo(() => {
    const totalCells = rows.length * questions.length
    if (!totalCells) return 0
    const filledCells = rows.reduce(
      (count, row) => count + row.values.filter(value => value.trim()).length,
      0,
    )
    return Math.round((filledCells / totalCells) * 100)
  }, [rows, questions.length])

  const csvPreview = useMemo(() => {
    if (!questions.length) return ''
    const headers = questions.map((question, index) => escapeCsv(question || `Pregunta ${index + 1}`))
    const body = rows.map(row =>
      row.values
        .slice(0, questions.length)
        .map(value => escapeCsv(value))
        .join(','),
    )
    return [headers.join(','), ...body].join('\n')
  }, [questions, rows])

  function syncRowCount(nextQuestionCount: number) {
    setRows(currentRows =>
      currentRows.map(row => ({
        ...row,
        values: Array.from({ length: nextQuestionCount }, (_, index) => row.values[index] ?? ''),
      })),
    )
  }

  function handleQuestionsChange(nextText: string) {
    setQuestionsText(nextText)
    syncRowCount(parseQuestions(nextText).length)
  }

  function addRow() {
    setRows(currentRows => [
      ...currentRows,
      {
        id: createId(),
        values: Array.from({ length: questions.length }, () => ''),
      },
    ])
  }

  function removeRow(rowId: string) {
    setRows(currentRows => currentRows.filter(row => row.id !== rowId))
  }

  function updateCell(rowId: string, columnIndex: number, value: string) {
    setRows(currentRows =>
      currentRows.map(row => {
        if (row.id !== rowId) return row
        const values = [...row.values]
        values[columnIndex] = value
        return { ...row, values }
      }),
    )
  }

  function addExampleQuestions() {
    handleQuestionsChange('¿Cómo calificarías el servicio?\n¿Qué mejorarías?\n¿Volverías a participar?')
    setStatus('Plantilla de ejemplo cargada')
  }

  function clearAll() {
    setQuestionsText('')
    setRows([])
    setStatus('Formulario limpio')
  }

  function exportCsv() {
    if (!questions.length) {
      setStatus('Agrega al menos una pregunta antes de exportar')
      return
    }

    const headers = questions.map((question, index) => escapeCsv(question || `Pregunta ${index + 1}`))
    const lines = rows.map(row =>
      row.values
        .slice(0, questions.length)
        .map(value => escapeCsv(value))
        .join(','),
    )

    const csv = ['\ufeff' + headers.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'respuestas-encuesta.csv'
    link.click()
    URL.revokeObjectURL(url)
    setStatus('CSV descargado')
  }

  return (
    <div
      className="min-h-screen text-slate-100"
      style={{ background: 'radial-gradient(circle at top, #17304a 0%, #0a1118 48%, #05080c 100%)' }}
    >
      <div className="absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(circle_at_top_left,_rgba(74,222,128,0.18),_transparent_45%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_40%)]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-xs font-mono uppercase tracking-[0.3em] text-cyan-200/80">PhytoBoard</p>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Digitizador de encuestas
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Pega las preguntas una por línea, ingresa solo las respuestas y descarga un CSV listo para Excel.
                No se guarda nombre, curso ni fecha.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addExampleQuestions}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Cargar ejemplo
              </button>
              <button
                type="button"
                onClick={addRow}
                className="rounded-xl border border-cyan-400/30 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Agregar fila
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Descargar CSV
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Preguntas</p>
              <p className="mt-1 text-2xl font-semibold text-white">{questions.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Respuestas</p>
              <p className="mt-1 text-2xl font-semibold text-white">{rows.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Completado</p>
              <p className="mt-1 text-2xl font-semibold text-white">{completion}%</p>
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[380px_1fr]">
          <aside className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">Preguntas</h2>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-sm text-slate-300 transition hover:text-white"
                >
                  Limpiar todo
                </button>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Escribe una pregunta por línea. Las respuestas se exportarán en el mismo orden.
              </p>
            </div>

            <textarea
              value={questionsText}
              onChange={event => handleQuestionsChange(event.target.value)}
              placeholder={['¿Qué tan útil fue la actividad?', '¿Qué fue lo mejor?', '¿Qué mejorarías?'].join('\n')}
              className="min-h-[260px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-300/40"
            />

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Consejo práctico</p>
              <p className="mt-2 leading-6">
                Si tus encuestas impresas siempre tienen las mismas preguntas, carga la lista una vez y luego solo
                vas llenando filas y descargando el CSV cuando termines.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Estado</p>
              <p className="mt-2 leading-6">{status}</p>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <Link to="/landing" className="transition hover:text-slate-200">
                Ver portada
              </Link>
              <Link to="/dashboard" className="transition hover:text-slate-200">
                Abrir dashboard
              </Link>
            </div>
          </aside>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Respuestas</h2>
                <p className="text-sm text-slate-400">Una fila por encuesta, una columna por pregunta.</p>
              </div>
              <button
                type="button"
                onClick={addRow}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                + Fila
              </button>
            </div>

            <div className="overflow-auto">
              {questions.length ? (
                <table className="min-w-full border-separate border-spacing-0 text-left">
                  <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-xl">
                    <tr>
                      <th className="sticky left-0 z-20 border-b border-r border-white/10 bg-slate-950/95 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        #
                      </th>
                      {questions.map((question, index) => (
                        <th
                          key={`${question}-${index}`}
                          className="min-w-[220px] border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400"
                        >
                          {question || `Pregunta ${index + 1}`}
                        </th>
                      ))}
                      <th className="border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr key={row.id} className="group">
                        <td className="sticky left-0 z-10 border-b border-r border-white/10 bg-slate-950/85 px-4 py-3 text-sm text-slate-300">
                          {rowIndex + 1}
                        </td>
                        {questions.map((_, columnIndex) => (
                          <td key={`${row.id}-${columnIndex}`} className="border-b border-white/10 px-3 py-2 align-top">
                            <input
                              value={row.values[columnIndex] ?? ''}
                              onChange={event => updateCell(row.id, columnIndex, event.target.value)}
                              placeholder={`Respuesta ${columnIndex + 1}`}
                              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40"
                            />
                          </td>
                        ))}
                        <td className="border-b border-white/10 px-3 py-2 align-top">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 opacity-80 transition hover:bg-rose-500/15 hover:text-rose-200 group-hover:opacity-100"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="grid min-h-[420px] place-items-center px-6 py-10 text-center text-slate-400">
                  <div>
                    <p className="text-lg font-medium text-white">Todavía no hay preguntas</p>
                    <p className="mt-2 max-w-md text-sm leading-6">
                      Agrega al menos una línea en el panel izquierdo para crear la grilla de captura.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Vista CSV</h2>
              <p className="text-sm text-slate-400">Solo respuestas. Sin nombres, curso ni fecha.</p>
            </div>
            <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Previsualización</span>
          </div>
          <pre className="mt-4 max-h-64 overflow-auto rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-xs leading-5 text-slate-200">
            {csvPreview || 'Agrega preguntas para ver el CSV generado.'}
          </pre>
        </section>
      </main>
    </div>
  )
}