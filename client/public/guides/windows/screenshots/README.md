# Actual Windows interface screenshots

These 14 PNG files are **unmodified reference screenshots** published in Server World's Windows Server 2022 tutorials. They are not AI-generated images, not redrawn GUI mockups and not captures of the project's Azure VM. Keep the source credits with the lesson images. `sources.json` records each original image URL, source tutorial, dimensions and SHA-256 digest. No claim of ownership or public-domain licensing is made.

Sources:

- [User accounts](https://www.server-world.info/en/note?os=Windows_Server_2022&p=active_directory&f=4)
- [Group accounts](https://www.server-world.info/en/note?os=Windows_Server_2022&p=active_directory&f=6)
- [Organizational units](https://www.server-world.info/en/note?os=Windows_Server_2022&p=active_directory&f=7)
- [IIS websites](https://www.server-world.info/en/note?os=Windows_Server_2022&p=iis&f=4)

The domain, OU, user, group and IIS binding values in these images belong to the original examples. Current lab instructions specify different values; each image gallery explains that distinction. Do not edit the screenshot pixels to make examples appear to be captures of this VM.

Update/import:

```text
python -X utf8 scripts/import-windows-real-screenshots.py
```

The old vector artwork remains in the parent directory for history; the AD/IIS lessons now link these PNG screenshots. Do not run the older vector lesson migration to replace the current reference galleries. When updating screenshot assets, inspect them visually and retain attribution.

VM inspection in this change: Windows Server 2022 is a WORKGROUP member server (`DomainRole=2`) and lacks ActiveDirectory/WebAdministration modules. It was temporarily started only for a read-only check and then returned to its original deallocated state. No roles/domain, sample accounts or IIS sites were created just to obtain these images.
