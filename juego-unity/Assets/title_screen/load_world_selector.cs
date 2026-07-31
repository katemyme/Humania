using UnityEngine;
using UnityEngine.InputSystem;

public class load_world_selector : MonoBehaviour
{
    [SerializeField] private Camera cam;

    [SerializeField] private GameObject MainMenu;
    [SerializeField] private GameObject LoadingScreen;

    private void Update()
    {
        if (Mouse.current.leftButton.wasPressedThisFrame)
        {
            if (CheckClickHit())
            {
                LoadScene();
            }
        }
    }

    private bool CheckClickHit()
    {
        // Agarra la posicion del mouse y la convierte a coordenadas del mundo
        Vector2 mousePos = Mouse.current.position.ReadValue();
        Vector2 worldPos = cam.ScreenToWorldPoint(mousePos);

        // Lanza un rayo para ver si hay un objeto en esa posicion
        RaycastHit2D hit = Physics2D.Raycast(worldPos, Vector2.zero);

        return hit.collider != null && hit.collider.gameObject == gameObject;
    }

    private void LoadScene()
    {
        // Carga la escena de seleccion de mundo

        MainMenu.SetActive(false);
        LoadingScreen.SetActive(true);

        UnityEngine.SceneManagement.SceneManager.LoadScene("World_Selector");
    }
}