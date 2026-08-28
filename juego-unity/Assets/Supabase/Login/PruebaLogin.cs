using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

public class PruebaLogin : MonoBehaviour
{
    // Para la prueba, escribe aquí el correo y la contraseña del alumno de prueba
    public string correo = "alumno@humania.test";
    public string contrasena = "humania321";

    [System.Serializable]
    class RespuestaLogin
    {
        public string access_token;
        public Usuario user;
    }
    [System.Serializable]
    class Usuario { public string id; }

    [System.Serializable]
    class Credenciales { public string email; public string password; }

    IEnumerator Start()
    {
        string url = SupabaseConfig.Url + "/auth/v1/token?grant_type=password";

        // Armamos el cuerpo con el correo y la contraseña
        string cuerpo = JsonUtility.ToJson(new Credenciales { email = correo, password = contrasena });

        using (UnityWebRequest req = new UnityWebRequest(url, "POST"))
        {
            byte[] datos = System.Text.Encoding.UTF8.GetBytes(cuerpo);
            req.uploadHandler = new UploadHandlerRaw(datos);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("apikey", SupabaseConfig.AnonKey);
            req.SetRequestHeader("Content-Type", "application/json");

            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success)
            {
                RespuestaLogin r = JsonUtility.FromJson<RespuestaLogin>(req.downloadHandler.text);
                Sesion.AccessToken = r.access_token;
                Sesion.UserId = r.user.id;
                Debug.Log("¡Login exitoso! Alumno id: " + Sesion.UserId);
            }
            else
            {
                Debug.LogError("Error de login: " + req.error);
                Debug.LogError(req.downloadHandler.text);
            }
        }
    }
}
