using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

// Prueba de humo: pide los reinos a Supabase y los muestra en la consola.
public class PruebaConexion : MonoBehaviour
{
    IEnumerator Start()
    {
        // Le pedimos a la tabla kingdoms su código y nombre
        string url = SupabaseConfig.Url + "/rest/v1/kingdoms?select=code,name";

        using (UnityWebRequest req = UnityWebRequest.Get(url))
        {
            // Toda petición a Supabase necesita la clave pública en estas dos cabeceras
            req.SetRequestHeader("apikey", SupabaseConfig.AnonKey);
            req.SetRequestHeader("Authorization", "Bearer " + SupabaseConfig.AnonKey);

            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success)
            {
                Debug.Log("¡Conexión exitosa! Respuesta de Supabase:");
                Debug.Log(req.downloadHandler.text);
            }
            else
            {
                Debug.LogError("Error de conexión: " + req.error);
                Debug.LogError(req.downloadHandler.text);
            }
        }
    }
}
