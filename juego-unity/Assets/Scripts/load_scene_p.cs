using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using System.Collections;

public class load_scene_p : MonoBehaviour
{
    [SerializeField] private GameObject Menu;
    [SerializeField] private GameObject LoadingScreen;

    [SerializeField] private Slider loadingSlider;

    public void LoadScene(string sceneName)
    {
        Menu.SetActive(false);
        LoadingScreen.SetActive(true);

        StartCoroutine(LoadLevelASync(sceneName));
    }

    IEnumerator LoadLevelASync(string levelToLoad)
    {
        AsyncOperation operation = SceneManager.LoadSceneAsync(levelToLoad);

        while (!operation.isDone)
        {
            float progressValue = Mathf.Clamp01(operation.progress / 0.9f);
            loadingSlider.value = progressValue;
            yield return null;
        }
    }
}
