; Script d'installation personnalisé pour OpenSound

!macro preInit
    SetRegView 64
    ReadRegStr $INSTDIR HKLM "${PRODUCT_UNINST_KEY}" "InstallPath"
    ${If} $INSTDIR == "" 
        StrCpy $INSTDIR "$PROGRAMFILES64\OpenSound"
    ${EndIf}
!macroend

; Page de licence
!macro customLicensePage
    !insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!macroend

; Page de fin personnalisée
!macro customFinishPage
    !define MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN_TEXT "Lancer OpenSound"
    !define MUI_FINISHPAGE_RUN_FUNCTION "LaunchApp"
    !insertmacro MUI_PAGE_FINISH
!macroend

; Fonction pour lancer l'application
Function "LaunchApp"
    ExecWait '"$INSTDIR\OpenSound.exe"'
FunctionEnd

; Section d'installation
Section "MainSection" SEC01
    SetOutPath "$INSTDIR"
    
    ; Copier les fichiers de l'application
    File /r "dist-electron\*"
    
    ; Créer les raccourcis
    CreateShortCut "$DESKTOP\OpenSound.lnk" "$INSTDIR\OpenSound.exe"
    CreateShortCut "$SMPROGRAMS\OpenSound.lnk" "$INSTDIR\OpenSound.exe"
    
    ; Inscrire l'application
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "InstallPath" "$INSTDIR"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayName" "OpenSound"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninstall.exe"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\OpenSound.exe"
    
    ; Créer le programme de désinstallation
    WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

; Section de désinstallation
Section "Uninstall"
    Delete "$INSTDIR\uninstall.exe"
    Delete "$DESKTOP\OpenSound.lnk"
    Delete "$SMPROGRAMS\OpenSound.lnk"
    
    RMDir /r "$INSTDIR"
    
    DeleteRegKey HKLM "${PRODUCT_UNINST_KEY}"
SectionEnd
