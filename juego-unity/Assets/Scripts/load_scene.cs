using UnityEngine;

public class load_scene : MonoBehaviour
{
    [SerializeField] private GameObject Menu;
    [SerializeField] private GameObject LoadingScreen;

    public void LoadScene(string sceneName)
    {
        Menu.SetActive(false);
        LoadingScreen.SetActive(true);
        UnityEngine.SceneManagement.SceneManager.LoadScene(sceneName);
    }
}
