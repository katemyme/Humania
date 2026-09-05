using System.Collections;
using UnityEngine;
using TMPro;
using UnityEngine.Networking;

public class PantallaRegistro : MonoBehaviour
{
    [Header("Arrastra aquí tus campos de la pantalla Crear cuenta")]
    public TMP_InputField campoUsuario;
    public TMP_InputField campoContrasena;

    [System.Serializable] class Registro { public string email; public string password; public Data data; }
    [System.Serializable] class Data { public string username; }

    [SerializeField] private GameObject Menu;
    [SerializeField] private GameObject LoadingScreen;

    private string sceneName = "Login";

    bool enviando = false;

    void OnEnable()
    {
        // Enter en cualquiera de los dos campos intenta crear la cuenta.
        campoUsuario.onSubmit.AddListener(_ => IntentarCrear());
        campoContrasena.onSubmit.AddListener(_ => IntentarCrear());
    }

    void OnDisable()
    {
        campoUsuario.onSubmit.RemoveAllListeners();
        campoContrasena.onSubmit.RemoveAllListeners();
    }

    void IntentarCrear()
    {
        if (enviando) return;

        if (campoUsuario.text.Trim() == "" || campoContrasena.text == "")
        {
            Debug.LogWarning("Escribe usuario y contraseña.");
            return;
        }
        if (campoContrasena.text.Length < 6)
        {
            Debug.LogWarning("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        StartCoroutine(CrearFlujo());
    }

    IEnumerator CrearFlujo()
    {
        enviando = true;

        string usuario = campoUsuario.text.Trim();
        string pass = campoContrasena.text;

        Debug.Log("Creando cuenta...");

        string email = Sesion.UsuarioAEmail(usuario);
        string url = SupabaseConfig.Url + "/auth/v1/signup";
        // Guardamos el username en los metadatos para que el perfil lo tome
        string cuerpo = JsonUtility.ToJson(new Registro
        {
            email = email,
            password = pass,
            data = new Data { username = usuario.ToLower() }
        });

        using (UnityWebRequest req = new UnityWebRequest(url, "POST"))
        {
            req.uploadHandler = new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(cuerpo));
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("apikey", SupabaseConfig.AnonKey);
            req.SetRequestHeader("Content-Type", "application/json");
            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success)
            {
                Debug.Log("¡Cuenta creada! Ahora entra con tu usuario y el código de sala.");

                LoadScene();
            }
            else
            {
                Debug.LogError("No se pudo crear. Quizá ese usuario ya existe.");
                Debug.LogError(req.downloadHandler.text);
            }
        }

        enviando = false;
    }

    public void LoadScene()
    {
        Menu.SetActive(false);
        LoadingScreen.SetActive(true);
        UnityEngine.SceneManagement.SceneManager.LoadScene(sceneName);
    }
}