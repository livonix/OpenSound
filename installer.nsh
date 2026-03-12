; Script NSIS personnalisé pour OpenSound
; Ajout de pages personnalisées et d'options

; Page de licence personnalisée
!macro customWelcomePage
  !insertmacro MUI_PAGE_WELCOME
  !insertmacro MUI_PAGE_LICENSE "${PROJECT_SOURCE_DIR}/LICENSE.txt"
!macroend

; Page de choix d'installation
!macro customDirectoryPage
  !insertmacro MUI_PAGE_DIRECTORY
!macroend

; Page de choix du type d'installation
!macro customComponentsPage
  !insertmacro MUI_PAGE_COMPONENTS
  !insertmacro MUI_PAGE_INSTFILES
!macroend

; Page de fin avec options
!macro customFinishPage
  !insertmacro MUI_PAGE_FINISH
!macroend

; Section principale
Section "OpenSound" SEC01
  ; Installation par défaut
SectionEnd

; Section pour les raccourcis bureau
Section /o "Créer un raccourci sur le bureau" SEC02
  CreateShortCut "$DESKTOP\OpenSound.lnk" "$INSTDIR\OpenSound.exe"
SectionEnd

; Section pour le démarrage automatique
Section /o "Lancer OpenSound au démarrage de Windows" SEC03
  CreateShortCut "$SMSTARTUP\OpenSound.lnk" "$INSTDIR\OpenSound.exe"
SectionEnd

; Langue française
!insertmacro MUI_LANGUAGE "French"
