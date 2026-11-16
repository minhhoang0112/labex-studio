using System;
using System.Diagnostics;
using System.IO;
using System.Threading;

// A bounded CPU incident, not a stress test. No networking or child processes.
public static class LabExPerformanceApp {
    public static int Main(string[] args) {
        if(args.Length != 1 || (args[0] != "worker" && args[0] != "helper")) return 2;
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string mode = args[0];
        using(Process self = Process.GetCurrentProcess()) {
            self.PriorityClass = ProcessPriorityClass.BelowNormal;
            File.WriteAllText(Path.Combine(root,mode+".pid"),self.Id+"|"+self.StartTime.ToUniversalTime().Ticks);
            Stopwatch lifetime = Stopwatch.StartNew();
            if(mode == "worker") {
                // One thread, about 60 ms busy / 40 ms sleep, independent of CPU count.
                // No growing collection or disk fill. Auto-stop even if the learner leaves.
                while(lifetime.Elapsed.TotalMinutes < 30) {
                    Stopwatch slice = Stopwatch.StartNew();
                    while(slice.ElapsedMilliseconds < 60) Thread.SpinWait(1000);
                    Thread.Sleep(40);
                }
                return 70; // Expiry must never count as a learner repair.
            }
            string last = "";
            while(lifetime.Elapsed.TotalMinutes < 45) {
                try {
                    string file = Path.Combine(root,"request.txt");
                    if(File.Exists(file)) {
                        string value = File.ReadAllText(file);
                        if(value != last && value.Length == 32) {
                            File.WriteAllText(Path.Combine(root,"response.txt"),"OK|"+value);
                            last=value;
                        }
                    }
                } catch(IOException) { /* Reader/writer collision: retry on next tick. */ }
                Thread.Sleep(250);
            }
            return 70;
        }
    }
}
