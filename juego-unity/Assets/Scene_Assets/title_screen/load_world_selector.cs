using System.Collections;
using Unity.VectorGraphics;
using UnityEditor;
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
        if (Mouse.current.leftButton.wasPressedThisFrame)
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

        // Agarra la posicion del mouse y la convierte a coordenadas del mundo
        Vector2 mousePos = Mouse.current.position.ReadValue();
        Vector2 worldPos = cam.ScreenToWorldPoint(mousePos);

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
        // Carga la escena de manera asincrónica y rellena el slider de progreso
        AsyncOperation operation = SceneManager.LoadSceneAsync(levelToLoad);

        while (!operation.isDone)
        {
            float progressValue = Mathf.Clamp01(operation.progress / 0.9f);
            loadingSlider.value = progressValue;
            yield return null;
        }
    }
}