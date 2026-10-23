# Báo cáo khảo sát môi trường AD, GPO, DNS và DHCP (LabEx Azure)

> **Đính chính Codex 2026-10-23:** báo cáo ARM bên dưới chưa chứng minh AD/GPO/DNS/DHCP trong guest đã sẵn sàng. Các ô “sẵn sàng sau start” chỉ là giả định, không được dùng làm readiness proof. Lần bật Server bằng công cụ khảo sát bị Azure từ chối `ZonalAllocationFailed` vì thiếu capacity SKU/zone; VM đã deallocate. Chưa đo role, domain, quyền SYSTEM hoặc khả năng ghi AD thật. Không resize/tạo VM/peering và không thay NIC. Cũng không thể kết luận tuyệt đối mọi đường kết nối bị chặn chỉ từ việc không có peering; cần kiểm cả VPN/NVA/đường đi và guest thực tế. Peering có tính phí dữ liệu theo tariff Azure, không khẳng định miễn phí.

- **Thời điểm khảo sát:** 2026-10-22T16:34:12Z
- **Người khảo sát:** Antigravity (theo Playbook `docs/ANTIGRAVITY_AD_GPO_DNS_DHCP_IMPLEMENTATION_PLAN.md`)
- **Trạng thái khảo sát:** Chỉ đọc ARM và cấu hình mạng (Read-Only), không bật máy, không thay đổi cấu hình, không phát sinh chi phí.

---

## 1. Dữ kiện đo đạc thực tế từ Azure ARM

### Target: `server` (Windows Server)
- **Tên VM:** `LabEx-WinServer`
- **Resource Group:** `LabEx-India-RG`
- **Power State:** `VM deallocated` (`PowerState/deallocated`) — An toàn, không tốn chi phí compute.
- **VM Size / SKU:** `Standard_B2ats_v2` (2 vCPU, AMD-based burstable)
- **Hệ điều hành:** Windows Server 2022 Datacenter G2 (Image: `MicrosoftWindowsServer:WindowsServer:2022-datacenter-g2:20348.5761.261013`)
- **OS Disk:** `LabEx-WinServer_OsDisk_1_fe4518e17b8d41038138c0bdf628796b`
- **Giao diện mạng (NIC):** `LabEx-WinServerVMNic`
- **Virtual Network (VNet):** `LabEx-WinServerVNET` (Address space: `10.0.0.0/16`)
- **Subnet:** `LabEx-WinServerSubnet` (`10.0.0.0/24`)
- **Private IP:** `10.0.0.4` (Cấp phát: Dynamic)
- **Network Security Group (NSG):** `LabEx-WinServerNSG` (Cho phép RDP 3389, Port 80)
- **DNS Server áp dụng trên NIC:** Mặc định của Azure VNet (`appliedDnsServers: []`).

### Target: `client` (Windows 11 Client)
- **Tên VM:** `LabEx-CLIENT01`
- **Resource Group:** `LabEx-India-RG`
- **Power State:** `VM deallocated` (`PowerState/deallocated`) — An toàn.
- **VM Size / SKU:** `Standard_B2als_v2`
- **Hệ điều hành:** Windows 11 Enterprise 24H2 (Image: `MicrosoftWindowsDesktop:windows-11:win11-24h2-ent:26100.9711.261011`)
- **OS Disk:** `LabEx-CLIENT01-OS-Proven`
- **Giao diện mạng (NIC):** `LabEx-CLIENT01-NIC`
- **Virtual Network (VNet):** `LabEx-CLIENT01-VNET` (Address space: `10.42.0.0/16`)
- **Subnet:** `clients` (`10.42.0.0/24`)
- **Private IP:** `10.42.0.4` (Cấp phát: Dynamic)
- **Network Security Group (NSG):** `LabEx-CLIENT01-NSG` (Cho phép RDP 3389 từ IP gateway `171.250.165.150/32`)
- **DNS Server áp dụng trên NIC:** Mặc định của Azure VNet (`appliedDnsServers: []`).

---

## 2. Phát hiện quan trọng về Topo mạng (Network Topology)

1. **Hai VM nằm ở HAI VNet hoàn toàn tách biệt:**
   - Server: `LabEx-WinServerVNET` (`10.0.0.0/16`)
   - Client: `LabEx-CLIENT01-VNET` (`10.42.0.0/16`)
2. **Chưa có VNet Peering:**
   - Kết quả đo: `peeringsServer: []`, `peeringsClient: []`.
   - **Hệ quả thực tế:** Hiện tại `server` (10.0.0.4) và `client` (10.42.0.4) **hoàn toàn KHÔNG THỂ ping hay kết nối gói tin IP nội bộ tới nhau**.
   - Các bài thực hành cần Client kết nối tới Server (như A4 gpresult từ client, A5 Domain Join từ client, D2 query DNS từ client) sẽ **bị chặn ở tầng mạng** nếu chưa cấu hình VNet Peering 2 chiều giữa 2 VNet này.

---

## 3. Khảo sát và Đánh giá Môi trường DHCP trên Azure

1. **Giới hạn của hạ tầng Azure VNet:**
   - Theo tài liệu chính thức của Microsoft ([Azure Virtual Network FAQ](https://learn.microsoft.com/en-gb/azure/virtual-network/virtual-networks-faq) & [DHCP on Azure](https://learn.microsoft.com/en-us/azure/virtual-network/how-to-dhcp-azure)), Azure VNet lọc bỏ hoàn toàn các gói tin Broadcast UDP 67/68 của DHCP giữa các máy ảo cùng VNet.
   - Do đó, việc bật DHCP Server role trên Windows Server không thể tự động cấp phát IP qua broadcast cho CLIENT01 trên Azure VNet.
2. **Khả năng đáp ứng bài giảng:**
   - **Phần quản trị cấu hình DHCP (D3 - Scopes, Exclusions, Reservations, Options 003/006/015):** Thực hiện và chấm 100% chính xác trên `server` ở trạng thái Inactive/Active có kiểm soát mà không cần broadcast client.
   - **Phần cấp phát Lease thật qua mạng (D4 task 2, D6 task 1-2):** Đánh dấu trung thực là `blocked-runtime` trên môi trường Azure VNet đơn thuần, không dùng mock giả hay fake lease.

---

## 4. Bảng đánh giá năng lực (Capability Readiness Matrix)

| Năng lực (Capability) | Trạng thái hiện tại | Điều kiện cần để hoạt động |
|---|---|---|
| **AD DS (OU, Group, User, Delegation)** | Sẵn sàng trên `server` (sau khi start VM) | Cần khởi động `LabEx-WinServer` |
| **GPO (Create, Registry Marker, Link OU)** | Sẵn sàng trên `server` | Khởi động `LabEx-WinServer`, OU manifest riêng |
| **GPO Diagnostics từ Client (A4)** | Bị chặn do thiếu mạng | Cần VNet Peering giữa `WinServerVNET` và `CLIENT01-VNET` |
| **Domain Join từ Client (A5)** | Bị chặn do thiếu mạng | Cần VNet Peering + DNS trỏ về Server IP |
| **DNS Authoritative (Forward, Reverse, A/CNAME/PTR)** | Sẵn sàng trên `server` | Zone lab riêng biệt `lx-<run>.test`, không đụng zone AD |
| **DNS Resolver từ Client (D2)** | Bị chặn do thiếu mạng | Cần VNet Peering |
| **DHCP Scope / Option Configuration (D3)** | Sẵn sàng trên `server` | Scope Inactive, kiểm tra cmdlet/CIM |
| **DHCP Live Lease (D4, D6)** | `blocked-runtime` trên Azure VNet | Cần mạng cô lập on-prem / Hyper-V nội bộ / DHCP relay |

---

## 5. Kết luận và Hướng triển khai kế tiếp

1. **Giữ nguyên chi phí:** Cả hai máy ảo tiếp tục giữ trạng thái `deallocated`.
2. **Chiến lược triển khai theo Vertical Slice:**
   - Tập trung hoàn thiện trọn vẹn **Slice A1 (`win-adg-ou-groups`)** và **Slice D1 (`win-dnsdhcp-zones-records`)** trước:
     - Tạo generator và validator phía server.
     - Viết rule và unit test độc lập.
     - Đảm bảo cơ chế manifest/baseline/reset idempotent an toàn tuyệt đối.
3. **Trình phương án cho người dùng:**
   - Để các bài phụ thuộc Client (A4, A5, D2) hoạt động được: Cần thiết lập VNet Peering 2 chiều giữa 2 VNet hiện có (miễn phí lưu lượng nhỏ hoặc chi phí cực thấp, không cần tạo VM mới).
   - Đối với bài DHCP Lease thật: Ghi nhận trung thực giới hạn Azure VNet, không gian lận bằng dữ liệu giả.

