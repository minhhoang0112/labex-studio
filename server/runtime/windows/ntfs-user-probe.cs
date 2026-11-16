using System;
using System.IO;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Security.Principal;

// Runs synchronous I/O with a real local user's token, never the caller's SYSTEM token.
public static class LabExNtfsProbe {
    [DllImport("advapi32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
    static extern bool LogonUser(string user, string domain, string password, int type, int provider, out IntPtr token);
    [DllImport("kernel32.dll", SetLastError=true)] static extern bool CloseHandle(IntPtr token);
    static bool Denied(Action operation) {
        try { operation(); return false; }
        catch (UnauthorizedAccessException) { return true; }
    }
    public static bool Test(string user, string password, string expectedSid, string directory, string mode) {
        if (mode != "writer" && mode != "readonly" && mode != "outsider") throw new ArgumentException("Invalid probe mode");
        IntPtr token;
        if (!LogonUser(user, Environment.MachineName, password, 2, 0, out token))
            throw new Win32Exception(Marshal.GetLastWin32Error(), "Cannot obtain lab user token");
        try {
            using (WindowsImpersonationContext context = WindowsIdentity.Impersonate(token)) {
                using (WindowsIdentity identity = WindowsIdentity.GetCurrent()) {
                    if (identity.User.Value != expectedSid || new WindowsPrincipal(identity).IsInRole(WindowsBuiltInRole.Administrator))
                        throw new InvalidOperationException("Wrong identity or administrator token");
                }
                string sample = Path.Combine(directory, "reference.txt");
                string fresh = Path.Combine(directory, "probe-" + Guid.NewGuid().ToString("N") + ".txt");
                string renamed = fresh + ".moved";
                if (mode == "outsider") {
                    // Logon failure, missing fixtures and sharing violations must NOT count as denied access.
                    bool blocked = Denied(delegate { File.ReadAllText(sample); });
                    blocked &= Denied(delegate { Directory.GetFiles(directory); });
                    blocked &= Denied(delegate { using (FileStream s = new FileStream(sample, FileMode.Open, FileAccess.Write)) {} });
                    blocked &= Denied(delegate { using (FileStream s = new FileStream(fresh, FileMode.CreateNew, FileAccess.Write)) {} });
                    return blocked;
                }
                if (File.ReadAllText(sample).Trim() != "Department reference - preserve this original.") return false;
                if (mode == "readonly") {
                    bool blocked = Denied(delegate { using (FileStream s = new FileStream(sample, FileMode.Open, FileAccess.Write)) {} });
                    blocked &= Denied(delegate { using (FileStream s = new FileStream(fresh, FileMode.CreateNew, FileAccess.Write)) {} });
                    return blocked;
                }
                string content = Guid.NewGuid().ToString("N");
                try {
                    // Existing admin-created file must be writable too; do not modify its bytes.
                    using (FileStream existing = new FileStream(sample, FileMode.Open, FileAccess.Write)) {}
                    File.WriteAllText(fresh, content);
                    File.AppendAllText(fresh, "-updated");
                    if (File.ReadAllText(fresh) != content + "-updated") return false;
                    File.Move(fresh, renamed);
                    File.Delete(renamed);
                    return !File.Exists(renamed);
                } catch (UnauthorizedAccessException) { return false; }
                finally {
                    // Only this invocation's random files; never learner documents.
                    try { File.Delete(fresh); } catch (UnauthorizedAccessException) {}
                    try { File.Delete(renamed); } catch (UnauthorizedAccessException) {}
                }
            }
        } finally { CloseHandle(token); }
    }
}
