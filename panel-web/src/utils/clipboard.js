// Copia texto al portapapeles. La Clipboard API solo existe en contextos
// seguros (https o localhost), así que se mantiene el fallback clásico.
export function copyToClipboard(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text)

  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;opacity:0'
  document.body.appendChild(ta)
  ta.focus()
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
  return Promise.resolve()
}
