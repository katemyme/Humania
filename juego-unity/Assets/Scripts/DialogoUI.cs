using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.InputSystem;

/// <summary>
/// Panel unico de dialogo. Uno solo por escena, en el objeto "DialogoManager".
///
/// Soporta lo que pide el guion del Bosque de la Empatia:
///  - Varios hablantes en una misma conversacion (Lumi / Eco / Bosque / Niebla / Kate).
///  - El BOSQUE se muestra distinto: sin panel de nombre, en cursiva, mas tenue.
///  - Efectos por linea: zumbido+, luz-, luz+, etc.
///  - Pausas forzadas y lineas que avanzan solas (los silencios).
/// </summary>
public class DialogoUI : MonoBehaviour
{
    public static DialogoUI Instancia { get; private set; }

    [Header("Referencias UI")]
    [SerializeField] private GameObject panel;
    [SerializeField] private GameObject cajaNombre;
    [SerializeField] private TMP_Text txtNombre;
    [SerializeField] private TMP_Text txtLinea;
    [SerializeField] private GameObject flechaContinuar;

    [Header("Colores por hablante")]
    [SerializeField] private Color colorLumi = new Color(0.99f, 0.80f, 0.06f);   // #FDCD10
    [SerializeField] private Color colorEco = new Color(0.97f, 0.98f, 0.99f);    // #F8FAFC
    [SerializeField] private Color colorBosque = new Color(0.55f, 0.62f, 0.70f); // gris apagado
    [SerializeField] private Color colorKate = new Color(0.58f, 0.80f, 1f);

    [Header("Ritmo")]
    [SerializeField] private float velocidadLetra = 0.028f;
    [Tooltip("Multiplicador de velocidad para las lineas del bosque. >1 = mas lento.")]
    [SerializeField] private float lentitudBosque = 1.8f;

    public bool EnDialogo { get; private set; }

    private List<LineaDialogo> lineas;
    private string nombreEcoActual;
    private int indice;
    private bool escribiendo;
    private bool bloqueadoPorPausa;
    private int frameInicio = -1;
    private int frameUltimoAvance = -1;
    private Coroutine rutina;
    private System.Action alTerminar;

    // ------------------------------------------------------------------

    private void Awake()
    {
        if (Instancia != null && Instancia != this) { Destroy(gameObject); return; }
        Instancia = this;
        if (panel) panel.SetActive(false);
    }

    /// <summary>Arranca una secuencia de lineas. alTerminar se llama al cerrar el panel.</summary>
    public void Iniciar(List<LineaDialogo> textos, string nombreEco, System.Action callback = null)
    {
        if (EnDialogo || textos == null || textos.Count == 0) return;

        lineas = textos;
        nombreEcoActual = string.IsNullOrEmpty(nombreEco) ? "???" : nombreEco;
        alTerminar = callback;
        indice = 0;
        EnDialogo = true;
        frameInicio = Time.frameCount;   // evita que la tecla de apertura salte la linea 1

        player_movement.isPaused = true;

        panel.SetActive(true);
        MostrarLinea();
    }

    private void Update()
    {
        if (!PuedeAvanzar()) return;

        var kb = Keyboard.current;
        if (kb != null &&
            (kb.eKey.wasPressedThisFrame ||
             kb.spaceKey.wasPressedThisFrame ||
             kb.enterKey.wasPressedThisFrame))
        {
            AvanzarPorInput();
            return;
        }

        // Toque o click. En movil no hay teclado, asi que esta es la via real.
        // Se lee aqui y no desde un Button para no depender de montar UI a mano.
        var pointer = Pointer.current;
        if (pointer != null && pointer.press.wasPressedThisFrame)
            AvanzarPorInput();
    }

    /// <summary>
    /// Avance por toque para el OnClick de un Button. NO hace falta montarlo:
    /// Update() ya lee el puntero directamente. Si aun asi lo montas, la guarda
    /// de un avance por frame evita que el mismo toque salte dos lineas.
    /// </summary>
    public void AvanzarPorToque()
    {
        if (!PuedeAvanzar()) return;
        AvanzarPorInput();
    }

    private void AvanzarPorInput()
    {
        frameUltimoAvance = Time.frameCount;
        Avanzar();
    }

    private bool PuedeAvanzar()
    {
        if (!EnDialogo || bloqueadoPorPausa) return false;

        // Un solo avance por frame de entrada del jugador. Asi da igual que
        // ademas del puntero que lee Update() haya un Button invisible llamando
        // a AvanzarPorToque(): el mismo toque no se come dos lineas.
        // Ojo: el avance automatico de las lineas 'auto' llama a Avanzar()
        // directo desde la corrutina y no pasa por aqui, que es lo que queremos.
        if (Time.frameCount == frameUltimoAvance) return false;

        // El frame en que se abre el panel no cuenta: evita que la tecla o el
        // toque que arranca la conversacion se salte la linea 1.
        return Time.frameCount != frameInicio;
    }

    // ------------------------------------------------------------------

    private void Avanzar()
    {
        if (escribiendo)
        {
            // Primer toque completa la linea de golpe.
            if (rutina != null) StopCoroutine(rutina);
            txtLinea.text = TextoFormateado(lineas[indice]);
            escribiendo = false;
            if (flechaContinuar) flechaContinuar.SetActive(true);
            return;
        }

        indice++;
        if (indice >= lineas.Count) { Cerrar(); return; }
        MostrarLinea();
    }

    private void MostrarLinea()
    {
        if (rutina != null) StopCoroutine(rutina);
        rutina = StartCoroutine(Reproducir(lineas[indice]));
    }

    private IEnumerator Reproducir(LineaDialogo l)
    {
        AplicarEfecto(l.efecto);
        AplicarEstilo(l.h);

        escribiendo = true;
        bloqueadoPorPausa = true;
        if (flechaContinuar) flechaContinuar.SetActive(false);
        txtLinea.text = "";

        string texto = TextoFormateado(l);
        float vel = EsBosque(l.h) ? velocidadLetra * lentitudBosque : velocidadLetra;

        // Escribe respetando las etiquetas <i> ... </i> como bloque.
        bool dentroDeTag = false;
        string visible = "";
        foreach (char c in texto)
        {
            visible += c;
            if (c == '<') dentroDeTag = true;
            if (c == '>') { dentroDeTag = false; txtLinea.text = visible; continue; }
            if (dentroDeTag) continue;

            txtLinea.text = visible;
            yield return new WaitForSeconds(vel);
        }

        txtLinea.text = texto;
        escribiendo = false;

        if (l.pausa > 0f) yield return new WaitForSeconds(l.pausa);
        bloqueadoPorPausa = false;

        if (l.auto)
        {
            Avanzar();
            yield break;
        }

        if (flechaContinuar) flechaContinuar.SetActive(true);
    }

    // ------------------------------------------------------------------

    /// <summary>
    /// Acepta varios efectos separados por ';'. Ej: "luz+;nombre:Kate"
    /// </summary>
    private void AplicarEfecto(string efecto)
    {
        if (string.IsNullOrEmpty(efecto)) return;
        var atm = AtmosferaNivel1.Instancia;

        foreach (string bruto in efecto.Split(';'))
        {
            string e = bruto.Trim();
            if (e.Length == 0) continue;

            // "nombre:Kate" -> a partir de aca el eco deja de ser "???"
            if (e.StartsWith("nombre:"))
            {
                nombreEcoActual = e.Substring(7);
                continue;
            }

            if (atm == null) continue;

            switch (e)
            {
                case "zumbido+": atm.SubirZumbido(); break;
                case "zumbido-": atm.BajarZumbido(); break;
                case "luz+": atm.CambiarLuz(+1); break;
                case "luz-": atm.CambiarLuz(-1); break;
                case "recuerdo": /* enganchar aca la escena jugable del lago */ break;
            }
        }
    }

    private void AplicarEstilo(string hablante)
    {
        // "Voz" es la voz sin cuerpo del prologo. Se presenta como el bosque:
        // sin caja de nombre, en cursiva. El jugador todavia no sabe de quien es.
        bool esBosque = EsBosque(hablante) || hablante == "Voz";
        bool esNarrador = string.IsNullOrEmpty(hablante) || hablante == "Narrador";

        if (cajaNombre) cajaNombre.SetActive(!esBosque && !esNarrador);

        if (esBosque || esNarrador)
        {
            txtLinea.color = colorBosque;
            return;
        }

        switch (hablante)
        {
            case "Lumi":
                txtNombre.text = "Lumi";
                txtNombre.color = colorLumi;
                txtLinea.color = colorLumi;
                break;
            case "Kate":
                // El nombre sale del guion, no hardcodeado: hasta la escena 7
                // ella es "???" y solo se vuelve "Kate" cuando lo dice.
                txtNombre.text = nombreEcoActual;
                txtNombre.color = colorKate;
                txtLinea.color = colorEco;
                break;
            case "Niebla":
                txtNombre.text = "";
                txtNombre.color = colorBosque;
                txtLinea.color = colorBosque;
                break;
            default: // "Eco"
                txtNombre.text = nombreEcoActual;
                txtNombre.color = colorEco;
                txtLinea.color = colorEco;
                break;
        }
    }

    private string TextoFormateado(LineaDialogo l)
    {
        bool esBosque = EsBosque(l.h) || l.h == "Voz";
        bool esNarrador = string.IsNullOrEmpty(l.h) || l.h == "Narrador";
        return (esBosque || esNarrador) ? $"<i>{l.t}</i>" : l.t;
    }

    private bool EsBosque(string h) => h == "Bosque";

    // ------------------------------------------------------------------

    public void Cerrar()
    {
        if (rutina != null) StopCoroutine(rutina);
        EnDialogo = false;
        escribiendo = false;
        bloqueadoPorPausa = false;
        if (panel) panel.SetActive(false);
        player_movement.isPaused = false;

        var cb = alTerminar;
        alTerminar = null;
        cb?.Invoke();
    }
}
