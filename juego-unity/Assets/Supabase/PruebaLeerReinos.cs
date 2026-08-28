using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

// Pide los reinos usando el token del alumno que inició sesión.
public class PruebaLeerReinos : MonoBehaviour
{
    IEnumerator Start()
    {
        // Esperamos un momento para asegurarnos de que el login ya terminó
        yield return new WaitForSeconds(1f);

        if (!Sesion.HaIniciado)
        {
            Debug.LogError("No hay sesión. Primero hay que iniciar sesión.");
            yield break;
        }

        string url = SupabaseConfig.Url + "/rest/v1/kingdoms?select=code,name,boss_name";

        using (UnityWebRequest req = UnityWebRequest.Get(url))
        {
            req.SetRequestHeader("apikey", SupabaseConfig.AnonKey);
            // La diferencia clave: ahora mandamos el token del alumno, no la clave pública
            req.SetRequestHeader("Authorization", "Bearer " + Sesion.AccessToken);

            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success)
            {
                Debug.Log("Reinos (con sesión): " + req.downloadHandler.text);
            }
            else
            {
                Debug.LogError("Error al leer reinos: " + req.error);
                Debug.LogError(req.downloadHandler.text);
            }
        }
    }
}
