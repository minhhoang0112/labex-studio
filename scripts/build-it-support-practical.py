"""First substantial workstation incident for the Windows curriculum redesign.

Keep old lesson IDs/progress; add an independently verified incident with GUI
workflow and native Windows components, not collector/answer-generation scripts.
"""
import copy
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'server/data'
LID='win-it-scheduled-backup-permissions'


def section(n,title,body,is_task=False,**extra):
    return dict(id=f'{LID}-sec-{n}',position=n,title=title,title_vi=title,content=body,content_vi=body,
                kind='task' if is_task else ('introduction' if n==0 else 'summary' if n==3 else 'document'),need_verify=is_task,**extra)


def build():
    intro='''## Ticket: lịch sao lưu vẫn bật nhưng tài liệu không được sao lưu

### Bối cảnh công việc
Bạn trực IT Support. Nhân viên kế toán báo: “Tôi thấy lịch backup vẫn tồn tại, nhưng thư mục Backup không có bản mới.” Người dùng vẫn mở được tài liệu gốc. Bạn cần khôi phục sao lưu mà không cấp quyền quản trị cho tác vụ và không đổi quyền những thư mục ngoài bài.

### Mục tiêu bàn giao
- Xác định tác vụ chạy bằng tài khoản nào, không chỉ nhìn Ready/Enabled.
- Đọc lỗi của lần chạy gần nhất và đối chiếu với quyền NTFS thư mục đích.
- Sửa quyền tối thiểu, chạy lại và kiểm tra nội dung sao lưu thực sự mới.
- Hoàn nguyên đúng tài nguyên do lab tạo, giữ nguyên dữ liệu khác trên VM.

### Môi trường và phạm vi
Chỉ cần CLIENT01 Windows 11. Đây là sự cố **thực thi tác vụ và quyền NTFS thật** bằng Task Scheduler/PowerShell của Windows. Dữ liệu tài chính là mẫu trong `C:\\LabEx\\PracticeFaults\\taskacl`; không phải ứng dụng kế toán thương mại. Không có Windows Server/domain trong bài này.

Bấm **Chuẩn bị sự cố** rồi đợi xác minh hoàn tất. Hệ thống tạo tác vụ `LabExSupportBackupAcl`, ba thư mục Source/Backup/Logs và script sao chép ngắn. Tác vụ chạy dưới **LOCAL SERVICE**, không phải tài khoản bạn mở Desktop. Nạp lỗi chỉ làm mất quyền ghi vào Backup; tác vụ vẫn bật. Trước khi nạp, hệ thống phải chứng minh tác vụ chạy tốt; sau nạp phải chứng minh tác vụ chạy thật và thất bại.

Bạn thao tác chủ yếu qua GUI; các lệnh ngắn bên dưới dùng để đối chiếu. Không có khối tạo báo cáo JSON cần chép để được điểm. Không xem lời giải sửa quyền trước khi đã tự ghi giả thuyết. LOCAL SERVICE là danh tính ít quyền; thuộc tính RunLevel không biến tài khoản tích hợp này thành Administrator.
'''
    diagnosis='''## Chẩn đoán trước khi sửa

### Tiếp nhận và khoanh vùng
Ghi lại: máy nào, nguồn/đích ở đâu, lần backup thành công gần nhất và lỗi hiện tại. Trong lab, tài liệu gốc nằm ở Source và phải được giữ nguyên. Chỉ có một tác vụ bị tác động; không cần reboot hay reset Windows.

### Đọc ba màn hình GUI
1. Win+R → `taskschd.msc` → Task Scheduler Library → **LabExSupportBackupAcl**.
2. Tab **General**: đọc tài khoản thực thi và Run with highest privileges. Ghi lại LOCAL SERVICE; đây là service account tích hợp, không phải adminlab đang dùng Desktop.
3. Tab **Actions**: đọc chương trình và đường dẫn `backup.ps1`. Tab Triggers cho biết lịch khi nào chạy, không chứng minh action thành công. Bấm Refresh để xem **Last Run Result**, không chỉ State=Ready.
4. Explorer → `C:\\LabEx\\PracticeFaults\\taskacl\\Logs` → mở `last-run.txt` bằng Notepad. Nhật ký này được script backup ghi lúc lỗi thật xảy ra, không phải dòng lỗi giả do trang web hiển thị.
5. Nhấp phải thư mục **Backup** → Properties → Security. Đối chiếu quyền LOCAL SERVICE. Nhìn tiếp Source để giải thích vì sao đọc được tài liệu nhưng không ghi được bản sao.

### Ba lệnh để kiểm tra nhận định
```powershell
Get-ScheduledTask -TaskName LabExSupportBackupAcl | Select-Object TaskName, State, Principal
```
`Principal` mô tả danh tính của task. UserId khác tài khoản bạn đang dùng có nghĩa quyền cần kiểm tra cũng khác.

```powershell
Get-ScheduledTaskInfo -TaskName LabExSupportBackupAcl | Select-Object LastRunTime, LastTaskResult
```
Một lần chạy lỗi trong bài trả mã 5 từ script backup; đọc log để xác định thao tác bị từ chối. Không học thuộc một mã lỗi để đoán mọi ticket.

```powershell
Get-Content 'C:\\LabEx\\PracticeFaults\\taskacl\\Logs\\last-run.txt'
```
Đối chiếu danh tính và đường dẫn trong lỗi. Ở đây account có quyền đọc/chạy script nhưng không có quyền ghi vào thư mục Backup. Không cần thay đổi execution policy của cả máy.

### Tự kết luận trước khi mở phần sửa
Tự viết bốn dòng: triệu chứng → bằng chứng → nguyên nhân có khả năng nhất → thay đổi nhỏ nhất. Nếu chạy Copy-Item bằng cửa sổ admin của bạn thành công, điều đó có chứng minh task LOCAL SERVICE cũng thành công không?

Phần quan sát này không được tự động chấm chỉ vì cấu hình lỗi đang tồn tại; chuyển sang sửa và kiểm tra chức năng để được xác nhận kết quả.
'''
    repair='''## Sửa quyền tối thiểu và kiểm tra tác vụ thật

### Tự sửa bằng GUI
Sau khi đã nêu giả thuyết: mở Properties → Security của **đúng thư mục Backup**. Cấp **Modify** cho **LOCAL SERVICE** trên thư mục này, thư mục con và tệp. Giữ nguyên Full control của SYSTEM và Administrators; không cấp Everyone/Users Full control. Không đổi tài khoản chạy task sang SYSTEM hoặc Administrator để né vấn đề.

Nếu nút sửa quyền yêu cầu elevation, dùng tài khoản quản trị lab để sửa ACL. Quyền của người sửa và quyền task dùng khi chạy là hai điều khác nhau. LOCAL SERVICE không cần có quyền thay ACL; chỉ cần đọc/ghi bản sao trong phạm vi thư mục đích.

### Nếu cần đối chiếu cách làm bằng lệnh
```powershell
icacls 'C:\\LabEx\\PracticeFaults\\taskacl\\Backup' /grant '*S-1-5-19:(OI)(CI)M'
```
`S-1-5-19` là SID của LOCAL SERVICE, dùng được khi tên hiển thị của Windows khác ngôn ngữ. `(OI)` áp dụng kế thừa xuống tệp; `(CI)` xuống thư mục con; `M` là Modify. Lệnh chỉ thêm quyền ở đúng thư mục bài; không chạy trên C:\\ hoặc C:\\Windows. Gõ trong PowerShell nâng quyền trên Desktop nếu cần.

### Chạy lại và xác nhận bằng dữ liệu
Task Scheduler → nhấp phải tác vụ → Run. Đợi tác vụ hoàn thành rồi Refresh, xem LastRunTime mới và LastTaskResult=0. Mở thư mục Backup và đối chiếu bản sao với Source.

```powershell
Start-ScheduledTask -TaskName LabExSupportBackupAcl
```
Lệnh này yêu cầu chạy task, không đợi backup xong. Đọc lại `Get-ScheduledTaskInfo` sau khi hoàn tất, không kết luận chỉ vì Start-ScheduledTask không báo lỗi.

```powershell
Get-FileHash 'C:\\LabEx\\PracticeFaults\\taskacl\\Source\\invoice.txt'
Get-FileHash 'C:\\LabEx\\PracticeFaults\\taskacl\\Backup\\invoice.txt'
```
Hai Hash phải khớp. Sau đó bấm **Kiểm tra kết quả**. Bộ chấm tạo thêm một tệp thăm dò mới trong Source, chạy lại **chính task dưới LOCAL SERVICE**, kiểm tra mã thoát và hash bản sao mới rồi dọn tệp thăm dò. Chép tay invoice.txt hoặc chỉ sửa chữ trong log không đủ đạt.

### Tiêu chí bàn giao
Task vẫn dùng LOCAL SERVICE, giữ cấu hình RunLevel ban đầu và action ban đầu; thư mục đích không được mở quyền ghi rộng cho Everyone/Users; source không bị sửa; một lần chạy mới phải sao chép được dữ liệu mới. Token của LOCAL SERVICE quyết định quyền khi chạy, không phải tài khoản quản trị đang mở GUI. Không chỉ nhìn quyền trên GUI hoặc file cũ đã có.

### Tự giải thích (không chấm tự động)
Vì sao task Enabled vẫn có thể thất bại? Vì sao Run as administrator ở cửa sổ bạn dùng không sửa quyền của task? Vì sao cấp Full control rộng hơn Modify và không phải lựa chọn mặc định?
'''
    summary='''## Hoàn nguyên và bàn giao

Ghi ticket ngắn: tác vụ vẫn bật → log chỉ ra lỗi ghi thư mục đích dưới LOCAL SERVICE → cấp Modify đúng Backup → chạy lại thành công, hash khớp và thử được dữ liệu mới. Nêu rõ đây là backup tệp mẫu trên cùng VM, chưa thử backup mạng, mã hóa, ổ hỏng hoặc khả năng phục hồi toàn máy.

Bấm **Hoàn nguyên kịch bản** khi học xong. Nó kiểm tra ownership của task và thư mục, xóa đúng task/thư mục do bài tạo rồi kiểm tra không còn; không phục hồi cả VM và không xóa task khác. Nếu task/action bị bạn đổi sang tài nguyên ngoài bài, hệ thống phải từ chối thao tác tiếp thay vì chạy hoặc xóa nhầm.

Phần nâng cao tự luyện: xem nội dung backup.ps1 (chỉ vài dòng Copy-Item và xử lý lỗi), giải thích mỗi tham số; viết runbook xử lý một tác vụ có principal khác tài khoản đăng nhập. Bài hai máy về backup qua SMB sẽ bổ sung bước kiểm tra quyền share và quyền NTFS ở server, không dùng phép thử cục bộ này để tuyên bố đã kiểm chứng backup mạng.
'''
    steps=[section(2,'Khôi phục sao lưu với đúng quyền tối thiểu',repair,True,
                   task='Task LOCAL SERVICE chạy thành công với dữ liệu mới; đúng action ban đầu, không cấp quyền ghi rộng hoặc đổi task sang admin.',
                   task_vi='Task LOCAL SERVICE chạy thành công với dữ liệu mới; đúng action ban đầu, không cấp quyền ghi rộng hoặc đổi task sang admin.',
                   hint='Đối chiếu principal và ACL trước. Sửa quyền LOCAL SERVICE ở đúng Backup, giữ nguyên task/action; chạy lại và kiểm tra file mới, không chỉ State=Ready.',
                   hint_vi='Đối chiếu principal và ACL trước. Sửa quyền LOCAL SERVICE ở đúng Backup, giữ nguyên task/action; chạy lại và kiểm tra file mới, không chỉ State=Ready.',
                   verification={'kind':'windows-remote'},required_capabilities=['windows-remote'])]
    lab=dict(id=LID,course_id='windows-11-it-support-troubleshooting',order=26,
             title='Ticket thực tế: backup vẫn bật nhưng lỗi Access denied',title_vi='Ticket thực tế: backup vẫn bật nhưng lỗi Access denied',
             type='lab',difficulty='Intermediate',estimated_time='45–60 mins',target_vm='client',curriculum_version=4,
             curriculum_group='IT Support thực hành: chẩn đoán theo danh tính và quyền',practice_mode='fault-injection',
             overview='Chẩn đoán Scheduled Task có action đúng và vẫn Enabled nhưng thất bại do quyền NTFS của account thực thi; sửa tối thiểu và xác minh lần chạy mới.',
             ticket=dict(ticket_id='HD-P01',requester='Kế toán',priority='Normal',title='Lịch backup vẫn bật nhưng không có bản sao mới; chạy bằng tài khoản admin lại được.'),
             references=[dict(publisher='Microsoft',url=u) for u in [
               'https://learn.microsoft.com/en-us/windows/win32/taskschd/security-contexts-for-running-tasks',
               'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/icacls']],
             sections=[section(0,'Tiếp nhận ticket và phạm vi',intro),section(1,'Đọc principal, log và quyền thực tế',diagnosis),copy.deepcopy(steps[0]),section(3,'Bàn giao và hoàn nguyên',summary)],steps=steps)
    (DATA/'labs'/f'{LID}.json').write_text(json.dumps(lab,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    courses=json.loads((DATA/'courses.json').read_text(encoding='utf-8'))
    course=next(c for c in courses if c['id']==lab['course_id'])
    course['labs_count']=26
    course['description']='Khóa đang được nâng cấp theo ticket vận hành. Giữ 25 bài nền tảng/chẩn đoán cũ; bổ sung HD-P01 về tác vụ sao lưu LOCAL SERVICE lỗi quyền NTFS, có nạp lỗi và kiểm tra chức năng trên CLIENT01. Các chủ đề cần Server/domain thuộc nhánh tiếp theo; chưa coi toàn khóa là giáo trình thực tế đã hoàn thiện.'
    (DATA/'courses.json').write_text(json.dumps(courses,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    roadmap=json.loads((DATA/'windows-roadmap.json').read_text(encoding='utf-8'))
    track=next(c for c in roadmap['courses'] if c['id']==lab['course_id'])
    track['practice_strategy']='Ưu tiên ticket vận hành HD-P01; chẩn đoán theo principal/log/ACL, sửa tối thiểu rồi kiểm thử chức năng. Các bài cũ giữ để tham khảo, đang được nâng cấp theo cùng tiêu chuẩn.'
    track['syllabus_modules'][1]['planned_lessons']=['25 bài cũ để tham khảo: 7 kịch bản nạp lỗi cùng các bài cấu hình/chẩn đoán; chưa đồng nghĩa toàn bộ là ticket doanh nghiệp.']
    module={'id':lab['course_id']+'-practical-v2','title':'Ticket vận hành đang nâng cấp','planned_lessons':[lab['title_vi']],'lab_ids':[LID]}
    track['syllabus_modules']=[m for m in track['syllabus_modules'] if m['id']!=module['id']]+[module]
    (DATA/'windows-roadmap.json').write_text(json.dumps(roadmap,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Published HD-P01: real LOCAL SERVICE / Task Scheduler / NTFS incident; one functional repair task, observation is ungraded.')


if __name__=='__main__':build()
