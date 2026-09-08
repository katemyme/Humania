using System.Collections;
using Unity.VectorGraphics;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class load_world_selector : MonoBehaviour
{
    [SerializeField] private Camera cam;

    [SerializeField] private GameObject MainMenu;
    [SerializeField] private GameObject LoadingScreen;

    [SerializeField] private GameObject btnColeccion;
    [SerializeField] private GameObject btnConfiguracion;

    [SerializeField] private Slider loadingSlider;

    private bool isLoading = false;

    private void Update()
    {
        // Pointer es la clase base de Mouse, Pen y Touchscreen, asi que cubre
        // raton y dedo con el mismo codigo. Con Mouse.current el menu no responde
        // en movil: la plantilla WebGL de Unity hace preventDefault() en touchstart
        // y eso suprime los mouse events de compatibilidad que el navegador
        // emitiria despues del toque.
        var pointer = Pointer.current;
        if (pointer == null) return;

        if (pointer.press.wasPressedThisFrame)
        {
            if (CheckClickHit())
            {
                isLoading = true;
                btnColeccion.SetActive(false);
                btnConfiguracion.SetActive(false);
                LoadScene();
            }
        }
    }

    private bool CheckClickHit()
    {
        // Si ya se esta cargando una escena, no hacer nada
        if (isLoading)
            return false;

        // Agarra la posicion del puntero (raton o dedo) y la pasa a coordenadas del mundo
        var pointer = Pointer.current;
        if (pointer == null)
            return false;

        Vector2 screenPos = pointer.position.ReadValue();
        Vector2 worldPos = cam.ScreenToWorldPoint(screenPos);

        // Lanza un rayo para ver si hay un objeto en esa posicion
        RaycastHit2D hit = Physics2D.Raycast(worldPos, Vector2.zero);

        return hit.collider != null && hit.collider.gameObject == gameObject;
    }

    private void LoadScene()
    {
        // ahre cargaba la escena xd
        MainMenu.SetActive(true);
        LoadingScreen.SetActive(true);

        StartCoroutine(LoadLevelASync("World_Selector"));
    }

    IEnumerator LoadLevelASync(string levelToLoad)
    {
        // Carga la escena de manera asincr�nica y rellena el slider de progreso
        AsyncOperation operation = SceneManager.LoadSceneAsync(levelToLoad);

        while (!operation.isDone)
        {
            float progressValue = Mathf.Clamp01(operation.progress / 0.9f);
            loadingSlider.value = progressValue;
            yield return null;
        }
    }
}