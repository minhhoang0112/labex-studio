using System;
using System.Diagnostics;
using System.IO;
using System.Security.Cryptography;
using System.ServiceProcess;
using System.Text;
using System.Threading;
using System.Xml;

// A real SCM-managed service used only inside the owned CLIENT01 lab workspace.
// It processes text requests; no commands, scripts, network listeners or user input execute.
public sealed class LabExDocumentAgent : ServiceBase
{
    private readonly string root;
    private Thread worker;
    private readonly ManualResetEvent stopping = new ManualResetEvent(false);
    private string catalog;
    public LabExDocumentAgent(string directory)
    {
        root = Path.GetFullPath(directory);
        ServiceName = "LabExDocumentAgentV2";
        AutoLog = false;
        CanStop = true;
    }
    private void Log(string message, EventLogEntryType kind)
    {
        File.AppendAllText(Path.Combine(root, "Logs", "agent.log"), DateTime.UtcNow.ToString("o") + " " + message + Environment.NewLine);
        try { System.Diagnostics.EventLog.WriteEntry(ServiceName, message, kind, kind == EventLogEntryType.Error ? 1001 : 1000); } catch { }
    }
    private static void NoLink(string file)
    {
        if ((File.GetAttributes(file) & FileAttributes.ReparsePoint) != 0)
            throw new IOException("Reparse points are not supported in the lab workspace: " + file);
    }
    public static string LoadCatalog(string rootDirectory)
    {
        string ownedRoot = Path.GetFullPath(rootDirectory);
        NoLink(ownedRoot);
        NoLink(Path.Combine(ownedRoot, "agent.config"));
        var settings = new XmlReaderSettings { DtdProcessing = DtdProcessing.Prohibit, XmlResolver = null };
        var config = new XmlDocument { XmlResolver = null };
        using (var reader = XmlReader.Create(Path.Combine(ownedRoot, "agent.config"), settings)) config.Load(reader);
        XmlNode node = config.SelectSingleNode("/settings/dataDirectory");
        if (node == null) throw new InvalidDataException("Missing dataDirectory setting");
        string directory = Path.GetFullPath(node.InnerText.Trim());
        // Paths are limited to immediate children of this disposable workspace.
        if (!String.Equals(Path.GetDirectoryName(directory.TrimEnd(Path.DirectorySeparatorChar)), ownedRoot.TrimEnd(Path.DirectorySeparatorChar), StringComparison.OrdinalIgnoreCase))
            throw new InvalidDataException("Data directory must be inside the lab workspace");
        if (!Directory.Exists(directory)) throw new DirectoryNotFoundException("Data directory not found: " + directory);
        NoLink(directory);
        string file = Path.Combine(directory, "catalog.txt");
        NoLink(file);
        return File.ReadAllText(file);
    }
    public static string Receipt(string request, string catalogText)
    {
        using (var hash = SHA256.Create())
            return "PROCESSED|" + BitConverter.ToString(hash.ComputeHash(Encoding.UTF8.GetBytes(request + "|" + catalogText))).Replace("-", "");
    }
    public static void ProcessRequests(string rootDirectory, string catalogText)
    {
        string inbox = Path.Combine(rootDirectory, "Inbox"), outbox = Path.Combine(rootDirectory, "Outbox");
        NoLink(inbox); NoLink(outbox);
        int count = 0;
        foreach (string input in Directory.EnumerateFiles(inbox, "*.txt"))
        {
            if (++count > 32) break;
            NoLink(input);
            if (new FileInfo(input).Length > 16384) continue;
            string output = Path.Combine(outbox, Path.GetFileNameWithoutExtension(input) + ".receipt");
            if (File.Exists(output)) { NoLink(output); continue; }
            // An existing output is never overwritten. Grading uses a new random filename.
            using (var stream = new FileStream(output, FileMode.CreateNew, FileAccess.Write, FileShare.Read))
            using (var writer = new StreamWriter(stream, new UTF8Encoding(false)))
                writer.Write(Receipt(File.ReadAllText(input), catalogText));
        }
    }
    protected override void OnStart(string[] args)
    {
        try
        {
            catalog = LoadCatalog(root);
            stopping.Reset();
            worker = new Thread(() => {
                while (!stopping.WaitOne(500))
                {
                    try { ProcessRequests(root, catalog); }
                    catch (Exception error) { Log(error.GetType().Name + ": " + error.Message, EventLogEntryType.Error); }
                }
            });
            worker.IsBackground = true;
            worker.Start();
            Log("Agent started under " + System.Security.Principal.WindowsIdentity.GetCurrent().Name, EventLogEntryType.Information);
        }
        catch (Exception error)
        {
            Log(error.GetType().Name + ": " + error.Message, EventLogEntryType.Error);
            throw;
        }
    }
    protected override void OnStop()
    {
        stopping.Set();
        if (worker != null && !worker.Join(5000)) throw new System.TimeoutException("Worker did not stop");
        Log("Agent stopped", EventLogEntryType.Information);
    }
    public static void Main()
    {
        ServiceBase.Run(new LabExDocumentAgent(AppDomain.CurrentDomain.BaseDirectory));
    }
}
