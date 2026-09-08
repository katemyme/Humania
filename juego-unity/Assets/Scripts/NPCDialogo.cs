using UnityEngine;
using UnityEngine.InputSystem;

/// <summary>
/// Va en un hijo del NPC llamado "RangoDialogo" con un CircleCollider2D en Is Trigger.
///
/// Lee su conversacion del guion JSON por ID. Se encarga de:
///  - Subir el zumbido al entrar al rango (menos Kate).
///  - Bloquear la conversacion si faltan requisitos (Niebla, Kate).
///  - Soltar el susurro del bosque al ALEJARSE, despues de haber hablado.
/// </summary>
[RequireComponent(typeof(Collider2D))]
public class NPCDialogo : MonoBehaviour
{
    [Header("Guion")]
    [Tooltip("ID exacto de la conversacion en nivel1_bosque.json")]
    [SerializeField] private string idConversacion;

    [Header("Comportamiento")]
    [Tooltip("true = arranca sola al entrar al rango. false = hay que presionar E.")]
    [SerializeField] private bool automatico = true;
    [SerializeField] private bool repetible = false;

    [Header("Opcional")]
    [Tooltip("Globito '!' o 'E' arriba del NPC.")]
    [SerializeField] private GameObject globoAviso;

    private Conversacion conv;
    private Collider2D rango;
    private bool jugadorCerca;
    private bool yaHablado;
    private bool zumbidoAplicado;
    private bool susurroPendiente;

    // ------------------------------------------------------------------

    private void Awake()
    {
        rango = GetComponent<Collider2D>();
        if (globoAviso) globoAviso.SetActive(false);
    }

    private void Start()
    {
        conv = GuionLoader.Obtener(idConversacion);
        if (conv == null)
            Debug.LogError($"[NPCDialogo] No existe la conversacion '{idConversacion}' en el guion.", this);
    }

    // ------------------------------------------------------------------

    private void OnTriggerEnter2D(Collider2D other)
    {
        if (!other.CompareTag("Player")) return;
        jugadorCerca = true;

        // El zumbido sube al acercarse a un eco. Kate no: subeZumbidoAlEntrar = false.
        if (!zumbidoAplicado && conv != null && conv.subeZumbidoAlEntrar)
        {
            AtmosferaNivel1.Instancia?.SubirZumbido();
            zumbidoAplicado = true;
        }

        if (!PuedeHablar()) return;

        if (automatico) { Hablar(); return; }
        if (globoAviso) globoAviso.SetActive(true);
    }

    private void OnTriggerExit2D(Collider2D other)
    {
        if (!other.CompareTag("Player")) return;
        jugadorCerca = false;
        if (globoAviso) globoAviso.SetActive(false);

        // El susurro del bosque suena cuando Lumi se aleja, no cuando esta ahi.
        if (susurroPendiente && conv != null && conv.susurro != null && conv.susurro.Count > 0)
        {
            susurroPendiente = false;
            DialogoUI.Instancia?.Iniciar(conv.susurro, "");
        }
    }

    private void Update()
    {
        if (automatico || !jugadorCerca) return;
        if (!PuedeHablar()) return;

        var kb = Keyboard.current;
        if (kb != null && kb.eKey.wasPressedThisFrame) { Hablar(); return; }

        // En movil no hay tecla E, asi que vale tocar al NPC. Se reusa el mismo
        // collider de rango que ya define hasta donde se puede hablar, para no
        // pedir colliders nuevos en cada NPC.
        var pointer = Pointer.current;
        if (pointer == null || !pointer.press.wasPressedThisFrame) return;
        if (rango == null) return;

        var cam = Camera.main;
        if (cam == null) return;

        Vector2 mundo = cam.ScreenToWorldPoint(pointer.position.ReadValue());
        if (rango.OverlapPoint(mundo)) Hablar();
    }

    /// <summary>
    /// Para enganchar al OnClick del globo de aviso, si prefieres un boton de UI
    /// en vez de tocar al NPC. Hablar() ya revalida los requisitos por dentro.
    /// </summary>
    public void HablarPorToque()
    {
        if (automatico || !jugadorCerca) return;
        Hablar();
    }

    // ------------------------------------------------------------------

    private bool PuedeHablar()
    {
        if (conv == null) return false;
        if (!repetible && yaHablado) return false;
        if (DialogoUI.Instancia == null || DialogoUI.Instancia.EnDialogo) return false;

        var atm = AtmosferaNivel1.Instancia;
        if (atm != null && !atm.CumpleRequisitos(conv.requiere)) return false;

        return true;
    }

    private void Hablar()
    {
        if (!PuedeHablar()) return;

        yaHablado = true;
        if (globoAviso) globoAviso.SetActive(false);

        DialogoUI.Instancia.Iniciar(conv.lineas, conv.nombreEco, () =>
        {
            AtmosferaNivel1.Instancia?.MarcarTerminada(conv.id);
            susurroPendiente = true;
        });
    }
}
