public static class Sesion
{
    public static string AccessToken;
    public static string UserId;
    public static string GroupId;
    public static bool HaIniciado => !string.IsNullOrEmpty(AccessToken);

    // Convierte el usuario que escribe el alumno en el email interno.
    public static string UsuarioAEmail(string usuario)
    {
        return usuario.Trim().ToLower() + "@humania.local";
    }
}
