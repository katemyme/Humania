using System.Collections;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;
using UnityEngine.Networking;
using UnityEngine.UI;

public class PantallaRegistro : MonoBehaviour
{
    [Header("Campos")]
    public TMP_InputField campoUsuario;
    public TMP_InputField campoContrasena;

    [Header("Boton de crear cuenta (obligatorio para movil)")]
    [SerializeField] private Button botonCrear;
    [SerializeField] private TMP_Text textoBoton;

    [Header("Mensajes al jugador")]
    [SerializeField] private TMP_Text textoMensaje;
    [SerializeField] private Color colorError = new Color(0.86f, 0.20f, 0.27f);
    [SerializeField] private Color colorInfo = new Color(0.12f, 0.23f, 0.54f);

    [Header("Pantallas")]
    [SerializeField] private GameObject Menu;
    [SerializeField] private GameObject LoadingScreen;

    [Header("Navegacion")]
    [SerializeField] private string escenaDestino = "Login";

    [Header("Reglas")]
    [SerializeField] private int largoMinimoPass = 6;
    [SerializeField] private int largoMinimoUsuario = 3;

    // ------------------------------------------------------------------

    [System.Serializable] class Registro { public string email; public string password; public Data data; }
    [System.Serializable] class Data { public string username; }

    private bool enviando = false;
    private string etiquetaBotonOriginal = "Crear cuenta";

    // ------------------------------------------------------------------

    void Awake()
    {
        ConfigurarCampos();
        if (textoBoton != null) etiquetaBotonOriginal = textoBoton.text;
    }

    void OnEnable()
    {
        campoUsuario.onSubmit.AddListener(OnSubmitCampo);
        campoContrasena.onSubmit.AddListener(OnSubmitCampo);

        if (botonCrear != null)
            botonCrear.onClick.AddListener(OnClickCrear);
        else
            Debug.LogWarning("[Registro] No hay boton asignado. En movil no se va a poder crear cuenta.");

        Mostrar("", false);
    }

    void OnDisable()
    {
        campoUsuario.onSubmit.RemoveListener(OnSubmitCampo);
        campoContrasena.onSubmit.RemoveListener(OnSubmitCampo);

        if (botonCrear != null)
            botonCrear.onClick.RemoveListener(OnClickCrear);
    }

    void Update()
    {
        var kb = Keyboard.current;
        if (kb != null && kb.tabKey.wasPressedThisFrame) SiguienteCampo();
    }

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
            campoContrasena.contentType = TMP_InputField.ContentType.Password;
            campoContrasena.lineType = TMP_InputField.LineType.SingleLine;
            campoContrasena.characterLimit = 64;
        }
    }

    private void SiguienteCampo()
    {
        var actual = EventSystem.current?.currentSelectedGameObject;
        if (actual == campoUsuario.gameObject) Seleccionar(campoContrasena);
        else Seleccionar(campoUsuario);
    }

    private void Seleccionar(TMP_InputField campo)
    {
        if (campo == null) return;
        campo.Select();
        campo.ActivateInputField();
    }

    // ------------------------------------------------------------------

    private void OnSubmitCampo(string _) => OnClickCrear();

    /// <summary>Este es el metodo que va en el On Click () del boton.</summary>
    public void OnClickCrear()
    {
        if (enviando) return;

        string usuario = campoUsuario.text.Trim();
        string pass = campoContrasena.text;

        if (usuario.Length < largoMinimoUsuario)
        {
            Mostrar($"El usuario necesita al menos {largoMinimoUsuario} letras.", true);
            Seleccionar(campoUsuario);
            return;
        }

        if (!UsuarioValido(usuario))
        {
            Mostrar("Usá solo letras, números, guion y punto. Sin espacios.", true);
            Seleccionar(campoUsuario);
            return;
        }

        if (pass.Length < largoMinimoPass)
        {
            Mostrar($"La contraseña necesita al menos {largoMinimoPass} caracteres.", true);
            Seleccionar(campoContrasena);
            return;
        }

        StartCoroutine(CrearFlujo(usuario, pass));
    }

    /// <summary>
    /// El usuario se convierte en usuario@humania.local, asi que no puede
    /// tener caracteres que rompan un email.
    /// </summary>
    private bool UsuarioValido(string u)
    {
        foreach (char c in u)
        {
            bool ok = char.IsLetterOrDigit(c) || c == '.' || c == '-' || c == '_';
            if (!ok) return false;
        }
        return true;
    }

    // ------------------------------------------------------------------

    IEnumerator CrearFlujo(string usuario, string pass)
    {
        Bloquear(true, "Creando cuenta…");
        Mostrar("", false);

        string email = Sesion.UsuarioAEmail(usuario);
        string url = SupabaseConfig.Url + "/auth/v1/signup";
        string cuerpo = JsonUtility.ToJson(new Registro
        {
            email = email,
            password = pass,
            data = new Data { username = usuario.ToLowerInvariant() }
        });

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
                string cuerpoError = req.downloadHandler.text ?? "";
                Mostrar(MensajeDeError(cuerpoError), true);
                Debug.LogError("[Registro] " + cuerpoError);
                Bloquear(false);
                yield break;
            }
        }

        Mostrar("¡Cuenta creada! Ahora entrá con tu código de sala.", false);
        yield return new WaitForSeconds(1.2f);
        CargarEscena();
    }

    /// <summary>Traduce el error de Supabase a algo que un estudiante entienda.</summary>
    private string MensajeDeError(string cuerpo)
    {
        string c = cuerpo.ToLowerInvariant();

        if (c.Contains("already registered") || c.Contains("already been registered") || c.Contains("user_already_exists"))
            return "Ese usuario ya existe. Probá con otro.";

        if (c.Contains("password"))
            return "Esa contraseña no se puede usar. Probá una más larga.";

        if (c.Contains("rate limit") || c.Contains("too many"))
            return "Demasiados intentos. Esperá un momento.";

        return "No se pudo crear la cuenta. Intentá de nuevo.";
    }

    // ------------------------------------------------------------------

    private void Bloquear(bool activo, string etiqueta = null)
    {
        enviando = activo;

        if (botonCrear != null) botonCrear.interactable = !activo;
        if (campoUsuario != null) campoUsuario.interactable = !activo;
        if (campoContrasena != null) campoContrasena.interactable = !activo;

        if (textoBoton != null)
            textoBoton.text = activo && etiqueta != null ? etiqueta : etiquetaBotonOriginal;
    }

    private void Mostrar(string mensaje, bool esError)
    {
        if (textoMensaje == null)
        {
            if (!string.IsNullOrEmpty(mensaje)) Debug.Log("[Registro] " + mensaje);
            return;
        }
        textoMensaje.text = mensaje;
        textoMensaje.color = esError ? colorError : colorInfo;
    }

    public void CargarEscena()
    {
        if (Menu != null) Menu.SetActive(false);
        if (LoadingScreen != null) LoadingScreen.SetActive(true);
        UnityEngine.SceneManagement.SceneManager.LoadScene(escenaDestino);
    }
}