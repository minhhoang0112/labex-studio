"""Fast real-Bash regression for Shell8–18 state probes (run as non-root Linux).

No learner paths are touched: absolute targets are replaced with a fresh /tmp
workspace. Interactive terminal journals are covered by source-course.smoke.mjs.
"""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("reviewed_later", ROOT/"scripts/shell_reviewed_later.py")
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def main():
    assert os.name=="posix" and os.geteuid()!=0, "Use the normal Linux user so permission checks are real"
    results=[]
    for sid,lesson in module.LESSONS.items():
        with tempfile.TemporaryDirectory(prefix="labex-shell-regression-") as temporary:
            project=Path(temporary)/"project"
            project.mkdir()
            for filename,content in lesson["fixture"].items():
                target=project/filename
                if content is None:target.mkdir(parents=True)
                else:target.write_text(content);target.chmod(0o755 if filename.endswith(".sh") else 0o644)
            for index,task in enumerate(lesson["tasks"],1):
                command=module.checker(task)["command"].replace(module.PROJECT,str(project)+"/")
                def check():
                    return subprocess.run(["/bin/bash","-c",command],capture_output=True,text=True,timeout=5,cwd=project)
                before=check()
                # Explicit run steps have a separate required completed-command
                # journal. A correct script alone is intentionally insufficient.
                if not task["run"]:
                    assert before.returncode!=0,(sid,index,"Unexpected pass before doing task",before.stdout)
                target=project/task["file"]
                if task["file"]=="bash_loops":target.mkdir()
                else:
                    target.parent.mkdir(parents=True,exist_ok=True)
                    target.write_text(task["code"])
                    target.chmod(0o755 if task["executable"] else 0o644)
                after=check()
                assert after.returncode==0,(sid,index,after.stdout,after.stderr)
                # A syntax-valid but unrelated script cannot pass behavior rules.
                wrong=None
                if target.is_file() and target.suffix==".sh" and not task["command"] and (task["output"] or task["extra_assert"] or any(token!="#!/bin/bash" for token in task["contains"])):
                    original=target.read_text()
                    target.write_text("#!/bin/bash\necho unrelated\n")
                    wrong=check().returncode
                    assert wrong!=0,(sid,index,"Unrelated script passed")
                    target.write_text(original)
                results.append({"source_lab_id":sid,"section":index,"state_negative_before":before.returncode!=0,"requires_terminal_run":task["run"],"state_positive":True,"unrelated_script_rejected":wrong is not None})
    report={"complete":True,"state_probes":len(results),"results":results}
    artifact=ROOT/".artifacts/shell-reviewed-later-state-regression.json"
    artifact.parent.mkdir(exist_ok=True)
    artifact.write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps({"complete":True,"state_probes":len(results),"report":str(artifact)}))


if __name__=="__main__":main()
