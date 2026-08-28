public static class Sesion
{
    public static string AccessToken;   // la "pulsera de acceso"
    public static string UserId;        // el id del alumno
    public static bool HaIniciado => !string.IsNullOrEmpty(AccessToken);
}
