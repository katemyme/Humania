using System.Collections;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;
using UnityEngine.Networking;
using UnityEngine.UI;

public class PantallaLogin : MonoBehaviour
{
    [Header("Campos")]
    public TMP_InputField campoUsuario;
    public TMP_InputField campoContrasena;
    public TMP_InputField campoCodigo;

    [Header("Boton de entrar (obligatorio para movil)")]
    [SerializeField] private Button botonEntrar;
    [SerializeField] private TMP_Text textoBoton;

    [Header("Mensajes al jugador")]
    [Tooltip("Texto donde se muestran los errores. Sin esto el jugador no ve nada.")]
    [SerializeField] private TMP_Text textoMensaje;
    [SerializeField] private Color colorError = new Color(0.86f, 0.20f, 0.27f);
    [SerializeField] private Color colorInfo = new Color(0.12f, 0.23f, 0.54f);

    [Header("Pantallas")]
    [SerializeField] private GameObject Menu;
    [SerializeField] private GameObject LoadingScreen;

    [Header("Navegacion")]
    [SerializeField] private string escenaDestino = "Title_screen";

    // ------------------------------------------------------------------

    [System.Serializable] class Credenciales { public string email; public string password; }
    [System.Serializable] class RespLogin { public string access_token; public User user; }
    [System.Serializable] class User { public string id; }
    [System.Serializable] class CuerpoSala { public string p_code; }

    private bool enviando = false;
    private string etiquetaBotonOriginal = "Entrar";

    // ------------------------------------------------------------------

    void Awake()
    {
        ConfigurarCampos();
        if (textoBoton != null) etiquetaBotonOriginal = textoBoton.text;
    }

    void OnEnable()
    {
        // Enter sigue funcionando en PC.
        campoUsuario.onSubmit.AddListener(OnSubmitCampo);
        campoContrasena.onSubmit.AddListener(OnSubmitCampo);
        campoCodigo.onSubmit.AddListener(OnSubmitCampo);

        // El boton es lo que hace que esto funcione en celular.
        if (botonEntrar != null)
            botonEntrar.onClick.AddListener(OnClickEntrar);
        else
            Debug.LogWarning("[Login] No hay boton asignado. En movil no se va a poder entrar.");

        LimpiarMensaje();
    }

    void OnDisable()
    {
        campoUsuario.onSubmit.RemoveListener(OnSubmitCampo);
        campoContrasena.onSubmit.RemoveListener(OnSubmitCampo);
        campoCodigo.onSubmit.RemoveListener(OnSubmitCampo);

        if (botonEntrar != null)
            botonEntrar.onClick.RemoveListener(OnClickEntrar);
    }

    void Update()
    {
        // Tab salta al siguiente campo en PC. En movil no estorba.
        var kb = Keyboard.current;
        if (kb != null && kb.tabKey.wasPressedThisFrame) SiguienteCampo();
    }

    // ------------------------------------------------------------------
    // Configuracion de los campos para que se porten bien en celular
    // ------------------------------------------------------------------

    private void ConfigurarCampos()
    {
        if (campoUsuario != null)
        {
            campoUsuario.contentType = TMP_InputField.ContentType.Standard;
            campoUsuario.keyboardType = TouchScreenKeyboardType.ASCIICapable;
            campoUsuario.lineType = TMP_InputField.LineType.SingleLine;
            campoUsuario.characterLimit = 32;
        }

        if (campoContrasena != null)
        {
            // Password oculta el texto con puntitos y evita el autocorrector.
            campoContrasena.contentType = TMP_InputField.ContentType.Password;
            campoContrasena.lineType = TMP_InputField.LineType.SingleLine;
            campoContrasena.characterLimit = 64;
        }

        if (campoCodigo != null)
        {
            campoCodigo.contentType = TMP_InputField.ContentType.Standard;
            campoCodigo.keyboardType = TouchScreenKeyboardType.ASCIICapable;
            campoCodigo.lineType = TMP_InputField.LineType.SingleLine;
            campoCodigo.characterLimit = 16;
            // El codigo de sala siempre en mayusculas: evita el error mas comun.
            campoCodigo.onValueChanged.AddListener(v =>
            {
                string arriba = v.ToUpperInvariant();
                if (v != arriba) campoCodigo.text = arriba;
            });
        }
    }

    private void SiguienteCampo()
    {
        var actual = EventSystem.current?.currentSelectedGameObject;
        if (actual == campoUsuario.gameObject) Seleccionar(campoContrasena);
        else if (actual == campoContrasena.gameObject) Seleccionar(campoCodigo);
        else Seleccionar(campoUsuario);
    }

    private void Seleccionar(TMP_InputField campo)
    {
        if (campo == null) return;
        campo.Select();
        campo.ActivateInputField();
    }

    // ------------------------------------------------------------------
    // Entradas
    // ------------------------------------------------------------------

    private void OnSubmitCampo(string _) => OnClickEntrar();

    /// <summary>Este es el metodo que va en el On Click () del boton.</summary>
    public void OnClickEntrar()
    {
        if (enviando) return;

        string usuario = campoUsuario.text.Trim();
        string pass = campoContrasena.text;
        string codigo = campoCodigo.text.Trim();

        if (usuario == "")
        {
            Mostrar("Escribí tu nombre de usuario.", true);
            Seleccionar(campoUsuario);
            return;
        }
        if (pass == "")
        {
            Mostrar("Te falta la contraseña.", true);
            Seleccionar(campoContrasena);
            return;
        }
        if (codigo == "")
        {
            Mostrar("Necesitás el código que te dio tu docente.", true);
            Seleccionar(campoCodigo);
            return;
        }

        StartCoroutine(EntrarFlujo(usuario, pass, codigo));
    }

    // ------------------------------------------------------------------

    IEnumerator EntrarFlujo(string usuario, string pass, string codigo)
    {
        Bloquear(true, "Entrando…");
        Mostrar("", false);

        // ---- 1) Autenticacion --------------------------------------
        string email = Sesion.UsuarioAEmail(usuario);
        string url = SupabaseConfig.Url + "/auth/v1/token?grant_type=password";
        string cuerpo = JsonUtility.ToJson(new Credenciales { email = email, password = pass });

        using (UnityWebRequest req = new UnityWebRequest(url, "POST"))
        {
            req.uploadHandler = new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(cuerpo));
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("apikey", SupabaseConfig.AnonKey);
            req.SetRequestHeader("Content-Type", "application/json");
            req.timeout = 20;
            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.ConnectionError)
            {
                Mostrar("No hay conexión. Revisá tu internet.", true);
                Bloquear(false);
                yield break;
            }

            if (req.result != UnityWebRequest.Result.Success)
            {
                Mostrar("Usuario o contraseña incorrectos.", true);
                campoContrasena.text = "";
                Seleccionar(campoContrasena);
                Bloquear(false);
                yield break;
            }

            RespLogin r = JsonUtility.FromJson<RespLogin>(req.downloadHandler.text);
            if (r == null || string.IsNullOrEmpty(r.access_token))
            {
                Mostrar("Algo salió mal al entrar. Intentá de nuevo.", true);
                Bloquear(false);
                yield break;
            }

            Sesion.AccessToken = r.access_token;
            Sesion.UserId = r.user.id;
        }

        // ---- 2) Unirse a la sala -----------------------------------
        Bloquear(true, "Buscando tu sala…");

        string urlSala = SupabaseConfig.Url + "/rest/v1/rpc/join_group";
        string cuerpoSala = JsonUtility.ToJson(new CuerpoSala { p_code = codigo });

        using (UnityWebRequest req = new UnityWebRequest(urlSala, "POST"))
        {
            req.uploadHandler = new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(cuerpoSala));
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("apikey", SupabaseConfig.AnonKey);
            req.SetRequestHeader("Authorization", "Bearer " + Sesion.AccessToken);
            req.SetRequestHeader("Content-Type", "application/json");
            req.timeout = 20;
            yield return req.SendWebRequest();

            if (req.result != UnityWebRequest.Result.Success)
            {
                Mostrar("Ese código no existe o la sala está cerrada.", true);
                Seleccionar(campoCodigo);
                Bloquear(false);
                yield break;
            }

            Sesion.GroupId = req.downloadHandler.text.Trim().Trim('"');
        }

        Mostrar("¡Listo! Entrando…", false);
        CargarEscena();
    }

    // ------------------------------------------------------------------
    // UI
    // ------------------------------------------------------------------

    private void Bloquear(bool activo, string etiqueta = null)
    {
        enviando = activo;

        if (botonEntrar != null) botonEntrar.interactable = !activo;
        if (campoUsuario != null) campoUsuario.interactable = !activo;
        if (campoContrasena != null) campoContrasena.interactable = !activo;
        if (campoCodigo != null) campoCodigo.interactable = !activo;

        if (textoBoton != null)
            textoBoton.text = activo && etiqueta != null ? etiqueta : etiquetaBotonOriginal;
    }

    private void Mostrar(string mensaje, bool esError)
    {
        if (textoMensaje == null)
        {
            if (!string.IsNullOrEmpty(mensaje)) Debug.Log("[Login] " + mensaje);
            return;
        }
        textoMensaje.text = mensaje;
        textoMensaje.color = esError ? colorError : colorInfo;
    }

    private void LimpiarMensaje() => Mostrar("", false);

    public void CargarEscena()
    {
        if (Menu != null) Menu.SetActive(false);
        if (LoadingScreen != null) LoadingScreen.SetActive(true);
        UnityEngine.SceneManagement.SceneManager.LoadScene(escenaDestino);
    }
}