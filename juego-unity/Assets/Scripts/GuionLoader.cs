using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Carga el guion del nivel una sola vez y lo deja disponible por ID.
/// El archivo debe estar en: Assets/Resources/nivel1_bosque.json
/// </summary>
public static class GuionLoader
{
    private const string RUTA = "nivel1_bosque";   // sin .json, sin carpeta

    private static Dictionary<string, Conversacion> cache;

    public static Conversacion Obtener(string id)
    {
        if (cache == null) Cargar();
        if (string.IsNullOrEmpty(id)) return null;
        return cache.TryGetValue(id, out var c) ? c : null;
    }

    private static void Cargar()
    {
        cache = new Dictionary<string, Conversacion>();

        TextAsset ta = Resources.Load<TextAsset>(RUTA);
        if (ta == null)
        {
            Debug.LogError($"[GuionLoader] No encontre Assets/Resources/{RUTA}.json");
            return;
        }

        GuionNivel guion = JsonUtility.FromJson<GuionNivel>(ta.text);
        if (guion == null || guion.conversaciones == null)
        {
            Debug.LogError("[GuionLoader] El JSON existe pero no se pudo parsear. Revisa comas y llaves.");
            return;
        }

        foreach (var c in guion.conversaciones)
        {
            if (string.IsNullOrEmpty(c.id)) continue;
            cache[c.id] = c;
        }

        Debug.Log($"[GuionLoader] Cargadas {cache.Count} conversaciones.");
    }

    /// <summary>Util si editas el JSON en caliente durante el desarrollo.</summary>
    public static void Recargar() => cache = null;
}
