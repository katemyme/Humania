using System.Collections;
using TMPro;
using UnityEditor;
using UnityEngine;
using UnityEngine.Networking;

public class PantallaLogin : MonoBehaviour
{
    [Header("Arrastra aquí tus campos de la pantalla Entrar")]
    public TMP_InputField campoUsuario;
    public TMP_InputField campoContrasena;
    public TMP_InputField campoCodigo;

    [System.Serializable] class Credenciales { public string email; public string password; }
    [System.Serializable] class RespLogin { public string access_token; public User user; }
    [System.Serializable] class User { public string id; }
    [System.Serializable] class CuerpoSala { public string p_code; }

    [SerializeField] private GameObject Menu;
    [SerializeField] private GameObject LoadingScreen;

    private string scene_name = "Title_screen";

    bool enviando = false;

    void OnEnable()
    {
        // Los 3 campos llaman a la misma revisión. No importa en cuál de
        // los 3 estabas parado cuando presionaste Enter.
        campoUsuario.onSubmit.AddListener(_ => IntentarEntrar());
        campoContrasena.onSubmit.AddListener(_ => IntentarEntrar());
        campoCodigo.onSubmit.AddListener(_ => IntentarEntrar());
    }

    void OnDisable()
    {
        campoUsuario.onSubmit.RemoveAllListeners();
        campoContrasena.onSubmit.RemoveAllListeners();
        campoCodigo.onSubmit.RemoveAllListeners();
    }

    void IntentarEntrar()
    {
        if (enviando) return;

        if (campoUsuario.text.Trim() == "" || campoContrasena.text == "" || campoCodigo.text.Trim() == "")
        {
            Debug.LogWarning("Completa usuario, contraseña y código.");
            return;
        }

        StartCoroutine(EntrarFlujo());
    }

    IEnumerator EntrarFlujo()
    {
        enviando = true;

        string usuario = campoUsuario.text.Trim();
        string pass = campoContrasena.text;
        string codigo = campoCodigo.text.Trim();

        Debug.Log("Entrando...");

        // 1) Login
        string email = Sesion.UsuarioAEmail(usuario);
        string url = SupabaseConfig.Url + "/auth/v1/token?grant_type=password";
        string cuerpo = JsonUtility.ToJson(new Credenciales { email = email, password = pass });
        using (UnityWebRequest req = new UnityWebRequest(url, "POST"))
        {
            req.uploadHandler = new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(cuerpo));
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("apikey", SupabaseConfig.AnonKey);
            req.SetRequestHeader("Content-Type", "application/json");
            yield return req.SendWebRequest();

            if (req.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Usuario o contraseña incorrectos.");
                enviando = false;
                yield break;
            }

            RespLogin r = JsonUtility.FromJson<RespLogin>(req.downloadHandler.text);
            Sesion.AccessToken = r.access_token;
            Sesion.UserId = r.user.id;
        }

        // 2) Unirse a la sala con el código
        string urlSala = SupabaseConfig.Url + "/rest/v1/rpc/join_group";
        string cuerpoSala = JsonUtility.ToJson(new CuerpoSala { p_code = codigo });
        using (UnityWebRequest req = new UnityWebRequest(urlSala, "POST"))
        {
            req.uploadHandler = new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(cuerpoSala));
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("apikey", SupabaseConfig.AnonKey);
            req.SetRequestHeader("Authorization", "Bearer " + Sesion.AccessToken);
            req.SetRequestHeader("Content-Type", "application/json");
            yield return req.SendWebRequest();

            if (req.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Código de sala inválido o inactivo.");
                enviando = false;
                yield break;
            }

            Sesion.GroupId = req.downloadHandler.text.Trim().Trim('"');
        }

        LoadScene(scene_name);

        Debug.Log("¡Listo! Entraste a la sala. Alumno: " + Sesion.UserId + " · Sala: " + Sesion.GroupId);
        // Aquí después cargamos la siguiente escena (el hub del juego)

        enviando = false;
    }

    public void LoadScene(string sceneName)
    {
        Menu.SetActive(false);
        LoadingScreen.SetActive(true);
        UnityEngine.SceneManagement.SceneManager.LoadScene(sceneName);
    }
}