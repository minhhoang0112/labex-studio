# Bản dịch Noobs: bài 20–37

Ngày thực hiện: 17/10/2026.

Đã dịch đầy đủ phần giải thích tiếng Anh đang có trong 18 bài Linux for Noobs, thứ tự 20–37: 103 mục hướng dẫn và 67 bước thực hành tương ứng. Nội dung tiếng Việt gồm tên mục, nội dung, nhiệm vụ và gợi ý. Đã sửa cả tên bài bị lệch nghĩa, ví dụ bài trích xuất email không còn ghi thêm số điện thoại; bài cài gói giám sát không còn được gọi là cài và gỡ gói nói chung.

Nguồn dịch là trường `content` tiếng Anh trong mã nguồn local do người dùng cung cấp. Bản dịch này không chứng minh những nội dung đó giống từng câu với LabEx sau đăng nhập. Không bổ sung đề bài, thay đổi yêu cầu hoặc dịch các chuỗi lệnh cần chạy.

## Dữ liệu để tái áp dụng

`server/data/translations/noobs-operations.vi.json` có dạng:

```json
{
  "lab-id": {
    "title_vi": "Tên bài",
    "sections": [
      {
        "position": 0,
        "title_vi": "Giới thiệu",
        "content_vi": "Nội dung đầy đủ",
        "source_content_sha256": "SHA-256 của content tiếng Anh"
      }
    ]
  }
}
```

Bước thực hành có thêm `task_vi` và `hint_vi`. Áp dụng theo `position` cho cả `sections` và `steps` tương ứng. Chỉ ghi các trường bản dịch; không sao chép đè bộ chấm hoặc thông tin môi trường. Hash phát hiện trường hợp nội dung tiếng Anh thay đổi sau khi dịch để yêu cầu xem xét bản dịch thay vì áp dụng nhầm.

## Đã kiểm tra

- 18 bài, 103 mục, 67 bước có bản dịch.
- 360 khối code có hàng rào giữ nguyên từng byte giữa `content` và `content_vi`.
- Toàn bộ đoạn mã inline có cùng nội dung và số lần xuất hiện giữa hai ngôn ngữ.
- `title_vi`, `content_vi`, `task_vi`, `hint_vi` ở các bước thực hành khớp mục tương ứng.
- Không thay đổi `content` tiếng Anh, ID, lệnh kiểm tra, yêu cầu khả năng runtime hoặc manifest môi trường.

Các thuật ngữ cần thiết như Bash, SSH, SCP, systemd, journal, firewall, manifest và tên trường được giữ khi chúng giúp người học đối chiếu lệnh; phần diễn giải đã được dịch đầy đủ. Mật khẩu thực hành, tên tệp, nội dung đầu ra và script mẫu được giữ nguyên.
