import fs from "node:fs";

const filePath = "client/src/views/CourseCatalog.jsx";
let content = fs.readFileSync(filePath, "utf8");

const windowsItem = `            { 
              alias: 'windows',
              name: 'Windows Server', 
              subtitle: 'Active Directory & PowerShell',
              desc: 'Quản trị hệ thống Windows Server, AD DS, Group Policy (GPO), PowerShell automation và xử lý sự cố Event Viewer.', 
              icon: Server, 
              hours: '3 khóa · 15 bài thực hành',
              badge: 'Doanh nghiệp & Thực tập',
              color: 'from-blue-600/20 to-sky-500/10 border-blue-500/30 text-blue-500',
              btnColor: 'bg-blue-600 hover:bg-blue-500 text-white'
            },
`;

if (!content.includes("alias: 'windows'")) {
  content = content.replace("lg:grid-cols-4", "lg:grid-cols-5 xl:grid-cols-5");
  content = content.replace(
    "{ \n              alias: 'devops',",
    windowsItem + "            { \n              alias: 'devops',"
  );
}

fs.writeFileSync(filePath, content, "utf8");
console.log("Successfully patched CourseCatalog.jsx with Windows Server!");
