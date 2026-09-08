using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UI;

/// <summary>
/// Secuencia de apertura del Nivel 1.
///
/// Se pone en un GameObject vacio llamado "Prologo" en la escena.
/// NO hay que armar ninguna UI a mano: el script se construye su propio
/// canvas negro a pantalla completa al arrancar.
///
/// Flujo:
///   1. Pantalla negra. Texto centrado, linea por linea (el Fulgor, la caida).
///   2. Fundido de negro a juego.
///   3. Pasa el control al panel de dialogo normal para la llegada al bosque.
/// </summary>
public class PrologoNivel1 : MonoBehaviour
{
    [Header("Guion")]
    [Tooltip("ID de la conversacion del prologo en el JSON.")]
    [SerializeField] private string idPrologo = "prologo";

    [Tooltip("ID que se reproduce ya en el bosque, despues del fundido. Vacio = ninguno.")]
    [SerializeField] private string idLlegada = "llegada_bosque";

    [Header("Ritmo")]
    [SerializeField] private float velocidadLetra = 0.045f;
    [SerializeField] private float duracionFundido = 2.5f;
    [Tooltip("Segundos de negro antes de que empiece la primera linea.")]
    [SerializeField] private float esperaInicial = 1.5f;

    [Header("Apariencia")]
    [SerializeField] private int tamanoFuente = 26;
    [SerializeField] private Color colorTexto = new Color(0.90f, 0.92f, 0.95f);
    [SerializeField] private Color colorLumi = new Color(0.99f, 0.80f, 0.06f);
    [SerializeField] private Color colorVoz = new Color(0.55f, 0.62f, 0.70f);

    [Header("Opciones")]
    [Tooltip("Muestra el boton Saltar arriba a la derecha. Escape tambien salta.")]
    [SerializeField] private bool permitirSaltar = true;

    private CanvasGroup grupo;
    private Image fondo;
    private TMP_Text texto;
    private bool tecla;
    private bool saltar;
    private RectTransform rectSaltar;

    // ------------------------------------------------------------------

    private void Start()
    {
        ConstruirUI();
        StartCoroutine(Reproducir());
    }

    private void Update()
    {
        // Ojo con el orden: antes esto hacia 'if (kb == null) return;', que en
        // movil cortaba el Update entero porque alli no hay teclado.
        var kb = Keyboard.current;
        if (kb != null)
        {
            if (kb.eKey.wasPressedThisFrame ||
                kb.spaceKey.wasPressedThisFrame ||
                kb.enterKey.wasPressedThisFrame)
                tecla = true;

            if (permitirSaltar && kb.escapeKey.wasPressedThisFrame)
                saltar = true;
        }

        // Avanzar con el dedo. 'tecla' es un latch que la corrutina consume y
        // resetea, asi que ponerlo a true de mas es inofensivo.
        //
        // El toque sobre el boton Saltar no cuenta como avance: si contara,
        // verias saltar una linea en el pointer-down antes de que el OnClick
        // del boton llegue en el pointer-up.
        var pointer = Pointer.current;
        if (pointer != null &&
            pointer.press.wasPressedThisFrame &&
            !SobreBotonSaltar(pointer.position.ReadValue()))
            tecla = true;
    }

    private bool SobreBotonSaltar(Vector2 posPantalla)
    {
        if (rectSaltar == null || !rectSaltar.gameObject.activeInHierarchy)
            return false;

        // Canvas en Screen Space - Overlay: la camara va en null.
        return RectTransformUtility.RectangleContainsScreenPoint(rectSaltar, posPantalla, null);
    }

    // ------------------------------------------------------------------

    private void ConstruirUI()
    {
        // Canvas propio, por encima de todo lo demas.
        var go = new GameObject("Canvas_Prologo");
        go.transform.SetParent(transform, false);

        var canvas = go.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 500;

        var scaler = go.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(640, 360);
        scaler.matchWidthOrHeight = 0.5f;

        go.AddComponent<GraphicRaycaster>();
        grupo = go.AddComponent<CanvasGroup>();
        grupo.alpha = 1f;
        grupo.blocksRaycasts = false;

        // Fondo negro completo.
        var goFondo = new GameObject("Fondo");
        goFondo.transform.SetParent(go.transform, false);
        fondo = goFondo.AddComponent<Image>();
        fondo.color = Color.black;
        Estirar(fondo.rectTransform, 0, 0, 0, 0);

        // Texto centrado, con margenes generosos.
        var goTexto = new GameObject("TextoPrologo");
        goTexto.transform.SetParent(go.transform, false);
        texto = goTexto.AddComponent<TextMeshProUGUI>();
        texto.fontSize = tamanoFuente;
        texto.color = colorTexto;
        texto.alignment = TextAlignmentOptions.Center;
        texto.textWrappingMode = TextWrappingModes.Normal;
        texto.text = "";
        Estirar(texto.rectTransform, 70, 70, 70, 70);

        if (permitirSaltar) ConstruirBotonSaltar(go.transform);
    }

    /// <summary>
    /// Boton "Saltar" arriba a la derecha, la esquina donde no cae el texto
    /// (que va centrado con 70 de margen) ni el joystick (abajo).
    /// </summary>
    private void ConstruirBotonSaltar(Transform padre)
    {
        var goBoton = new GameObject("BotonSaltar");
        goBoton.transform.SetParent(padre, false);

        var fondoBoton = goBoton.AddComponent<Image>();   // esto crea el RectTransform
        fondoBoton.color = new Color(1f, 1f, 1f, 0.14f);

        rectSaltar = fondoBoton.rectTransform;
        rectSaltar.anchorMin = new Vector2(1f, 1f);
        rectSaltar.anchorMax = new Vector2(1f, 1f);
        rectSaltar.pivot = new Vector2(1f, 1f);
        rectSaltar.sizeDelta = new Vector2(92f, 34f);
        rectSaltar.anchoredPosition = new Vector2(-14f, -12f);

        // El CanvasGroup del prologo tiene blocksRaycasts en false, asi que sin
        // ignoreParentGroups este boton no seria pulsable.
        var grupoBoton = goBoton.AddComponent<CanvasGroup>();
        grupoBoton.ignoreParentGroups = true;
        grupoBoton.blocksRaycasts = true;

        var boton = goBoton.AddComponent<Button>();
        boton.targetGraphic = fondoBoton;
        boton.onClick.AddListener(() => saltar = true);

        var goEtiqueta = new GameObject("Etiqueta");
        goEtiqueta.transform.SetParent(goBoton.transform, false);

        var etiqueta = goEtiqueta.AddComponent<TextMeshProUGUI>();
        etiqueta.text = "Saltar \u25B8";
        etiqueta.fontSize = 15;
        etiqueta.color = new Color(0.90f, 0.92f, 0.95f, 0.75f);
        etiqueta.alignment = TextAlignmentOptions.Center;
        etiqueta.raycastTarget = false;
        Estirar(etiqueta.rectTransform, 0, 0, 0, 0);
    }

    private void Estirar(RectTransform rt, float izq, float der, float arr, float aba)
    {
        rt.anchorMin = Vector2.zero;
        rt.anchorMax = Vector2.one;
        rt.offsetMin = new Vector2(izq, aba);
        rt.offsetMax = new Vector2(-der, -arr);
    }

    // ------------------------------------------------------------------

    private IEnumerator Reproducir()
    {
        player_movement.isPaused = true;

        var conv = GuionLoader.Obtener(idPrologo);
        if (conv == null)
        {
            Debug.LogError($"[Prologo] No existe '{idPrologo}' en el guion.");
            yield return StartCoroutine(Fundir());
            Terminar();
            yield break;
        }

        yield return new WaitForSeconds(esperaInicial);

        foreach (LineaDialogo l in conv.lineas)
        {
            if (saltar) break;
            yield return StartCoroutine(MostrarLinea(l));
        }

        yield return StartCoroutine(Fundir());
        Terminar();
    }

    private IEnumerator MostrarLinea(LineaDialogo l)
    {
        texto.color = ColorDe(l.h);

        string completo = string.IsNullOrEmpty(l.h) || l.h == "Narrador"
            ? l.t
            : (l.h == "Voz" ? $"<i>{l.t}</i>" : l.t);

        // Escribe letra por letra, respetando etiquetas.
        texto.text = "";
        string acumulado = "";
        bool enTag = false;
        tecla = false;

        foreach (char c in completo)
        {
            acumulado += c;
            if (c == '<') enTag = true;
            if (c == '>') { enTag = false; texto.text = acumulado; continue; }
            if (enTag) continue;

            texto.text = acumulado;

            if (tecla || saltar) { texto.text = completo; break; }
            yield return new WaitForSeconds(velocidadLetra);
        }

        texto.text = completo;
        if (saltar) yield break;

        // Pausa obligatoria para que el texto respire.
        float espera = l.pausa > 0f ? l.pausa : 1.2f;
        float t = 0f;
        tecla = false;
        while (t < espera)
        {
            if (saltar) yield break;
            t += Time.deltaTime;
            yield return null;
        }

        // Si la linea es 'auto', sigue sola. Si no, espera tecla.
        if (!l.auto)
        {
            while (!tecla)
            {
                if (saltar) yield break;
                yield return null;
            }
            tecla = false;
        }

        // Fundido corto del texto entre lineas.
        float d = 0.35f;
        for (float f = 0; f < d; f += Time.deltaTime)
        {
            Color c = texto.color;
            c.a = Mathf.Lerp(1f, 0f, f / d);
            texto.color = c;
            yield return null;
        }
        texto.text = "";
        Color final = texto.color; final.a = 1f; texto.color = final;
    }

    private Color ColorDe(string hablante)
    {
        switch (hablante)
        {
            case "Lumi": return colorLumi;
            case "Voz": return colorVoz;
            default: return colorTexto;
        }
    }

    private IEnumerator Fundir()
    {
        texto.text = "";
        if (rectSaltar != null) rectSaltar.gameObject.SetActive(false);
        for (float t = 0; t < duracionFundido; t += Time.deltaTime)
        {
            grupo.alpha = Mathf.Lerp(1f, 0f, t / duracionFundido);
            yield return null;
        }
        grupo.alpha = 0f;
    }

    private void Terminar()
    {
        player_movement.isPaused = false;

        // Ya en el bosque: la primera linea la dice el panel de dialogo normal.
        if (!string.IsNullOrEmpty(idLlegada))
        {
            var llegada = GuionLoader.Obtener(idLlegada);
            if (llegada != null && DialogoUI.Instancia != null)
                DialogoUI.Instancia.Iniciar(llegada.lineas, "");
        }

        Destroy(gameObject, 0.5f);
    }
}
