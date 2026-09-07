using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// El estado del reino. Vive en la escena, se resetea solo al darle Play.
///
/// Reglas del guion que hace cumplir:
///  - El zumbido SUBE al acercarse a un eco y NUNCA baja (salvo la escena 7).
///  - La luz de Lumi baja en el lago y no vuelve hasta que Kate dice su nombre.
///  - Guarda que conversaciones ya terminaron, para desbloquear Niebla y Kate.
/// </summary>
public class AtmosferaNivel1 : MonoBehaviour
{
    public static AtmosferaNivel1 Instancia { get; private set; }

    [Header("Zumbido del bosque")]
    [SerializeField] private AudioSource fuenteZumbido;
    [SerializeField] private int zumbidoMaximo = 6;
    [Tooltip("Volumen del AudioSource cuando el zumbido esta al maximo.")]
    [SerializeField] private float volumenMaximo = 0.85f;
    [SerializeField] private float velocidadFundido = 1.5f;

    [Header("Luz de Lumi")]
    [Tooltip("El sprite del halo/aura de Lumi. Se le cambia alpha y escala.")]
    [SerializeField] private SpriteRenderer haloLumi;
    [SerializeField] private int luzInicial = 3;
    [SerializeField] private int luzMaxima = 4;
    [SerializeField] private float escalaPorNivel = 0.35f;

    [Header("Debug (solo lectura)")]
    [SerializeField] private int nivelZumbido;
    [SerializeField] private int nivelLuz;

    private readonly HashSet<string> terminadas = new HashSet<string>();
    private float volumenObjetivo;
    private float alphaObjetivo;
    private float escalaObjetivo;

    // ------------------------------------------------------------------

    private void Awake()
    {
        if (Instancia != null && Instancia != this) { Destroy(gameObject); return; }
        Instancia = this;

        // Reset duro: el estado nunca debe sobrevivir a un Stop del editor.
        nivelZumbido = 0;
        nivelLuz = luzInicial;
        terminadas.Clear();

        // player_movement.isPaused es static, asi que tambien lo limpiamos aca.
        player_movement.isPaused = false;

        RecalcularObjetivos();
        AplicarInstantaneo();
    }

    private void Update()
    {
        if (fuenteZumbido != null)
            fuenteZumbido.volume = Mathf.MoveTowards(
                fuenteZumbido.volume, volumenObjetivo, velocidadFundido * Time.deltaTime * 0.35f);

        if (haloLumi != null)
        {
            Color c = haloLumi.color;
            c.a = Mathf.MoveTowards(c.a, alphaObjetivo, velocidadFundido * Time.deltaTime);
            haloLumi.color = c;

            float e = Mathf.MoveTowards(
                haloLumi.transform.localScale.x, escalaObjetivo, velocidadFundido * Time.deltaTime);
            haloLumi.transform.localScale = new Vector3(e, e, 1f);
        }
    }

    // ------------------------------------------------------------------
    // API que usan DialogoUI y NPCDialogo
    // ------------------------------------------------------------------

    public void SubirZumbido(int cantidad = 1)
    {
        nivelZumbido = Mathf.Clamp(nivelZumbido + cantidad, 0, zumbidoMaximo);
        RecalcularObjetivos();
    }

    /// <summary>Solo Kate puede bajarlo. Escena 7.</summary>
    public void BajarZumbido(int cantidad = 1)
    {
        nivelZumbido = Mathf.Clamp(nivelZumbido - cantidad, 0, zumbidoMaximo);
        RecalcularObjetivos();
    }

    public void CambiarLuz(int delta)
    {
        nivelLuz = Mathf.Clamp(nivelLuz + delta, 0, luzMaxima);
        RecalcularObjetivos();
    }

    public void MarcarTerminada(string id)
    {
        if (!string.IsNullOrEmpty(id)) terminadas.Add(id);
    }

    public bool YaTerminada(string id) => terminadas.Contains(id);

    public bool CumpleRequisitos(List<string> requiere)
    {
        if (requiere == null || requiere.Count == 0) return true;
        foreach (string r in requiere)
            if (!terminadas.Contains(r)) return false;
        return true;
    }

    // ------------------------------------------------------------------

    private void RecalcularObjetivos()
    {
        volumenObjetivo = zumbidoMaximo <= 0
            ? 0f
            : (nivelZumbido / (float)zumbidoMaximo) * volumenMaximo;

        alphaObjetivo = luzMaxima <= 0 ? 1f : Mathf.Lerp(0.25f, 1f, nivelLuz / (float)luzMaxima);
        escalaObjetivo = 0.6f + (nivelLuz * escalaPorNivel);
    }

    private void AplicarInstantaneo()
    {
        if (fuenteZumbido != null) fuenteZumbido.volume = volumenObjetivo;

        if (haloLumi != null)
        {
            Color c = haloLumi.color;
            c.a = alphaObjetivo;
            haloLumi.color = c;
            haloLumi.transform.localScale = new Vector3(escalaObjetivo, escalaObjetivo, 1f);
        }
    }
}
