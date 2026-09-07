using System;
using System.Collections.Generic;

/// <summary>
/// Estructuras de datos que reflejan el JSON del guion.
/// No lleva MonoBehaviour: son puros contenedores.
/// </summary>

[Serializable]
public class LineaDialogo
{
    /// <summary>Quien habla: "Lumi", "Eco", "Bosque", "Niebla", "Kate", "" (narrador).</summary>
    public string h;

    /// <summary>El texto de la linea.</summary>
    public string t;

    /// <summary>
    /// Efecto que dispara esta linea al mostrarse.
    /// Valores: "zumbido+", "zumbido-", "luz+", "luz-", "recuerdo", "" (ninguno).
    /// </summary>
    public string efecto = "";

    /// <summary>Segundos de espera forzada despues de terminar de escribir la linea.</summary>
    public float pausa = 0f;

    /// <summary>Si es true, avanza sola despues de la pausa sin esperar tecla.</summary>
    public bool auto = false;
}

[Serializable]
public class Conversacion
{
    /// <summary>Identificador unico. Ej: "eco1_silencio".</summary>
    public string id;

    /// <summary>Nombre que se muestra en el panel para el hablante "Eco".</summary>
    public string nombreEco = "???";

    /// <summary>IDs de conversaciones que deben haber terminado antes de que esta se habilite.</summary>
    public List<string> requiere = new List<string>();

    /// <summary>Si el zumbido sube al entrar al rango de este NPC. Kate = false.</summary>
    public bool subeZumbidoAlEntrar = true;

    /// <summary>Las lineas del intercambio.</summary>
    public List<LineaDialogo> lineas = new List<LineaDialogo>();

    /// <summary>Lineas que suenan al ALEJARSE, despues de haber hablado. Los susurros del bosque.</summary>
    public List<LineaDialogo> susurro = new List<LineaDialogo>();
}

[Serializable]
public class GuionNivel
{
    public List<Conversacion> conversaciones = new List<Conversacion>();
}
