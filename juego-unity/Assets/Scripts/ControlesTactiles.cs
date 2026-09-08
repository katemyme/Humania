using UnityEngine;

/// <summary>
/// Va en el objeto "Canvas_Controles", el del On-Screen Stick.
///
/// Apaga los controles tactiles mientras hay un dialogo abierto o el jugador
/// esta pausado (prologo, cinematicas).
///
/// Hace falta porque DialogoUI y PrologoNivel1 leen Pointer.current directo y
/// no distinguen donde tocas: sin esto, tocar el joystick pasaria de linea, y
/// el stick ocupa una esquina entera de la pantalla.
///
/// No desactiva el GameObject propio a proposito: si lo hiciera, este script
/// dejaria de ejecutarse y no podria volver a encenderlo nunca. Trabaja sobre
/// un CanvasGroup, asi el objeto sigue vivo.
/// </summary>
[RequireComponent(typeof(CanvasGroup))]
public class ControlesTactiles : MonoBehaviour
{
    [Tooltip("Alpha de los controles cuando estan ocultos. 0 = invisibles.")]
    [SerializeField, Range(0f, 1f)] private float alphaOculto = 0f;

    private CanvasGroup grupo;
    private bool visibles = true;

    private void Awake()
    {
        grupo = GetComponent<CanvasGroup>();
        Aplicar(true);
    }

    private void LateUpdate()
    {
        // LateUpdate y no Update: asi DialogoUI y PrologoNivel1 ya han corrido
        // su Update en este frame y EnDialogo/isPaused estan al dia.
        bool deberian = !HayDialogo() && !player_movement.isPaused;

        if (deberian != visibles)
            Aplicar(deberian);
    }

    private void Aplicar(bool visible)
    {
        visibles = visible;
        grupo.alpha = visible ? 1f : alphaOculto;
        grupo.blocksRaycasts = visible;
        grupo.interactable = visible;
    }

    private static bool HayDialogo()
    {
        var d = DialogoUI.Instancia;
        return d != null && d.EnDialogo;
    }
}
