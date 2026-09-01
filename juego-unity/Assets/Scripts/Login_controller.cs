using UnityEngine;
using TMPro;

public class Login_controller : MonoBehaviour
{
    [Header("Input Fields de la pantalla de login")]
    public TMP_InputField inputCorreo;
    public TMP_InputField inputContrasena;
    public TMP_InputField inputCodigoSala;

    [Header("Referencias a los scripts de prueba")]
    public PruebaLogin pruebaLogin;
    public PruebaUnirseSala pruebaUnirseSala;

    bool yaEjecutado = false;

    void OnEnable()
    {
        inputCorreo.onSubmit.AddListener(_ => IntentarEnviar());
        inputContrasena.onSubmit.AddListener(_ => IntentarEnviar());
        inputCodigoSala.onSubmit.AddListener(_ => IntentarEnviar());
    }

    void OnDisable()
    {
        inputCorreo.onSubmit.RemoveAllListeners();
        inputContrasena.onSubmit.RemoveAllListeners();
        inputCodigoSala.onSubmit.RemoveAllListeners();
    }

    void IntentarEnviar()
    {
        if (yaEjecutado) return;

        if (TodosLosCamposLlenos())
        {
            EnviarDatosYProbar();
        }
        else
        {
            Debug.LogWarning("Completa correo, contraseña y código de sala antes de presionar Enter.");
        }
    }

    bool TodosLosCamposLlenos()
    {
        return !string.IsNullOrWhiteSpace(inputCorreo.text)
            && !string.IsNullOrWhiteSpace(inputContrasena.text)
            && !string.IsNullOrWhiteSpace(inputCodigoSala.text);
    }

    void EnviarDatosYProbar()
    {
        yaEjecutado = true;

        pruebaLogin.correo = inputCorreo.text;
        pruebaLogin.contrasena = inputContrasena.text;
        pruebaUnirseSala.codigoSala = inputCodigoSala.text;

        pruebaLogin.gameObject.SetActive(true);
        pruebaUnirseSala.gameObject.SetActive(true);

        Debug.Log("Datos enviados. Iniciando prueba de login y unión a sala...");
    }
}
