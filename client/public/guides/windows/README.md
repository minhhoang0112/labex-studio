# Windows lab illustrations

**Current AD/IIS lessons use actual PNG screenshots instead of these drawings.** See `screenshots/README.md` and `scripts/import-windows-real-screenshots.py`. The vector generator preserves lessons that already contain screenshot galleries; use the screenshot importer for the current workflow.

Eight original SVG teaching diagrams, each in Vietnamese (`-vi`) and English (`-en`). These are labeled illustrations, not screenshots or a representation of the current VM configuration. Domain `corp.local` is an example; use the actual lab domain when practicing.

Topics: AD structure, opening ADUC, creating OUs, creating a user, group membership, IIS structure, opening IIS Manager and the Add Website fields. The website path `C:\inetpub\wwwroot` and port 8080 match the current practical step, rather than the old intro's conflicting `portal` path.

Regenerate from the project root:

```text
python -X utf8 scripts/generate-windows-illustrations.py
```

The generator replaces ASCII diagram fences in the two corresponding lab JSON files, preserves command fences, graders and section IDs, and can be rerun without inserting duplicate images. It backs up the original lesson files under `.artifacts/windows-before-illustrations/`. Run it again after deliberately regenerating those lesson JSON files from older import scripts.

UI labels and workflow references:

- [Microsoft: Manage user accounts with ADUC](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage-user-accounts-in-windows-server)
- [Microsoft: Build a static website on IIS](https://learn.microsoft.com/en-us/iis/manage/creating-websites/scenario-build-a-static-website-on-iis)

`GuideImage.jsx` supplies click-to-enlarge, captions, Escape dismissal and focus restoration. `scripts/check-guide-illustrations.mjs` checks all six affected sections at widths 390, 768 and 1440 using actual JSON/assets and mocked runtime status only. Latest result: 18 checks passed; no VM session opened.
