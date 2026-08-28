using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

// El alumno se une a una sala usando su código.
public class PruebaUnirseSala : MonoBehaviour
{
    // Escribe aquí el código de la sala que creaste en el panel
    public string codigoSala = "5X2XJA";

    [System.Serializable]
    class Cuerpo { public string p_code; }

    IEnumerator Start()
    {
        // Esperamos a que el login haya terminado
        yield return new WaitForSeconds(1.5f);

        if (!Sesion.HaIniciado)
        {
            Debug.LogError("No hay sesión. Primero hay que iniciar sesión.");
            yield break;
        }

        // Las funciones (RPC) se llaman en esta ruta
        string url = SupabaseConfig.Url + "/rest/v1/rpc/join_group";

        string cuerpo = JsonUtility.ToJson(new Cuerpo { p_code = codigoSala });

        using (UnityWebRequest req = new UnityWebRequest(url, "POST"))
        {
            byte[] datos = System.Text.Encoding.UTF8.GetBytes(cuerpo);
            req.uploadHandler = new UploadHandlerRaw(datos);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("apikey", SupabaseConfig.AnonKey);
            req.SetRequestHeader("Authorization", "Bearer " + Sesion.AccessToken);
            req.SetRequestHeader("Content-Type", "application/json");

            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success)
            {
                Debug.Log("¡Unido a la sala! Respuesta: " + req.downloadHandler.text);
            }
            else
            {
                Debug.LogError("Error al unirse: " + req.error);
                Debug.LogError(req.downloadHandler.text);
            }
        }
    }
}