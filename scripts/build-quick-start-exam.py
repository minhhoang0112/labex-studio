"""Locally authored assessment: references existing lesson/task IDs, not LabEx's exam."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
groups = []


def group(lab_id, rows):
    lab = json.loads((ROOT / f'server/data/labs/{lab_id}.json').read_text(encoding='utf-8'))
    questions = []
    for index, (steps, skill, prompt, options, correct, explanation) in enumerate(rows, 1):
        questions.append(dict(id=f'q{len(groups)+1:02}-{index:02}', lab_id=lab_id,
            source_step_ids=[lab['steps'][i-1]['id'] for i in steps], skill=skill,
            prompt=prompt, options=[dict(id=chr(97+i), text=t) for i, t in enumerate(options)],
            correct_option_id=chr(97+correct), explanation=explanation))
    groups.append(dict(lab_id=lab_id, title=lab.get('title_vi', lab['title']), questions=questions))


group('linux-your-first-linux-lab', [
([1], 'echo', 'Lệnh nào in ra Hello LabEx?', ['echo "Hello LabEx"', 'cd "Hello LabEx"', 'whoami Hello LabEx', 'mkdir Hello LabEx'], 0, 'echo in các đối số ra đầu ra chuẩn; nó không tạo thư mục hay chuyển vị trí.'),
([1], 'case', 'Vì sao Echo có thể báo command not found trong khi echo chạy được?', ['Linux tự dịch tên lệnh', 'Tên lệnh phân biệt chữ hoa và chữ thường', 'Terminal cần khởi động lại', 'Chỉ root được chạy echo'], 1, 'Trong Linux, echo và Echo là hai tên khác nhau; echo thường là shell builtin.'),
([2], 'whoami', 'Bạn vừa chuyển tài khoản. Lệnh nào xem tên người dùng hiệu lực hiện tại?', ['pwd', 'hostname', 'whoami', 'ls'], 2, 'whoami báo tên gắn với UID hiệu lực của tiến trình hiện tại, không phải tên máy hoặc đường dẫn.'),
([3], 'id', 'id hiển thị những thông tin nào?', ['Chỉ thư mục home', 'UID, GID chính và các nhóm', 'Danh sách tệp ẩn', 'Mật khẩu hiện tại'], 1, 'id cho biết định danh người dùng, nhóm chính và các nhóm bổ sung; không hiển thị mật khẩu.'),
([4], 'id-un', 'Muốn id chỉ in tên người dùng hiện tại, chọn lệnh nào?', ['id -un', 'id -g', 'id root', 'id -u'], 0, '-u chọn UID hiệu lực, -n yêu cầu tên thay cho số. id -u đơn lẻ in số UID.'),
([5], 'learning', 'Cách ôn tập phù hợp nhất sau khi đọc một lệnh mới là gì?', ['Chỉ bấm Tiếp tục', 'Ghi nhớ ảnh màn hình', 'Tự chạy trong môi trường lab, dự đoán rồi kiểm tra kết quả', 'Chạy trên máy sản xuất ngay'], 2, 'Học qua thực hành cần quan sát kết quả thật trong môi trường lab; hoàn tất phần đọc không chứng minh đã thực hành.'),
])
group('linux-display-user-and-group-information', [
([1], 'identity', 'Yêu cầu chỉ hiển thị tên tài khoản đang chạy shell. Hai lệnh nào tương đương?', ['whoami và id -un', 'pwd và ls', 'id và ls -l', 'echo root và whoami'], 0, 'whoami và id -un lấy thông tin từ định danh hiệu lực, còn echo root chỉ in một chuỗi cố định.'),
([1], 'identity-vs-text', 'echo labex có chứng minh shell đang chạy dưới tài khoản labex không?', ['Có, vì kết quả giống mẫu', 'Không, vì chỉ in chuỗi tự nhập', 'Có nếu dùng dấu nháy', 'Có nếu chạy hai lần'], 1, 'Kết quả trùng chuỗi mẫu không chứng minh danh tính. Cần lệnh truy vấn danh tính thực tế.'),
([2], 'uid', 'Trong uid=1000(labex), số 1000 là gì?', ['Cổng mạng', 'Mã định danh người dùng', 'Quyền truy cập tệp', 'Số nhóm'], 1, 'UID là định danh số của người dùng. Giá trị cụ thể có thể khác giữa các môi trường.'),
([2], 'gid', 'gid trong kết quả id biểu thị gì?', ['Nhóm chính của người dùng', 'Mọi nhóm đều có cùng ID', 'Thư mục đang đứng', 'Địa chỉ máy chủ'], 0, 'GID là định danh nhóm chính; trường groups liệt kê các nhóm người dùng thuộc về.'),
([2], 'root', 'UID nào là định danh siêu người dùng root thông thường trên Linux?', ['1000', '5000', '0', '27'], 2, 'UID 0 là định danh siêu người dùng. Không nên suy ra tài khoản quản trị chỉ từ một tên chuỗi tự in.'),
([2], 'variable-output', 'id trả UID 1000 thay vì 5000 như ảnh ví dụ. Cách hiểu đúng là gì?', ['Luôn làm sai', 'Phải đổi UID cho giống ảnh', 'ID có thể khác; cần đọc đúng ý nghĩa các trường', 'Phải tạo lại máy ảo'], 2, 'UID/GID phụ thuộc cách tạo tài khoản và image; học ý nghĩa và trạng thái thực tế thay vì sao chép số mẫu.'),
])
group('linux-basic-files-operations', [
([1], 'pwd', 'pwd dùng để làm gì?', ['In thư mục làm việc hiện tại', 'In thư mục home bất kể đang ở đâu', 'Đổi mật khẩu', 'Liệt kê tệp ẩn'], 0, 'pwd cho biết vị trí hiện tại. Cwd và home là hai khái niệm khác nhau.'),
([1], 'home', 'Đang ở /home/labex/project, echo ~ thường in gì với user labex của lab?', ['/home/labex/project', '/home/labex', '/', '/tmp'], 1, 'Shell mở rộng ~ thành thư mục home của người dùng, không thành thư mục hiện tại.'),
([2], 'parent', 'Từ /home/labex/project, cd .. đưa bạn tới đâu?', ['/home/labex', '/home', '/', '/project'], 0, '.. là thư mục cha; không phải root hoặc home trong mọi trường hợp.'),
([2], 'absolute-relative', 'Lệnh nào dùng đường dẫn tuyệt đối để tới thư mục project của lab?', ['cd project', 'cd ../project', 'cd /home/labex/project', 'cd ./project'], 2, 'Đường dẫn tuyệt đối bắt đầu từ / và không phụ thuộc vị trí hiện tại.'),
([3], 'touch', 'touch new.txt khi tệp chưa tồn tại sẽ làm gì?', ['Tạo thư mục', 'Tạo tệp rỗng', 'Mở trình soạn thảo', 'Tạo người dùng'], 1, 'touch tạo tệp rỗng nếu chưa có; với tệp đã tồn tại, mặc định cập nhật timestamp, không xóa nội dung.'),
([3], 'redirection', 'echo "Hello, Linux" > file2.txt với file2.txt đã có nội dung sẽ thế nào?', ['Luôn nối cuối', 'Ghi đè nội dung tệp bằng đầu ra mới', 'Báo lỗi vì tệp tồn tại', 'Chỉ in màn hình'], 1, '> chuyển hướng và mặc định ghi đè; >> mới dùng để nối cuối trong shell của lab.'),
([3], 'listing', 'Tùy chọn ls nào kết hợp thông tin chi tiết và cả tệp ẩn?', ['ls -la', 'ls -l', 'ls', 'ls -d'], 0, '-l hiển thị dạng dài, -a bao gồm các tên bắt đầu bằng dấu chấm.'),
([4], 'copy-file', 'cp file2.txt testdir/ thành công thì kết quả là gì?', ['file2.txt bị xóa khỏi nguồn', 'Có bản sao testdir/file2.txt và nguồn vẫn còn', 'testdir bị đổi tên', 'Chỉ in nội dung tệp'], 1, 'cp tạo bản sao; nguồn được giữ nguyên. Dấu / ở đích chỉ thư mục.'),
([4], 'copy-directory', 'Với GNU cp trong lab, muốn sao chép cây thư mục, cách nào hợp lệ?', ['cp -r testdir testdir_copy', 'cp testdir testdir_copy luôn đủ', 'cat testdir testdir_copy', 'touch testdir_copy'], 0, 'cp -r sao chép đệ quy. GNU cp còn có -R; -a cũng bao gồm đệ quy, nên -r không phải cách duy nhất.'),
([5], 'move', 'mv file1.txt newname.txt khi đích chưa tồn tại dùng để làm gì?', ['Sao chép và giữ cả hai tên', 'Đổi tên/di chuyển và bỏ tên nguồn cũ', 'So sánh hai tệp', 'Chỉ tạo tệp rỗng'], 1, 'mv thay đổi tên hoặc vị trí. Khác cp, nguồn không còn ở đường dẫn cũ sau khi di chuyển thành công.'),
([6], 'rmdir', 'rmdir new_testdir báo Directory not empty. Điều này có nghĩa gì?', ['Cần đổi tên người dùng', 'Thư mục còn nội dung nên rmdir từ chối', 'Thư mục đã bị xóa', 'rmdir chỉ dùng cho tệp'], 1, 'rmdir chỉ xóa thư mục rỗng; lỗi này là hành vi dự kiến trong bài.'),
([6], 'rm-flags', 'Cặp mô tả nào đúng?', ['rm -i hỏi xác nhận; rm -rf xóa đệ quy và ép buộc', 'rm -i luôn bỏ qua mọi lỗi; -rf đưa vào thùng rác', 'rm -r chỉ đổi tên', 'rm -f luôn tạo bản sao lưu'], 0, 'rm -i yêu cầu xác nhận; -r đệ quy; -f ép buộc và bỏ qua tệp không tồn tại. Không có cơ chế thùng rác mặc định của rm.'),
])
group('linux-files-and-directories', [
([1], 'copy-hidden', 'Muốn sao chép ~/.zshrc thành ~/Desktop/zshrc-copy, chọn lệnh nào?', ['cp ~/.zshrc ~/Desktop/zshrc-copy', 'mv ~/.zshrc ~/Desktop/zshrc-copy', 'touch ~/Desktop/zshrc-copy', 'cat ~/Desktop'], 0, 'cp giữ tệp nguồn .zshrc và tạo bản sao đúng đích. Tệp bắt đầu dấu chấm vẫn dùng cp bình thường.'),
([1], 'copy-tree-target', 'Desktop tồn tại và chưa có Code bên trong. cp -r ~/Code ~/Desktop tạo gì?', ['~/Desktop/Code và cây nội dung bên trong', '~/Desktop bị xóa', '~/Code bị chuyển khỏi home', 'Chỉ tạo một tệp rỗng tên Desktop'], 0, 'Khi đích là thư mục tồn tại, cp đặt bản sao tên nguồn bên trong đích.'),
([2], 'rename-file', 'mv ~/Desktop/zshrc-copy ~/Desktop/zshrc-move có giữ zshrc-copy cũ không?', ['Có, luôn giữ', 'Không, sau khi đổi tên thành công chỉ còn tên mới', 'Chỉ giữ nếu tệp ẩn', 'Luôn tạo thư mục mới'], 1, 'Đổi tên bằng mv không để lại bản sao ở tên cũ.'),
([2], 'rename-directory', 'Đổi tên thư mục ~/Desktop/Code sang Code-move trong Desktop bằng lệnh nào?', ['mv ~/Desktop/Code ~/Desktop/Code-move', 'cp ~/Desktop/Code ~/Desktop/Code-move', 'renameuser Code Code-move', 'touch ~/Desktop/Code-move'], 0, 'mv đổi tên thư mục khi đích chưa tồn tại, đồng thời giữ nội dung của nó.'),
([3], 'delete-tree', 'Code-move không rỗng. Lệnh nào xóa nó và các tệp con?', ['rmdir ~/Desktop/Code-move', 'rm -r ~/Desktop/Code-move', 'rm ~/Desktop', 'ls -r ~/Desktop/Code-move'], 1, 'rm -r xóa cây thư mục; rmdir chỉ xóa thư mục rỗng.'),
([3], 'verify-removal', 'Sau khi xóa, cách kiểm tra đúng là gì?', ['Nhìn ảnh mẫu là đủ', 'Kiểm tra đường dẫn đích thực tế không còn, đồng thời không xóa nhầm nguồn cần giữ', 'Chỉ kiểm tra lệnh có chữ rm', 'Chạy rm thêm trên toàn bộ home'], 1, 'Cần kiểm tra trạng thái thật và đúng phạm vi; một chuỗi lệnh hoặc ảnh mẫu không chứng minh kết quả.'),
])
group('linux-file-contents-and-comparing', [
([1], 'cat', 'cat /tmp/hello mặc định làm gì?', ['Hiển thị nội dung tệp', 'Đánh số từng dòng', 'Chỉ hiển thị dòng đầu', 'Sửa nội dung'], 0, 'cat đọc tệp và ghi nội dung ra stdout, không chỉnh sửa tệp nguồn.'),
([2], 'cat-number', 'cat -n /tmp/hello thêm thông tin gì?', ['Số dòng', 'Quyền sở hữu', 'UID hiện tại', 'Mật khẩu'], 0, '-n đánh số các dòng đầu ra. Nội dung tệp gốc không bị thêm số.'),
([3], 'head-lines', 'Hai lệnh nào cùng đọc 1 dòng đầu?', ['head -n1 f và head -n 1 f', 'head -c1 f và head -n1 f luôn giống nhau', 'tail -n1 f và head -n1 f luôn giống nhau', 'cat -n f và head -n1 f'], 0, '-n nhận số dòng; GNU head chấp nhận đối số liền hoặc tách bằng khoảng trắng.'),
([4], 'head-bytes', 'head -c1 /tmp/hello đọc bao nhiêu?', ['1 dòng', '1 byte đầu', '1 từ', '1 tệp'], 1, '-c đếm byte, không phải dòng hay ký tự Unicode. Một ký tự UTF-8 có thể dài nhiều byte.'),
([5], 'tail-lines', 'tail -n1 f hiển thị phần nào?', ['Dòng đầu', 'Dòng cuối', 'Byte đầu', 'Tên tệp'], 1, '-n1 chọn một dòng từ cuối tệp theo hành vi mặc định của tail.'),
([6], 'tail-bytes', 'Một tệp kết thúc bằng ký tự a rồi newline (LF). tail -c1 lấy byte nào?', ['a', 'LF', 'Cả dòng cuối', 'Không có byte nào'], 1, 'Byte cuối là ký tự xuống dòng LF. Vì thế đầu ra có thể trông giống một dòng trắng.'),
([6], 'tail-two-bytes', 'Với cùng tệp kết thúc bằng a rồi LF, tail -c2 trả gì?', ['a và LF', 'Hai dòng cuối', 'Hai ký tự đầu', 'Chỉ LF'], 0, '-c2 lấy hai byte cuối; không phải hai dòng.'),
([7], 'diff-status', 'GNU diff trả exit code 1 khi nào?', ['Khi hai tệp khác nhau nhưng so sánh đã thực hiện được', 'Chỉ khi không tìm thấy tệp', 'Khi hai tệp giống nhau', 'Luôn là lỗi cú pháp'], 0, 'diff: 0 là giống nhau, 1 là có khác biệt, 2 là lỗi. Không nên coi mọi mã khác 0 đều là lỗi thực hành.'),
([7], 'diff-normal', 'Trong diff dạng thường, 2c2 có nghĩa gì?', ['Dòng 2 của tệp đầu được thay bằng dòng 2 của tệp sau', 'Hai tệp đã bị xóa', 'Có hai bản sao', 'Cổng TCP 22 bị lỗi'], 0, 'c là change. Các dòng < thuộc tệp đầu, > thuộc tệp sau trong dạng thường.'),
([8], 'diff-recursive', 'diff -r ~/Desktop ~/Code dùng để làm gì?', ['So sánh đệ quy các thư mục và nội dung tương ứng', 'Xóa hai thư mục', 'Đổi tên Code thành Desktop', 'Sao chép chỉ tệp ẩn'], 0, '-r mở rộng so sánh vào các thư mục con. diff quan sát và không sửa dữ liệu nguồn.'),
])
group('linux-the-manuscript-mystery', [
([1], 'manuscript-read', 'Theo yêu cầu bài bản thảo, head cần đọc phần nào?', ['2 dòng đầu manuscript_v2.txt', '3 dòng cuối manuscript_v1.txt', 'Toàn bộ cả hai tệp', '1 byte cuối manuscript_v2.txt'], 0, 'Yêu cầu đã đối chiếu nguồn là 2 dòng đầu bản v2; không phải 3 dòng theo bản dịch lỗi cũ.'),
([1], 'manuscript-tail', 'Lệnh nào đọc 1 dòng cuối của cả hai bản thảo?', ['tail -n1 manuscript_v1.txt manuscript_v2.txt', 'head -n1 manuscript_v1.txt', 'tail -n3 manuscript_v1.txt', 'cat -n manuscript_v2.txt'], 0, 'Có thể đưa hai tên tệp vào tail hoặc chạy hai lệnh tail riêng cho hai tệp.'),
([1], 'read-only', 'Nếu nội dung khác ảnh ví dụ cũ, có nên sửa tệp cho giống để đạt không?', ['Có, luôn ghi đè', 'Không; bài yêu cầu khảo sát dữ liệu có sẵn và không sửa tệp', 'Xóa cả hai rồi tạo tệp rỗng', 'Đổi tên tệp để che khác biệt'], 1, 'Đây là bài quan sát/so sánh. Nếu tài liệu lệch fixture thì cần sửa tài liệu, không yêu cầu học viên làm sai mục tiêu.'),
([2], 'diff-direction', 'diff bản v1 bản v2 hiển thị < A shadow... và > A figure... Điều nào đúng?', ['< thuộc v1 và > thuộc v2', '< thuộc v2 và > thuộc v1', 'Cả hai là lệnh cần chạy', 'Các tệp đã tự đổi nội dung'], 0, 'Các ký hiệu thể hiện nội dung của hai đầu vào trong dạng diff thường.'),
([2], 'unified', 'Với diff -u, dòng bắt đầu - và + (không tính tiêu đề) biểu thị gì?', ['Nội dung bị bỏ từ tệp đầu và được thêm ở tệp sau', 'Quyền đọc và ghi', 'Lệnh đã chạy và chưa chạy', 'Tệp ẩn và tệp thường'], 0, 'Unified diff hiển thị thay đổi và ngữ cảnh; chỉ cách trình bày khác, không tự áp dụng thay đổi.'),
([2], 'diff-error', 'diff báo No such file or directory và exit 2. Nên làm gì?', ['Coi như tìm được khác biệt', 'Kiểm tra cwd, tên và đường dẫn tệp rồi chạy lại', 'Đặt điểm đạt vì đã gõ diff', 'Xóa mọi tệp trong project'], 1, 'Đây là lỗi truy cập đầu vào, chưa phải một phép so sánh hợp lệ.'),
])
group('linux-permissions-of-files', [
([1], 'ls-permissions', 'Ký tự đầu tiên - trong -rw-rw-r-- thường chỉ loại gì?', ['Tệp thường', 'Thư mục', 'Nhóm sudo', 'Mật khẩu bị khóa'], 0, 'Ký tự loại tệp đứng trước 9 bit quyền; d biểu thị thư mục, - biểu thị tệp thường.'),
([1], 'permission-order', 'Chín ký tự quyền chia theo thứ tự nào?', ['Owner, group, others', 'Others, owner, group', 'Root, sudo, labex', 'Read, rename, remove'], 0, 'Ba nhóm ba bit là quyền của chủ sở hữu, nhóm sở hữu và những người còn lại.'),
([2], 'chown', 'sudo chown root:root example.txt thay đổi gì?', ['Chủ sở hữu và nhóm sở hữu', 'Chỉ quyền 700', 'Nội dung tệp', 'Tên tệp'], 0, 'USER:GROUP chỉ định cả chủ sở hữu lẫn nhóm; chmod mới thay bit quyền truy cập.'),
([2], 'chown-parts', 'sudo chown :labex example.txt có ý nghĩa gì?', ['Chỉ đổi nhóm sở hữu thành labex', 'Chỉ đổi owner thành labex', 'Xóa owner', 'Khóa tệp'], 0, 'Phần trước dấu : bị bỏ trống nên owner được giữ nguyên, phần group được đổi.'),
([3], 'recursive-owner', 'Muốn đổi owner/group của new-dir và mọi tệp con, chọn lệnh nào?', ['sudo chown -R root:root new-dir', 'sudo chown root:root new-dir luôn đủ', 'chmod -R root:root new-dir', 'ls -R root:root new-dir'], 0, 'chown -R duyệt đệ quy. chown chỉ trên thư mục không tự đổi tất cả nội dung bên trong.'),
([4], 'mode700', 'Quyền 700 tương ứng với gì?', ['Owner rwx, group --- , others ---', 'Mọi người rwx', 'Owner r--, group r--, others r--', 'Owner rw-, group rw-, others ---'], 0, 'r=4, w=2, x=1. 7=4+2+1; hai số 0 không cấp bit nào cho group và others.'),
([4], 'denied-read', 'example.txt thuộc root:root, mode 700. labex không có quyền đặc biệt chạy cat không sudo sẽ thế nào?', ['Bị từ chối đọc', 'Đọc được vì mode có số 7', 'Tự đổi owner', 'Tệp bị xóa'], 0, 'Số 7 chỉ áp dụng cho owner root; group/others không có quyền đọc.'),
([5], 'directory-x', 'Quyền x trên thư mục dùng chủ yếu cho việc gì?', ['Tìm/truy cập các tên bên trong khi đã biết đường dẫn', 'Chạy thư mục như chương trình', 'Nén thư mục', 'Chỉ đổi mật khẩu'], 0, 'x trên thư mục là search/traverse. Đọc danh sách tên cần r; tạo/xóa mục thường cần w và x trên thư mục cha.'),
([5], 'mode755', 'chmod -R 755 ~/test-dir đặt quyền nào trong phạm vi đệ quy?', ['Owner rwx, group r-x, others r-x', 'Owner rw-, group rw-, others ---', 'Mọi người chỉ đọc', 'Chỉ đổi thư mục gốc, không duyệt con'], 0, '-R áp dụng đệ quy. 755 còn cấp x cho cả tệp thường bên trong, nên cần cân nhắc khi dùng thực tế.'),
([6], 'script-execute', 'Script thuộc labex đã đọc được nhưng thiếu quyền chạy. Cách nào cho owner quyền thực thi rồi chạy trực tiếp?', ['chmod u+x script.sh rồi ./script.sh', 'chown +x script.sh rồi cat script.sh', 'touch script.sh luôn đủ', 'ls -l script.sh tự cấp quyền'], 0, 'chmod u+x thêm bit execute cho owner; ./ chỉ đường dẫn tệp hiện tại. Shebang quyết định trình thông dịch khi thực thi trực tiếp.'),
])
group('shell-change-file-ownership', [
([1], 'touch-location', 'Đang ở thư mục bất kỳ, lệnh nào tạo đúng target_file tại project của labex?', ['touch ~/project/target_file', 'mkdir ~/project/target_file', 'touch /target_file', 'cat ~/project/target_file'], 0, 'Đường dẫn ~/project xác định vị trí theo home, không phụ thuộc cwd.'),
([1], 'touch-preserves', 'touch target_file trên một tệp đã có nội dung mặc định có xóa nội dung không?', ['Không, chủ yếu cập nhật thời gian truy cập/sửa đổi', 'Có, luôn xóa sạch', 'Luôn đổi owner về root', 'Luôn đổi mode thành 777'], 0, 'touch không phải lệnh xóa/truncate nội dung.'),
([2], 'user-group', 'Yêu cầu owner user1 và group group1. Chọn lệnh đúng.', ['sudo chown user1:group1 ~/project/target_file', 'sudo chmod user1:group1 ~/project/target_file', 'sudo chown group1:user1 ~/project/target_file', 'sudo chown user1 ~/project/target_file luôn đổi cả group1'], 0, 'chown USER:GROUP đặt đúng cả hai thuộc tính; chỉ USER không mặc nhiên chọn một nhóm tùy ý group1.'),
([2], 'ownership-precondition', 'chown báo invalid user: user1:group1. Nguyên nhân cần kiểm tra trước là gì?', ['Tài khoản/nhóm đích chưa tồn tại hoặc sai tên trong môi trường lab', 'Cần chmod 777 mọi tệp', 'Do nội dung tệp rỗng', 'Do chưa chạy diff'], 0, 'Chown phải phân giải tên user/group tồn tại; cần kiểm tra đúng môi trường và bước chuẩn bị.'),
([3], 'mode760', 'Chuỗi -rwxrw---- ứng với mode số nào?', ['760', '700', '755', '644'], 0, 'Owner rwx=7; group rw-=6; others ---=0.'),
([3], 'chmod-vs-owner', 'Sau chmod 760, owner/group có tự trở thành user1:group1 không?', ['Không; chmod và chown điều khiển các thuộc tính khác nhau', 'Có, mode 760 chỉ dành cho user1', 'Có nếu tệp rỗng', 'Chỉ group đổi'], 0, 'Bài cần kiểm tra cả ownership lẫn mode. Chỉ đổi bit quyền không hoàn thành yêu cầu ownership.'),
])
group('linux-user-account-management', [
([1], 'useradd', 'Trong Ubuntu lab, sudo useradd joker không có -m có bảo đảm tạo home không?', ['Không; cần -m nếu muốn yêu cầu tạo home rõ ràng', 'Có, useradd luôn tạo home', 'Lệnh này chỉ đổi mật khẩu', 'Nó chỉ tạo group sudo'], 0, 'Hành vi mặc định phụ thuộc cấu hình; -m yêu cầu tạo thư mục home. Trong bài này bước riêng minh họa -m với bob.'),
([2], 'useradd-home', 'Lệnh nào tạo bob và yêu cầu tạo thư mục home mặc định?', ['sudo useradd -m bob', 'sudo useradd -d bob', 'sudo passwd bob', 'sudo userdel -m bob'], 0, '-m yêu cầu tạo home và sao chép skeleton theo cấu hình.'),
([3], 'passwd', 'Lệnh nào đặt mật khẩu cho joker với quyền quản trị?', ['sudo passwd joker', 'sudo usermod -d joker', 'sudo chown joker', 'id -p joker'], 0, 'passwd đặt/đổi mật khẩu; nhập mật khẩu vào prompt, không cần đưa mật khẩu lên chat hoặc dòng lệnh.'),
([3], 'password-input', 'Khi nhập mật khẩu trong terminal không thấy dấu * hoặc ký tự. Nên hiểu thế nào?', ['Thường là cơ chế ẩn đầu vào; vẫn nhập rồi nhấn Enter', 'Bàn phím chắc chắn bị hỏng', 'Phải dán mật khẩu vào chat AI', 'Cần dùng chmod 777'], 0, 'Prompt mật khẩu thường tắt echo hoàn toàn để tránh lộ nội dung và độ dài mật khẩu.'),
([4], 'usermod-home', 'sudo usermod -d /home/wayne joker không có -m làm gì?', ['Đổi trường home của tài khoản, không tự di chuyển dữ liệu home cũ', 'Luôn chuyển toàn bộ dữ liệu home', 'Đổi shell', 'Xóa joker'], 0, '-d đặt đường dẫn home; -m mới yêu cầu chuyển nội dung home cùng thay đổi này.'),
([5], 'usermod-shell', 'Lệnh nào đổi login shell của joker thành /bin/bash?', ['sudo usermod -s /bin/bash joker', 'sudo usermod -d /bin/bash joker', 'sudo passwd -s joker', 'sudo chmod /bin/bash joker'], 0, '-s chỉ định login shell; -d là home directory.'),
([6], 'append-group', 'Vì sao dùng usermod -aG sudo joker thay vì chỉ -G sudo?', ['-a giữ các nhóm bổ sung hiện có khi thêm nhóm mới', '-a xóa mọi nhóm cũ', '-G đổi home', '-a tắt sudo'], 0, 'Không có -a, danh sách -G có thể thay thế các nhóm bổ sung trước đó; cần tránh làm mất nhóm ngoài ý muốn.'),
([6], 'su-sudo', 'su - joker và sudo cat /etc/shadow khác nhau thế nào?', ['su - mở phiên đăng nhập của joker; sudo nâng quyền cho lệnh được cho phép', 'Cả hai chỉ in tên', 'su luôn bỏ qua mật khẩu với mọi user', 'sudo đổi home vĩnh viễn'], 0, 'su - chuyển ngữ cảnh đăng nhập; sudo thực thi lệnh theo chính sách. Thành viên nhóm và cấu hình sudo quyết định quyền.'),
([7], 'password-lock', 'sudo passwd -l joker rồi -u có ý nghĩa gì?', ['Khóa rồi mở khóa mật khẩu của joker', 'Xóa rồi tạo lại tài khoản', 'Khóa rồi xóa thư mục home', 'Đổi shell rồi đổi nhóm'], 0, 'Khóa mật khẩu không phải xóa tài khoản; cũng không bảo đảm chặn mọi cơ chế đăng nhập khác, ví dụ SSH key.'),
([8], 'userdel', 'sudo userdel -r bob khác userdel bob ở đâu?', ['-r còn yêu cầu xóa home và mail spool', '-r giữ nguyên home', '-r chỉ khóa mật khẩu', '-r tạo bản sao lưu tự động'], 0, 'userdel không -r thường giữ home. -r yêu cầu xóa home/mail spool; tệp ở vị trí khác có thể vẫn còn.'),
])
group('linux-the-jokers-trick', [
([1], 'custom-home', 'Lệnh nào tạo batman với home /home/gotham và yêu cầu tạo thư mục đó?', ['sudo useradd -m -d /home/gotham batman', 'sudo useradd -s /home/gotham batman', 'sudo usermod -m batman', 'sudo passwd /home/gotham'], 0, '-d chọn đường dẫn home, -m tạo thư mục. -s là shell, không phải home.'),
([1], 'passwd-fields', 'Trong bản ghi /etc/passwd, trường home và login shell thể hiện gì?', ['Đường dẫn home được cấu hình và chương trình shell đăng nhập', 'Mật khẩu dạng rõ và địa chỉ mạng', 'Hai nhóm sudo', 'Hai tệp bắt buộc phải có cùng tên'], 0, 'Bản ghi mô tả tài khoản; trường home có thể trỏ tới đường dẫn chưa tồn tại nếu không tạo nó.'),
([2], 'password-status', 'passwd -S joker có trạng thái P nghĩa là gì?', ['Tài khoản có mật khẩu dùng được theo trạng thái passwd', 'Chắc chắn có quyền sudo', 'Tài khoản đã bị xóa', 'Mật khẩu đã lộ ra màn hình'], 0, 'P không chứng minh sudo, shell hay mọi chính sách đăng nhập đều cho phép truy cập.'),
([2], 'sample-password', 'password123 trong bài nên được dùng như thế nào?', ['Chỉ làm ví dụ cho môi trường lab biệt lập, không dùng lại cho tài khoản thật', 'Dùng chung cho mọi máy sản xuất', 'Gửi cho AI để lưu', 'Ghi vào kho mã công khai'], 0, 'Mật khẩu mẫu đơn giản phục vụ thực hành; tài khoản thực tế cần mật khẩu riêng và chính sách phù hợp.'),
([3], 'modify-accounts', 'Cặp lệnh nào đáp ứng đổi home joker và shell batman?', ['usermod -d /home/arkham joker; usermod -s /bin/bash batman (chạy bằng sudo)', 'chmod /home/arkham joker; chown /bin/bash batman', 'passwd -d joker; passwd -l batman', 'userdel joker; userdel batman'], 0, 'usermod sửa thuộc tính tài khoản. Phải phân biệt -d với -s và không nhầm với passwd -d (xóa mật khẩu).'),
([3], 'home-not-created', 'Đã usermod -d /home/arkham joker nhưng thư mục đó chưa có. Điều nào đúng?', ['Thuộc tính home có thể đã đổi dù thư mục chưa được tạo', 'Lệnh chắc chắn chưa chạy', 'Shell luôn tự tạo home ngay', 'UID đã trở thành 0'], 0, 'Đổi metadata và tạo/di chuyển thư mục là hai việc khác nhau; kiểm tra cả bản ghi tài khoản lẫn trạng thái filesystem khi cần.'),
([4], 'delete-keep-home', 'Muốn xóa joker nhưng giữ dữ liệu home hiện có, dùng cách nào?', ['sudo userdel joker, không thêm -r', 'sudo userdel -r joker', 'sudo rm -rf /home', 'sudo passwd -l joker'], 0, 'userdel không -r xóa tài khoản và thường giữ home; passwd -l chỉ khóa mật khẩu, không xóa tài khoản.'),
([4], 'verify-delete', 'Để xác minh đã xóa batman cùng /home/gotham, cần kiểm tra gì?', ['Tài khoản không còn và thư mục /home/gotham không còn', 'Chỉ thấy chữ userdel trong lịch sử', 'Chỉ khóa mật khẩu', 'Chỉ đổi shell sang bash'], 0, 'Yêu cầu gồm trạng thái cơ sở dữ liệu tài khoản và filesystem. Có thể dùng getent passwd batman và kiểm tra đúng đường dẫn home.'),
])

bank = dict(id='quick-start-linux-final', course_id='quick-start-with-linux', order=11,
    title='Bài 11 — Kiểm tra tổng kết Quick Start with Linux', version=1, pass_percent=80,
    provenance='local-authored', groups=groups)
target = ROOT / 'server/data/assessments/quick-start-linux-final.json'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Wrote {sum(len(g["questions"]) for g in groups)} questions across {len(groups)} labs.')
